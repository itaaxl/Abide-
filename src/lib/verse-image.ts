/**
 * Renders a verse image (PNG) entirely in the browser with <canvas>.
 * Contents: the exact verse text, reference, translation, an optional
 * reflection in a separate labelled box, the Abide mark, and the site address.
 * Never includes notes or account details.
 */

export type ImageFormat = "square" | "story";

export interface VerseImageInput {
  text: string;
  reference: string;
  translation: string;
  direction: "ltr" | "rtl";
  lang?: string;
  reflection?: { label: string; text: string };
  siteName: string;
  /** Label shown when a very long passage had to be shortened. */
  excerptLabel: string;
}

const SIZES: Record<ImageFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

const C = {
  paper: "#f7f5f0",
  glow: "#e7efe9",
  ink: "#1d1f1c",
  muted: "#565b54",
  accent: "#2c5d4d",
  rule: "#e5e2d9",
  warm: "#b07a2a",
};

/** Keep "37:4–5" in reading order inside right-to-left text (Unicode isolates). */
function isolateNumbers(s: string, rtl: boolean) {
  return rtl ? s.replace(/[\d][\d:.,–-]*/g, (m) => `⁦${m}⁩`) : s;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderVerseImage(input: VerseImageInput, format: ImageFormat): Promise<Blob> {
  const { w: W, h: H } = SIZES[format];
  const rtl = input.direction === "rtl";
  const serif = rtl ? '"Noto Naskh Arabic Variable", "Noto Naskh Arabic", serif' : '"Newsreader Variable", Georgia, serif';
  const sans = rtl ? '"IBM Plex Sans Arabic", "Plus Jakarta Sans Variable", sans-serif' : '"Plus Jakarta Sans Variable", system-ui, sans-serif';

  // Make sure the site's fonts are ready before measuring text.
  try {
    await Promise.all([
      document.fonts.load(`48px ${serif}`, input.text.slice(0, 200)),
      document.fonts.load(`600 32px ${sans}`, input.reference),
    ]);
  } catch {
    /* fall back to system fonts */
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // Background: warm paper with a soft green glow.
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W * 1.1);
  g.addColorStop(0, C.glow);
  g.addColorStop(1, "rgba(247,245,240,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const pad = format === "story" ? 110 : 100;
  const maxW = W - pad * 2;
  ctx.direction = input.direction;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Footer (logo + site name + address) occupies the bottom band.
  const footerH = 150;
  const reflectionH = input.reflection ? (format === "story" ? 260 : 190) : 0;
  const top = format === "story" ? 260 : 120;
  const refBlock = 110; // reference + translation lines
  const available = H - top - footerH - reflectionH - refBlock - 40;

  // Fit the verse: shrink the type until it fits; for very long passages,
  // keep a readable minimum and show a clearly labelled excerpt.
  const maxSize = format === "story" ? 72 : 64;
  const minSize = format === "story" ? 38 : 34;
  let size = maxSize;
  let lines: string[] = [];
  let lead = 1.42;
  for (; size >= minSize; size -= 2) {
    ctx.font = `${size}px ${serif}`;
    lead = rtl ? 1.75 : 1.42;
    lines = wrap(ctx, input.text, maxW);
    if (lines.length * size * lead <= available) break;
  }
  let excerpt = false;
  if (size < minSize) {
    size = minSize;
    ctx.font = `${size}px ${serif}`;
    lines = wrap(ctx, input.text, maxW);
    const fit = Math.max(1, Math.floor(available / (size * lead)));
    if (lines.length > fit) {
      lines = lines.slice(0, fit);
      lines[fit - 1] = `${lines[fit - 1].replace(/[\s,;:.]+$/, "")} …`;
      excerpt = true;
    }
  }

  const textH = lines.length * size * lead;
  let y = top + Math.max(0, (available - textH) / 2) + size;
  ctx.fillStyle = C.ink;
  ctx.font = `${size}px ${serif}`;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += size * lead;
  }

  // Reference and translation.
  y += 30;
  ctx.fillStyle = C.accent;
  ctx.font = `600 ${format === "story" ? 38 : 34}px ${sans}`;
  ctx.fillText(isolateNumbers(input.reference, rtl), W / 2, y);
  y += 46;
  ctx.fillStyle = C.muted;
  ctx.font = `500 ${format === "story" ? 26 : 24}px ${sans}`;
  ctx.fillText(excerpt ? `${input.translation} · ${input.excerptLabel}` : input.translation, W / 2, y);

  // Reflection: visually separate from Scripture, with its own label.
  if (input.reflection) {
    const boxY = H - footerH - reflectionH + 10;
    const boxH = reflectionH - 40;
    roundRect(ctx, pad - 10, boxY, maxW + 20, boxH, 28);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = `700 20px ${sans}`;
    ctx.fillText(input.reflection.label.toUpperCase(), W / 2, boxY + 48);
    ctx.fillStyle = C.ink;
    const rs = format === "story" ? 32 : 28;
    ctx.font = `${rs}px ${sans}`;
    const rl = wrap(ctx, input.reflection.text, maxW - 40).slice(0, format === "story" ? 4 : 3);
    rl.forEach((l, i) => ctx.fillText(l, W / 2, boxY + 48 + 44 + i * rs * 1.35));
  }

  // Footer: small logo, site name, and address.
  const host = typeof location !== "undefined" ? location.host : "";
  const mark = await loadImage("/brand/abide-icon-96.png");
  const fy = H - footerH + 40;
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.font = `700 30px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
  const nameW = ctx.measureText(input.siteName).width;
  ctx.font = `400 24px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
  const hostW = host ? ctx.measureText(host).width : 0;
  const blockW = 52 + 16 + Math.max(nameW, hostW);
  const x0 = (W - blockW) / 2;
  if (mark) ctx.drawImage(mark, x0, fy, 52, 52);
  ctx.fillStyle = C.ink;
  ctx.font = `700 30px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
  ctx.fillText(input.siteName, x0 + 68, fy + (host ? 24 : 36));
  if (host) {
    ctx.fillStyle = C.muted;
    ctx.font = `400 24px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
    ctx.fillText(host, x0 + 68, fy + 54);
  }

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}

/** Saves a blob as a file (falls back to opening it when downloads are blocked). */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 30000);
}

export function imageFilename(reference: string, format: ImageFormat) {
  return `${reference.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "verse"}-${format}.png`;
}
