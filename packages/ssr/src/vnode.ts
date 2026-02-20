/**
 * @ydant/ssr - Virtual node types
 *
 * DOM ノードの代わりに構築する仮想ノードツリー。
 * serialize で HTML 文字列に変換される。
 */

export interface VElement {
  kind: "element";
  tag: string;
  ns?: string;
  attributes: Map<string, string>;
  children: VNode[];
}

export interface VText {
  kind: "text";
  content: string;
}

export interface VRoot {
  kind: "root";
  children: VNode[];
}

export interface VMarker {
  kind: "marker";
}

export type VNode = VElement | VText | VMarker;
export type VContainer = VElement | VRoot;
