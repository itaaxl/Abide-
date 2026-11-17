import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { resolvePassage } from "@/lib/bible/passage";
import { getEdition } from "@/lib/bible/provider";
import { formatReference } from "@/lib/bible/reference";

/**
 * Link-preview image for a shared passage (WhatsApp, iMessage, social apps).
 * Shows the exact verse text from the dataset, the reference, the translation
 * and the site name — never any account data.
 *
 * Limitation: the image renderer cannot shape Arabic script, so Arabic
 * passages show the reference and translation without the verse text.
 */
export const alt = "Bible passage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asset = (f: string) => readFile(join(process.cwd(), "src/assets/og", f));

export default async function Image({ params }: { params: Promise<{ edition: string; ref: string }> }) {
  const { edition, ref } = await params;
  const p = ref.length <= 24 ? await resolvePassage(decodeURIComponent(ref), edition, edition) : null;
  const [serif, serifExt, sansBold, logo] = await Promise.all([
    asset("newsreader-latin-400-normal.woff"),
    asset("newsreader-latin-ext-400-normal.woff"),
    asset("plus-jakarta-sans-latin-700-normal.woff"),
    readFile(join(process.cwd(), "public/brand/abide-icon-192.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const rtl = p?.edition.direction === "rtl";
  // For Arabic, show the reference with the English book name (shaping limitation above).
  const web = rtl ? await getEdition(site.defaultEdition) : null;
  const reference = p ? (rtl && web ? formatReference(p.ref, web) : p.label) : site.name;
  // Arabic names cannot be shaped by the renderer either; name the translation in Latin script.
  const translation = p ? (rtl ? `Arabic Bible · ${p.edition.abbreviation}` : `${p.edition.name} (${p.edition.abbreviation})`) : site.tagline;
  let text = p && !rtl ? p.text : "";
  if (text.length > 300) text = `${text.slice(0, 297).replace(/\s+\S*$/, "")} …`;
  const fontSize = text.length < 90 ? 54 : text.length < 170 ? 44 : text.length < 240 ? 38 : 33;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #f7f5f0 0%, #eef3ef 100%)",
          color: "#1d1f1c",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          {text ? (
            <div style={{ fontFamily: "Newsreader", fontSize, lineHeight: 1.35 }}>{text}</div>
          ) : (
            <div style={{ fontFamily: "Newsreader", fontSize: 44, color: "#565b54" }}>{rtl ? "Read this passage in Arabic on Abide" : site.tagline}</div>
          )}
          <div style={{ marginTop: 28, fontFamily: "Jakarta", fontSize: 34, color: "#2c5d4d" }}>{reference}</div>
          <div style={{ marginTop: 6, fontFamily: "Jakarta", fontSize: 22, color: "#565b54" }}>{translation}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logoSrc} width={52} height={52} alt="" />
          <div style={{ marginLeft: 16, fontFamily: "Jakarta", fontSize: 30 }}>{site.name}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: serif, style: "normal", weight: 400 },
        { name: "Newsreader", data: serifExt, style: "normal", weight: 400 },
        { name: "Jakarta", data: sansBold, style: "normal", weight: 700 },
      ],
    },
  );
}
