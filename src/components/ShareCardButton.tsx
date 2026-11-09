"use client";

import { useState } from "react";
import { site } from "@/config/site";

/**
 * Draws a verse card on a canvas in the browser and downloads it as PNG.
 * Uses only the verified passage text, the site's own fonts and colors — no
 * third-party imagery.
 */
export function ShareCardButton({ text, reference, direction }: { text: string; reference: string; direction: "ltr" | "rtl" }) {
  const [error, setError] = useState<string | null>(null);

  async function download() {
    try {
      await document.fonts?.ready;
      const W = 1080;
      const H = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fbf7ee";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#c9b27a";
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      ctx.direction = direction;
      ctx.textAlign = "center";
      ctx.fillStyle = "#1f1a14";
      const family = direction === "rtl" ? "Noto Naskh Arabic Variable" : "Newsreader Variable";
      let size = 56;
      let lines: string[] = [];
      const wrap = () => {
        ctx.font = `${size}px "${family}", serif`;
        lines = [];
        let line = "";
        for (const word of text.split(/\s+/)) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > W - 220 && line) {
            lines.push(line);
            line = word;
          } else line = test;
        }
        if (line) lines.push(line);
      };
      wrap();
      while (lines.length * size * 1.4 > H - 380 && size > 26) {
        size -= 4;
        wrap();
      }
      const total = lines.length * size * 1.4;
      let y = (H - total) / 2 + size - 40;
      for (const l of lines) {
        ctx.fillText(l, W / 2, y);
        y += size * 1.4;
      }
      ctx.fillStyle = "#2c5d4d";
      ctx.font = `600 34px "Plus Jakarta Sans Variable", sans-serif`;
      ctx.fillText(reference, W / 2, y + 40);
      ctx.fillStyle = "#5f564a";
      ctx.font = `26px "Plus Jakarta Sans Variable", sans-serif`;
      ctx.fillText(site.name, W / 2, H - 90);
      const mark = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = "/brand/abide-icon-96.png";
      });
      if (mark) ctx.drawImage(mark, W / 2 - 28, H - 186, 56, 56);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference.replace(/[^\p{L}\p{N}]+/gu, "-")}.png`;
      a.click();
    } catch {
      setError("Could not create the image in this browser.");
    }
  }

  return (
    <>
      <button className="btn" onClick={download}>
        Download verse image
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </>
  );
}
