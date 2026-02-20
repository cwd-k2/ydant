import { html, refresh } from "@ydant/base";
import { text } from "@ydant/base";

const { div, h3, p, span, button } = html;

const COUNTER_CLASSES =
  "text-center text-3xl font-mono mb-4 p-4 bg-slate-800 rounded-lg border-2 border-slate-600";

/**
 * カウンターセクション
 * ジェネレーター形式で Slot を使用した再レンダリングの例
 */
export function* CounterSection() {
  yield* h3(
    { class: "text-xl font-semibold text-gray-300 mb-4" },
    "1. Counter Demo (Generator syntax for Slot)",
  );

  let counter = 0;

  // カウンター表示
  const counterSlot = yield* p({ class: COUNTER_CLASSES }, `Count: ${counter}`);

  // ボタン群
  yield* div({ class: "text-center mb-8" }, function* () {
    // Increment ボタン
    yield* button(
      {
        class: "counter-btn mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
        onClick: () => {
          counter++;
          refresh(counterSlot, () => [text(`Count: ${counter}`)]);
        },
      },
      "Increment",
    );

    // Reset ボタン
    yield* button(
      {
        class: "counter-btn px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
        onClick: () => {
          counter = 0;
          refresh(counterSlot, () => [
            span({ class: "text-red-500" }, "RESET: "),
            text(`${counter}`),
          ]);
        },
      },
      "Reset",
    );
  });
}
