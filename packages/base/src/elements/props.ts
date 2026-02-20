/**
 * @ydant/base - Props parsing for element factories
 */

import type { Render } from "@ydant/core";
import { toRender } from "@ydant/core";
import type { Attribute, Listener, ElementProps, StyleValue } from "../types";
import { text } from "../primitives";

/** Parsed result of factory arguments. */
export interface ParsedFactoryArgs {
  children: Render;
  decorations?: Array<Attribute | Listener>;
  key?: string | number;
}

/** Empty render generator. */
function* emptyRender(): Render {}

/** Converts a StyleValue to a style attribute string. */
function resolveStyle(value: StyleValue): string {
  if (typeof value === "string") return value;
  return Object.entries(value as Record<string, string>)
    .map(([k, v]) => {
      const prop = k.startsWith("--") ? k : k.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${prop}: ${v}`;
    })
    .join("; ");
}

/** Event handler prefix pattern. */
const EVENT_RE = /^on([A-Z])/;

/**
 * Converts an ElementProps object into decorations array and key.
 * Separates class, style, event handlers, key, and plain attributes.
 */
function propsToElementFields(props: ElementProps): {
  decorations: Array<Attribute | Listener>;
  key?: string | number;
} {
  const decorations: Array<Attribute | Listener> = [];
  let key: string | number | undefined;

  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;

    if (k === "key") {
      key = v as string | number;
    } else if (k === "class") {
      if (v) {
        decorations.push({ type: "attribute", key: "class", value: String(v) });
      }
    } else if (k === "style") {
      const resolved = resolveStyle(v as StyleValue);
      if (resolved) {
        decorations.push({ type: "attribute", key: "style", value: resolved });
      }
    } else if (EVENT_RE.test(k) && typeof v === "function") {
      // onClick → click, onMouseDown → mousedown
      const eventName = k.slice(2).toLowerCase();
      decorations.push({ type: "listener", key: eventName, value: v as (e: Event) => void });
    } else if (v === true) {
      // Boolean HTML attribute: true → ""
      decorations.push({ type: "attribute", key: k, value: "" });
    } else {
      // Plain attribute
      decorations.push({ type: "attribute", key: k, value: String(v) });
    }
  }

  return { decorations, key };
}

/**
 * Parses factory arguments into a unified structure.
 *
 * Supported call patterns:
 * - `()` — empty element
 * - `(builder)` — existing Builder API
 * - `(text)` — text shorthand
 * - `(props)` — Props only
 * - `(props, text)` — Props + text
 * - `(props, builder)` — Props + Builder
 */
export function parseFactoryArgs(args: unknown[]): ParsedFactoryArgs {
  if (args.length === 0) {
    return { children: emptyRender() };
  }

  const first = args[0];

  // Single argument
  if (args.length === 1) {
    if (typeof first === "function") {
      // Builder
      return { children: toRender((first as () => Render | Render[])()) };
    }
    if (typeof first === "string") {
      // Text shorthand
      return { children: toRender([text(first)]) };
    }
    if (typeof first === "object" && first !== null) {
      // Props only
      const { decorations, key } = propsToElementFields(first as ElementProps);
      return { children: emptyRender(), decorations, key };
    }
  }

  // Two arguments: (props, text | builder)
  if (args.length === 2 && typeof first === "object" && first !== null) {
    const { decorations, key } = propsToElementFields(first as ElementProps);
    const second = args[1];

    if (typeof second === "string") {
      return { children: toRender([text(second)]), decorations, key };
    }
    if (typeof second === "function") {
      return {
        children: toRender((second as () => Render | Render[])()),
        decorations,
        key,
      };
    }
  }

  // Fallback: treat first arg as builder (should not normally reach here)
  if (typeof first === "function") {
    return { children: toRender((first as () => Render | Render[])()) };
  }

  return { children: emptyRender() };
}
