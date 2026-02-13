/**
 * @ydant/canvas - Virtual shape types
 *
 * Canvas rendering builds a virtual shape tree (analogous to SSR's VNode tree).
 * The tree is then painted to a Canvas2D context.
 */

export interface VShape {
  kind: "shape";
  tag: string;
  props: Map<string, string>;
  children: VShape[];
}

export interface VShapeRoot {
  kind: "root";
  children: VShape[];
}

export type VShapeContainer = VShape | VShapeRoot;
