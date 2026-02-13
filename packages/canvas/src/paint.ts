/**
 * @ydant/canvas - Paint engine
 *
 * Traverses a VShape tree and draws each shape to a Canvas2D context.
 */

import type { VShape } from "./vshape";

/** Reads a numeric prop with a fallback. */
function num(shape: VShape, key: string, fallback = 0): number {
  const v = shape.props.get(key);
  return v !== undefined ? Number(v) : fallback;
}

/** Applies common styling props (fill, stroke, lineWidth, font, opacity, textAlign, textBaseline). */
function applyStyle(ctx: CanvasRenderingContext2D, shape: VShape): void {
  const fill = shape.props.get("fill");
  if (fill) ctx.fillStyle = fill;

  const stroke = shape.props.get("stroke");
  if (stroke) ctx.strokeStyle = stroke;

  const lineWidth = shape.props.get("lineWidth");
  if (lineWidth) ctx.lineWidth = Number(lineWidth);

  const font = shape.props.get("font");
  if (font) ctx.font = font;

  const opacity = shape.props.get("opacity");
  if (opacity) ctx.globalAlpha = Number(opacity);

  const textAlign = shape.props.get("textAlign");
  if (textAlign) ctx.textAlign = textAlign as CanvasTextAlign;

  const textBaseline = shape.props.get("textBaseline");
  if (textBaseline) ctx.textBaseline = textBaseline as CanvasTextBaseline;
}

/** Fills and/or strokes depending on which props are set. */
function fillAndStroke(ctx: CanvasRenderingContext2D, shape: VShape): void {
  if (shape.props.has("fill")) ctx.fill();
  if (shape.props.has("stroke")) ctx.stroke();
}

/** Paints a single VShape (and its children) to a Canvas2D context. */
export function paintShape(ctx: CanvasRenderingContext2D, shape: VShape): void {
  ctx.save();
  applyStyle(ctx, shape);

  switch (shape.tag) {
    case "rect": {
      const x = num(shape, "x");
      const y = num(shape, "y");
      const w = num(shape, "width");
      const h = num(shape, "height");
      const rx = num(shape, "rx");
      if (rx > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, rx);
        fillAndStroke(ctx, shape);
      } else {
        if (shape.props.has("fill")) ctx.fillRect(x, y, w, h);
        if (shape.props.has("stroke")) ctx.strokeRect(x, y, w, h);
      }
      break;
    }
    case "circle": {
      const cx = num(shape, "cx");
      const cy = num(shape, "cy");
      const r = num(shape, "r");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      fillAndStroke(ctx, shape);
      break;
    }
    case "ellipse": {
      const cx = num(shape, "cx");
      const cy = num(shape, "cy");
      const rx = num(shape, "rx");
      const ry = num(shape, "ry");
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      fillAndStroke(ctx, shape);
      break;
    }
    case "line": {
      const x1 = num(shape, "x1");
      const y1 = num(shape, "y1");
      const x2 = num(shape, "x2");
      const y2 = num(shape, "y2");
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      break;
    }
    case "text": {
      const x = num(shape, "x");
      const y = num(shape, "y");
      const content = shape.props.get("content") ?? "";
      if (shape.props.has("fill")) ctx.fillText(content, x, y);
      if (shape.props.has("stroke")) ctx.strokeText(content, x, y);
      break;
    }
    case "path": {
      const d = shape.props.get("d");
      if (d) {
        const path2d = new Path2D(d);
        if (shape.props.has("fill")) ctx.fill(path2d);
        if (shape.props.has("stroke")) ctx.stroke(path2d);
      }
      break;
    }
    case "group":
    default:
      // Groups (and unknown tags) just render children
      break;
  }

  // Render children (groups contain child shapes)
  for (const child of shape.children) {
    paintShape(ctx, child);
  }

  ctx.restore();
}
