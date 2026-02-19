import { html, slotRef } from "@ydant/base";
import { text, classes } from "@ydant/base";

const { div, h3, p, span, button } = html;

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
] as const;

/**
 * カウンターセクション
 * ジェネレーター形式で Slot を使用した再レンダリングの例
 */
export function* CounterSection() {
  yield* h3(
    { classes: ["text-xl", "font-semibold", "text-gray-700", "mb-4"] },
    "1. Counter Demo (Generator syntax for Slot)",
  );

  let counter = 0;

  // カウンター表示 - slotRef を使用して再レンダリング
  const counterRef = slotRef(yield* p({ classes: [...COUNTER_CLASSES] }, `Count: ${counter}`));

  // ボタン群
  yield* div({ classes: ["text-center", "mb-8"] }, function* () {
    // Increment ボタン
    yield* button(
      {
        classes: [
          "counter-btn",
          "mr-4",
          "px-4",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "hover:bg-blue-600",
        ],
        onClick: () => {
          counter++;
          counterRef.refresh(() => [classes(...COUNTER_CLASSES), text(`Count: ${counter}`)]);
        },
      },
      "Increment",
    );

    // Reset ボタン
    yield* button(
      {
        classes: [
          "counter-btn",
          "px-4",
          "py-2",
          "bg-red-600",
          "text-white",
          "rounded",
          "hover:bg-red-700",
        ],
        onClick: () => {
          counter = 0;
          counterRef.refresh(() => [
            classes(...COUNTER_CLASSES),
            span({ classes: ["text-red-500"] }, "RESET: "),
            text(`${counter}`),
          ]);
        },
      },
      "Reset",
    );
  });
}
