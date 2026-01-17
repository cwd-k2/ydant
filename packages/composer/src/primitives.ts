import type { Attribute, EventListener } from "@ydant/interface";

export function* attr(key: string, value: string): Generator<Attribute, void, void> {
  yield { type: "attribute", key, value };
}

export function* on(
  key: string,
  handler: (e: Event) => void
): Generator<EventListener, void, void> {
  yield { type: "eventlistener", key, value: handler };
}
