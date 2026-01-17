import type { Text } from "@ydant/interface";

export function* text(content: string): Generator<Text, void, void> {
  yield { type: "text", content };
}
