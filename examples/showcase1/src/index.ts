import { text, div, h1, h3, p, span, button, clss, on, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";

// ============================================================================
// Dialog Component (配列形式を一部使用)
// ============================================================================

interface DialogProps {
  title: string;
  content: string;
  onClose: () => void;
}

function Dialog(props: DialogProps) {
  const { title, content, onClose } = props;

  // 配列形式: 静的な構造に適している
  return div(() => [
    // オーバーレイ背景
    clss(["fixed", "inset-0", "bg-black", "bg-opacity-50", "flex", "items-center", "justify-center", "z-50"]),
    on("click", (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }),

    // ダイアログ本体
    div(() => [
      clss(["bg-white", "rounded-lg", "shadow-xl", "max-w-md", "w-full", "mx-4"]),

      // ヘッダー
      div(() => [
        clss(["flex", "items-center", "justify-between", "p-4", "border-b"]),
        h3(() => [clss(["text-lg", "font-semibold", "text-gray-800"]), text(title)]),
        button(() => [
          clss(["text-gray-400", "hover:text-gray-600", "text-2xl", "leading-none"]),
          on("click", onClose),
          text("×"),
        ]),
      ]),

      // コンテンツ
      div(() => [
        clss(["p-4"]),
        p(() => [clss(["text-gray-600"]), text(content)]),
      ]),

      // フッター
      div(() => [
        clss(["flex", "justify-end", "gap-2", "p-4", "border-t"]),
        button(() => [
          clss(["px-4", "py-2", "bg-gray-200", "text-gray-700", "rounded", "hover:bg-gray-300"]),
          on("click", onClose),
          text("Cancel"),
        ]),
        button(() => [
          clss(["px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600"]),
          on("click", onClose),
          text("OK"),
        ]),
      ]),
    ]),
  ]);
}

// ============================================================================
// Main App Component
// ============================================================================

const Main: Component = () =>
  div(function* () {
    yield* clss(["container", "mx-auto", "p-6"]);

    // タイトル
    yield* h1(() => [
      clss(["text-purple-800", "mb-5", "text-center", "text-2xl", "font-bold"]),
      text("Demo Showcase 1: Ydant DSL Components (Generator-based)"),
    ]);

    // 区切り線
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // セクション1: カウンター（ジェネレーター形式 - Refresher が必要な場合）
    yield* h3(() => [
      clss(["text-xl", "font-semibold", "text-gray-700", "mb-4"]),
      text("1. Counter Demo (Generator syntax for Refresher)"),
    ]);

    let counter = 0;
    const counterClss = ["text-center", "text-3xl", "font-mono", "mb-4", "p-4", "bg-gray-100", "rounded-lg", "border-2", "border-gray-300"];

    // カウンター表示 - ジェネレーター形式で Refresher を取得
    const counterRefresh = yield* p(function* () {
      yield* clss(counterClss);
      yield* text(`Count: ${counter}`);
    });

    // ボタン群
    yield* div(function* () {
      yield* clss(["text-center", "mb-8"]);

      // Increment ボタン
      yield* button(function* () {
        yield* clss(["counter-btn", "mr-4", "px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600"]);
        yield* on("click", () => {
          counter++;
          counterRefresh(() => [clss(counterClss), text(`Count: ${counter}`)]);
        });
        yield* text("Increment");
      });

      // Reset ボタン
      yield* button(function* () {
        yield* clss(["counter-btn", "px-4", "py-2", "bg-red-600", "text-white", "rounded", "hover:bg-red-700"]);
        yield* on("click", () => {
          counter = 0;
          counterRefresh(() => [
            clss(counterClss),
            span(() => [clss(["text-red-500"]), text("RESET: ")]),
            text(`${counter}`),
          ]);
        });
        yield* text("Reset");
      });
    });

    // 区切り線
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // セクション2: 配列形式の説明
    yield* h3(() => [
      clss(["text-xl", "font-semibold", "text-gray-700", "mb-4"]),
      text("2. Array Syntax Demo"),
    ]);

    yield* div(() => [
      clss(["p-4", "bg-blue-50", "rounded-lg"]),
      p(() => [
        clss(["text-gray-700"]),
        text("This section uses the array syntax: div(() => [clss([...]), text(...)])"),
      ]),
      p(() => [
        clss(["text-gray-600", "mt-2", "text-sm"]),
        text("Array syntax is more concise for static structures. Use generator syntax when you need Refresher."),
      ]),
    ]);

    // 区切り線
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // セクション3: Dialog Component (compose の例)
    yield* h3(() => [
      clss(["text-xl", "font-semibold", "text-gray-700", "mb-4"]),
      text("3. Dialog Component (function example)"),
    ]);

    yield* div(() => [
      clss(["p-4", "bg-green-50", "rounded-lg", "mb-4"]),
      p(() => [
        clss(["text-gray-700", "text-sm"]),
        text("The Dialog component is a simple function that takes props and returns a generator."),
      ]),
    ]);

    // ダイアログの状態
    let isDialogOpen = false;

    // ダイアログコンテナ - ジェネレーター形式で Refresher を取得
    const dialogContainerRefresh = yield* div(function* () {
      yield* clss(["dialog-container"]);
    });

    // ダイアログを開くボタン
    yield* div(() => [
      clss(["text-center"]),
      button(function* () {
        yield* clss(["px-6", "py-3", "bg-green-500", "text-white", "rounded-lg", "hover:bg-green-600", "font-semibold"]);
        yield* on("click", () => {
          if (!isDialogOpen) {
            isDialogOpen = true;
            dialogContainerRefresh(function* () {
              yield* Dialog({
                title: "Welcome!",
                content: "This dialog is now a simple function. Click outside or press a button to close.",
                onClose: () => {
                  isDialogOpen = false;
                  dialogContainerRefresh(() => []);
                },
              });
            });
          }
        });
        yield* text("Open Dialog");
      }),
    ]);
  });

// ============================================================================
// Mount App
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(Main, appRoot);
  }
});
