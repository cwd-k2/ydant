import type { Component } from "@ydant/core";
import { text, div, h1, h3, p, button, clss, on, type Slot } from "@ydant/base";
import { CounterSection } from "./components/Counter";
import { Dialog } from "./components/Dialog";

/**
 * 配列形式の説明セクション
 */
function* ArraySyntaxSection() {
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
      text(
        "Array syntax is more concise for static structures. Use generator syntax when you need Slot.",
      ),
    ]),
  ]);
}

/**
 * ダイアログセクション
 */
function* DialogSection() {
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

  let isDialogOpen = false;

  // ダイアログコンテナ - Slot を取得
  const dialogContainerSlot: Slot = yield* div(function* () {
    yield* clss(["dialog-container"]);
  });

  // ダイアログを開くボタン
  yield* div(() => [
    clss(["text-center"]),
    button(function* () {
      yield* clss([
        "px-6",
        "py-3",
        "bg-green-500",
        "text-white",
        "rounded-lg",
        "hover:bg-green-600",
        "font-semibold",
      ]);
      yield* on("click", () => {
        if (!isDialogOpen) {
          isDialogOpen = true;
          dialogContainerSlot.refresh(function* () {
            yield* Dialog({
              title: "Welcome!",
              content:
                "This dialog is now a simple function. Click outside or press a button to close.",
              onClose: () => {
                isDialogOpen = false;
                dialogContainerSlot.refresh(() => []);
              },
            });
          });
        }
      });
      yield* text("Open Dialog");
    }),
  ]);
}

/**
 * 区切り線
 */
function Divider() {
  return div(() => [clss(["border-t", "border-gray-200", "my-6"])]);
}

/**
 * メインアプリケーションコンポーネント
 */
export const App: Component = () =>
  div(function* () {
    yield* clss(["container", "mx-auto", "p-6"]);

    // タイトル
    yield* h1(() => [
      clss(["text-purple-800", "mb-5", "text-center", "text-2xl", "font-bold"]),
      text("Demo Showcase 1: Ydant DSL Components (Generator-based)"),
    ]);

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
