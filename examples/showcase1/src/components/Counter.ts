import { text, div, h3, p, span, button, classes, on, createSlotRef } from "@ydant/base";

const COUNTER_CLASSES = [
  "text-center",
  "text-3xl",
  "font-mono",
  "mb-4",
  "p-4",
  "bg-gray-100",
  "rounded-lg",
  "border-2",
  "border-gray-300",
];

/**
 * カウンターセクション
 * ジェネレーター形式で Slot を使用した再レンダリングの例
 */
export function* CounterSection() {
  yield* h3(() => [
    classes("text-xl", "font-semibold", "text-gray-700", "mb-4"),
    text("1. Counter Demo (Generator syntax for Slot)"),
  ]);

  let counter = 0;

  // カウンター表示 - SlotRef を使用して再レンダリング
  const counterRef = createSlotRef();
  counterRef.bind(
    yield* p(function* () {
      yield* classes(...COUNTER_CLASSES);
      yield* text(`Count: ${counter}`);
    }),
  );

  // ボタン群
  yield* div(function* () {
    yield* classes("text-center", "mb-8");

    // Increment ボタン
    yield* button(function* () {
      yield* classes(
        "counter-btn",
        "mr-4",
        "px-4",
        "py-2",
        "bg-blue-500",
        "text-white",
        "rounded",
        "hover:bg-blue-600",
      );
      yield* on("click", () => {
        counter++;
        counterRef.refresh(() => [classes(...COUNTER_CLASSES), text(`Count: ${counter}`)]);
      });
      yield* text("Increment");
    });

    // Reset ボタン
    yield* button(function* () {
      yield* classes(
        "counter-btn",
        "px-4",
        "py-2",
        "bg-red-600",
        "text-white",
        "rounded",
        "hover:bg-red-700",
      );
      yield* on("click", () => {
        counter = 0;
        counterRef.refresh(() => [
          classes(...COUNTER_CLASSES),
          span(() => [classes("text-red-500"), text("RESET: ")]),
          text(`${counter}`),
        ]);
      });
      yield* text("Reset");
    });
  });
}
