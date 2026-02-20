# @ydant/canvas

Canvas2D rendering target for Ydant. Builds a virtual shape tree and paints it to a Canvas2D context.

## Installation

```bash
pnpm add @ydant/canvas
```

## Usage

```typescript
import { scope } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { createCanvasBackend, group, rect, circle } from "@ydant/canvas";

const canvas = createCanvasBackend();

scope(canvas, [createBasePlugin()]).mount(() =>
  group(() => [
    rect({ x: "10", y: "20", width: "100", height: "50", fill: "#ff0000" }),
    circle({ cx: "200", cy: "100", r: "30", fill: "#0000ff" }),
  ]),
);

// Paint to a canvas element
const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
canvas.paint(canvasEl.getContext("2d")!);
```

The typical pattern is: **mount** (builds the virtual shape tree) then **paint** (draws to Canvas2D).

## API

### `createCanvasBackend()`

```typescript
function createCanvasBackend(): CanvasBackend;

interface CanvasBackend extends Backend<"tree" | "decorate" | "schedule"> {
  readonly root: VShapeRoot;
  paint(ctx: CanvasRenderingContext2D): void;
}
```

Creates a rendering backend for Canvas2D.

- `root` — The virtual root node (managed internally by the backend).
- `paint(ctx)` — Clears the canvas and draws all shapes. Call this after mounting or on each animation frame.

### Shape Factories

All shape factories accept an optional `Props` object as the first argument and a `Builder` as the last. Props are string key-value pairs for shape attributes.

| Factory               | Tag         | Props                                                                                 |
| --------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `group(builder)`      | `"group"`   | Container only — positions children relative to itself                                |
| `rect(builder)`       | `"rect"`    | `x`, `y`, `width`, `height`, `rx`, `fill`, `stroke`, `lineWidth`, `opacity`           |
| `circle(builder)`     | `"circle"`  | `cx`, `cy`, `r`, `fill`, `stroke`, `lineWidth`, `opacity`                             |
| `ellipse(builder)`    | `"ellipse"` | `cx`, `cy`, `rx`, `ry`, `fill`, `stroke`, `lineWidth`, `opacity`                      |
| `line(builder)`       | `"line"`    | `x1`, `y1`, `x2`, `y2`, `stroke`, `lineWidth`, `opacity`                              |
| `canvasPath(builder)` | `"path"`    | `d` (SVG path data), `fill`, `stroke`, `lineWidth`, `opacity`                         |
| `canvasText(builder)` | `"text"`    | `x`, `y`, `content`, `font`, `fill`, `stroke`, `textAlign`, `textBaseline`, `opacity` |

### `paintShape(ctx, shape)`

```typescript
function paintShape(ctx: CanvasRenderingContext2D, shape: VShape): void;
```

Low-level function that paints a single `VShape` (and its children) to a Canvas2D context. Used internally by `CanvasBackend.paint()`, but exported for advanced use cases.

### VShape Types

```typescript
interface VShape {
  kind: "shape";
  tag: string;
  props: Map<string, string>;
  children: VShape[];
}

interface VShapeRoot {
  kind: "root";
  children: VShape[];
}

type VShapeContainer = VShape | VShapeRoot;
```

## Limitations

- **No event handling** — `interact` capability is not provided. Event listeners inside a canvas shape have no effect at runtime, and cause a compile-time error when the generator type is narrow enough for `CapabilityCheck` to detect it. Hit-testing could be added in the future.
- **All props are strings** — Numeric values are passed as strings and parsed internally during paint.
- **No incremental updates** — Each `paint()` call clears the entire canvas and redraws. For animations, call `paint()` in a `requestAnimationFrame` loop.
