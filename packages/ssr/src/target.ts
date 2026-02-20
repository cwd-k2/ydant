/**
 * @ydant/ssr - SSR Backend
 *
 * VNode ツリーを構築する能力を提供し、toHTML() で HTML 文字列に変換する。
 * DOM の代わりに VNode を構築するため、ブラウザ環境を必要としない。
 *
 * Interact / Schedule は no-op で提供する（SSR ではイベントもライフサイクルも不要）。
 */

import type {
  Backend,
  RenderContext,
  TreeCapability,
  DecorateCapability,
  InteractCapability,
  ScheduleCapability,
} from "@ydant/core";
import { toHTML } from "./serialize";
import type { VContainer, VElement, VMarker, VNode, VRoot, VText } from "./vnode";

/** The capabilities provided by the SSR backend. */
type SSRCapabilityNames = "tree" | "decorate" | "interact" | "schedule";

/** A rendering backend for SSR with HTML serialization. */
export interface SSRBackend extends Backend<SSRCapabilityNames> {
  /** The virtual root node used as the mount point. */
  readonly root: VRoot;
  /** Serializes the rendered VNode tree to an HTML string. */
  toHTML(): string;
}

/** Creates a backend for server-side rendering. */
export function createSSRBackend(): SSRBackend {
  const root: VRoot = { kind: "root", children: [] };

  const tree: TreeCapability = {
    createElement(tag: string): VElement {
      return { kind: "element", tag, attributes: new Map(), children: [] };
    },
    createElementNS(ns: string, tag: string): VElement {
      return { kind: "element", tag, ns, attributes: new Map(), children: [] };
    },
    createTextNode(content: string): VText {
      return { kind: "text", content };
    },
    createMarker(): VMarker {
      return { kind: "marker" };
    },
    appendChild(parent: unknown, child: unknown): void {
      (parent as VContainer).children.push(child as VNode);
    },
    insertBefore(parent: unknown, child: unknown, reference: unknown): void {
      const container = parent as VContainer;
      const index = container.children.indexOf(reference as VNode);
      if (index !== -1) {
        container.children.splice(index, 0, child as VNode);
      } else {
        container.children.push(child as VNode);
      }
    },
    removeChild(parent: unknown, child: unknown): void {
      const container = parent as VContainer;
      const index = container.children.indexOf(child as VNode);
      if (index !== -1) container.children.splice(index, 1);
    },
    nextSibling(parent: unknown, node: unknown): VNode | null {
      const children = (parent as VContainer).children;
      const idx = children.indexOf(node as VNode);
      return idx !== -1 && idx + 1 < children.length ? children[idx + 1] : null;
    },
    clearChildren(parent: unknown): void {
      (parent as VContainer).children = [];
    },
  };

  const decorate: DecorateCapability = {
    setAttribute(node: unknown, key: string, value: string): void {
      (node as VElement).attributes.set(key, value);
    },
  };

  // No-op capabilities: events and lifecycle are irrelevant in SSR
  const interact: InteractCapability = {
    addEventListener: () => {},
  };

  const schedule: ScheduleCapability = {
    scheduleCallback: () => {},
  };

  const isElement = (node: unknown): boolean => (node as VNode).kind === "element";

  return {
    name: "ssr-backend",
    root,
    defaultScheduler: (flush) => flush(),

    initContext(ctx: RenderContext) {
      ctx.tree = tree;
      ctx.decorate = decorate;
      ctx.interact = interact;
      ctx.schedule = schedule;
      ctx.currentElement = isElement(ctx.parent) ? ctx.parent : null;
    },

    beforeRender() {
      root.children = [];
    },

    toHTML(): string {
      return toHTML(root);
    },
  };
}
