# @ydant/canvas

Canvas2D rendering target for Ydant. Builds a virtual shape tree and paints it to a Canvas2D context.

## Installation

```bash
pnpm add @ydant/canvas
```

## Usage

```typescript
import { mount } from "@ydant/core";
import { createBasePlugin, attr } from "@ydant/base";
import { createCanvasCapabilities, group, rect, circle } from "@ydant/canvas";

const cap = createCanvasCapabilities();

mount(
  () =>
    group(() => [
      rect(() => [
        attr("x", "10"),
        attr("y", "20"),
        attr("width", "100"),
        attr("height", "50"),
        attr("fill", "#ff0000"),
      ]),
      circle(() => [
        attr("cx", "200"),
        attr("cy", "100"),
        attr("r", "30"),
        attr("fill", "#0000ff"),
      ]),
    ]),
  { root: cap.root, plugins: [cap, createBasePlugin()] },
);

// Paint to a canvas element
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
cap.paint(canvas.getContext("2d")!);
```

The typical pattern is: **mount** (builds the virtual shape tree) then **paint** (draws to Canvas2D).

## API

### `createCanvasCapabilities()`

```typescript
function createCanvasCapabilities(): CanvasCapabilities;

interface CanvasCapabilities extends Plugin<"tree" | "decorate" | "interact" | "schedule"> {
  readonly root: VShapeRoot;
  paint(ctx: CanvasRenderingContext2D): void;
}
```

Creates a capability provider for Canvas2D rendering.

- `root` — The virtual root node. Pass this as the `root` option to `mount()`.
- `paint(ctx)` — Clears the canvas and draws all shapes. Call this after `mount()` or on each animation frame.

### Shape Factories

All shape factories take a `Builder` and return a `Spell<"element">`. Use `attr()` from `@ydant/base` to set shape properties.

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

Low-level function that paints a single `VShape` (and its children) to a Canvas2D context. Used internally by `CanvasCapabilities.paint()`, but exported for advanced use cases.

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

- **No event handling** — `interact` capability is a no-op. Canvas elements don't respond to DOM events. Hit-testing could be added in the future.
- **All props are strings** — Numeric values are passed as strings via `attr()` and parsed internally during paint.
- **No incremental updates** — Each `paint()` call clears the entire canvas and redraws. For animations, call `paint()` in a `requestAnimationFrame` loop.
