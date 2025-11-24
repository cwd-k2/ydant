interface Text extends Generator<string, void, void> {}

export function* text(content: string): Text {
  yield content;
}
