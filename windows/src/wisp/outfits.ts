// Wisp's auras — original DEVERA artwork, drawn in code.
// Where Mochi wore clothes, Wisp wears light: each wardrobe selection is a
// coloured aura (halo behind, thin ring in front). The selection values are
// unchanged so stored preferences keep working.
//
// Coordinates are the engine's body space: origin at the orb centre, y down.

import type { Outfit, OutfitSelection } from "./wardrobe";
import { SCRIPT_FONTS } from "../core/fonts";

type Ctx = CanvasRenderingContext2D;
type RGB = readonly [number, number, number];

/** Aura colour per wardrobe selection. */
const AURA: Record<Outfit, RGB> = {
  none: [0, 0, 0],
  partyHat: [0.94, 0.44, 0.99],
  beanie: [0.34, 0.87, 0.98],
  crown: [1.0, 0.8, 0.3],
  sunglasses: [0.5, 0.6, 1.0],
  roundGlasses: [0.18, 0.83, 0.75],
  bow: [1.0, 0.45, 0.65],
  scarf: [1.0, 0.6, 0.25],
  witchHat: [0.65, 0.45, 1.0],
  pumpkin: [1.0, 0.5, 0.15],
  santaHat: [1.0, 0.3, 0.35],
  bunnyEars: [0.8, 0.75, 1.0],
};

const css = (c: RGB, a = 1) =>
  `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

export interface OutfitState {
  /** 0 = gone, 1 = fully on. Animated by the engine. */
  presence: number;
  /** The engine's morph: auras fade away as it morphs. */
  morph: number;
}

function layerAlpha(st: OutfitState): number {
  const morphFade = 1 - Math.min(1, Math.max(0, (st.morph - 0.3) / 0.2));
  return morphFade * Math.min(1, st.presence * 2.5);
}

/** The halo behind the orb. `ctx` is in body space. */
export function drawOutfitBehind(ctx: Ctx, outfit: Outfit, R: number, st: OutfitState) {
  if (outfit === "none") return;
  const alpha = layerAlpha(st);
  if (alpha <= 0.005) return;
  const g = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.7);
  g.addColorStop(0, css(AURA[outfit], 0.5 * alpha));
  g.addColorStop(1, css(AURA[outfit], 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.7, 0, Math.PI * 2);
  ctx.fill();
}

/** The thin ring in front of the orb, drawn after the body and the eyes. */
export function drawOutfitFront(ctx: Ctx, outfit: Outfit, R: number, st: OutfitState) {
  if (outfit === "none") return;
  const alpha = layerAlpha(st);
  if (alpha <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = 0.85 * alpha;
  ctx.strokeStyle = css(AURA[outfit], 1);
  ctx.lineWidth = Math.max(1, R * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── Wardrobe icons ────────────────────────────────────────────────────────────

/** A little orb wearing the aura, centred in a `size`×`size` icon. */
function iconWisp(ctx: Ctx, size: number, outfit: Outfit) {
  const R = 10;
  const cx = size / 2;
  const cy = size / 2;
  const st: OutfitState = { presence: 1, morph: 0 };
  ctx.save();
  ctx.translate(cx, cy);
  drawOutfitBehind(ctx, outfit, R, st);
  const g = ctx.createLinearGradient(0, -R, 0, R);
  g.addColorStop(0, "#CFFAFE");
  g.addColorStop(1, "#31317F");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgb(15,23,42)";
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sd * R * 0.32, -R * 0.06, R * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  drawOutfitFront(ctx, outfit, R, st);
  ctx.restore();
}

/**
 * One wardrobe button's picture. "auto" shows the season's aura with an AUTO
 * tag, "none" a crossed-out circle.
 */
export function drawWardrobeIcon(
  ctx: Ctx,
  size: number,
  selection: OutfitSelection,
  seasonal: Outfit,
  autoLabel: string,
) {
  ctx.clearRect(0, 0, size, size);
  if (selection === "none") {
    const r = 6.5;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = "#454850";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.moveTo(-r * 0.56, r * 0.56);
    ctx.lineTo(r * 0.56, -r * 0.56);
    ctx.stroke();
    ctx.restore();
    return;
  }
  iconWisp(ctx, size, selection === "auto" ? seasonal : selection);
  if (selection !== "auto") return;
  const R = 10;
  const by = size / 2 + R * 0.62 + R * 0.88 * 0.72;
  const bw = 14;
  const bh = 6.5;
  ctx.save();
  ctx.translate(size / 2, by);
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  // A longer translation of "AUTO" gets a smaller font rather than overflowing the badge.
  let fontPx = 4.2;
  ctx.font = `600 ${fontPx}px system-ui, "Segoe UI", ${SCRIPT_FONTS}, sans-serif`;
  while (ctx.measureText(autoLabel).width > bw - 2 && fontPx > 2.6) {
    fontPx -= 0.2;
    ctx.font = `600 ${fontPx}px system-ui, "Segoe UI", ${SCRIPT_FONTS}, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(autoLabel, 0, 0.2);
  ctx.restore();
}
