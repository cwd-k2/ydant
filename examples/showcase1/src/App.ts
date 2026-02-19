import type { Component, Render } from "@ydant/core";
import { html, slotRef } from "@ydant/base";
import { CounterSection } from "./components/Counter";
import { Dialog } from "./components/Dialog";

const { div, h1, h3, p, button } = html;

/**
 * 配列形式の説明セクション
 */
function* ArraySyntaxSection() {
  yield* h3(
    { classes: ["text-xl", "font-semibold", "text-gray-300", "mb-4"] },
    "2. Array Syntax Demo",
  );

  yield* div({ classes: ["p-4", "bg-blue-900/30", "rounded-lg"] }, function* () {
    yield* p(
      { classes: ["text-gray-300"] },
      "This section uses the array syntax: div(() => [classes(...), text(...)])",
    );
    yield* p(
      { classes: ["text-gray-400", "mt-2", "text-sm"] },
      "Array syntax is more concise for static structures. Use generator syntax when you need Slot.",
    );
  });
}

/**
 * ダイアログセクション
 */
function* DialogSection() {
  yield* h3(
    { classes: ["text-xl", "font-semibold", "text-gray-300", "mb-4"] },
    "3. Dialog Component (function example)",
  );

  yield* div({ classes: ["p-4", "bg-green-900/30", "rounded-lg", "mb-4"] }, function* () {
    yield* p(
      { classes: ["text-gray-300", "text-sm"] },
      "The Dialog component is a simple function that takes props and returns a generator.",
    );
  });

  let isDialogOpen = false;

  // ダイアログコンテナ - slotRef を使用
  const dialogContainer = slotRef(yield* div({ classes: ["dialog-container"] }));

  // ダイアログを開くボタン
  yield* div({ classes: ["text-center"] }, function* () {
    yield* button(
      {
        classes: [
          "px-6",
          "py-3",
          "bg-green-500",
          "text-white",
          "rounded-lg",
          "hover:bg-green-600",
          "font-semibold",
        ],
        onClick: () => {
          if (!isDialogOpen) {
            isDialogOpen = true;
            dialogContainer.refresh(function* () {
              yield* Dialog({
                title: "Welcome!",
                content:
                  "This dialog is now a simple function. Click outside or press a button to close.",
                onClose: () => {
                  isDialogOpen = false;
                  dialogContainer.refresh(() => []);
                },
              });
            });
          }
        },
      },
      "Open Dialog",
    );
  });
}

/**
 * 区切り線
 */
function Divider(): Render {
  return div({ classes: ["border-t", "border-slate-700", "my-6"] });
}

/**
 * メインアプリケーションコンポーネント
 */
export const App: Component = () =>
  div({ classes: ["container", "mx-auto", "p-6"] }, function* () {
    // タイトル
    yield* h1(
      { classes: ["text-purple-300", "mb-5", "text-center", "text-2xl", "font-bold"] },
      "Demo Showcase 1: Ydant DSL Components (Generator-based)",
    );

    yield* Divider();

    // セクション1: カウンター
    yield* CounterSection();

    yield* Divider();

    // セクション2: 配列形式の説明
    yield* ArraySyntaxSection();

    yield* Divider();

    // セクション3: ダイアログ
    yield* DialogSection();
  });
