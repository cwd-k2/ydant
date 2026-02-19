import type { Component } from "@ydant/core";
import { html } from "@ydant/base";

const { div, h3, p, button } = html;

export interface DialogProps {
  title: string;
  content: string;
  onClose: () => void;
}

/**
 * ダイアログコンポーネント
 * Props 構文を使用した宣言的な構造の例
 */
export const Dialog: Component<DialogProps> = (props) => {
  const { title, content, onClose } = props;

  return div(
    {
      // オーバーレイ背景
      classes: [
        "fixed",
        "inset-0",
        "bg-black",
        "bg-opacity-50",
        "flex",
        "items-center",
        "justify-center",
        "z-50",
      ],
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
    },
    function* () {
      // ダイアログ本体
      yield* div(
        { classes: ["bg-white", "rounded-lg", "shadow-xl", "max-w-md", "w-full", "mx-4"] },
        function* () {
          // ヘッダー
          yield* div(
            { classes: ["flex", "items-center", "justify-between", "p-4", "border-b"] },
            function* () {
              yield* h3({ classes: ["text-lg", "font-semibold", "text-gray-800"] }, title);
              yield* button(
                {
                  classes: ["text-gray-400", "hover:text-gray-600", "text-2xl", "leading-none"],
                  onClick: onClose,
                },
                "\u00d7",
              );
            },
          );

          // コンテンツ
          yield* div({ classes: ["p-4"] }, function* () {
            yield* p({ classes: ["text-gray-600"] }, content);
          });

          // フッター
          yield* div(
            { classes: ["flex", "justify-end", "gap-2", "p-4", "border-t"] },
            function* () {
              yield* button(
                {
                  classes: [
                    "px-4",
                    "py-2",
                    "bg-gray-200",
                    "text-gray-700",
                    "rounded",
                    "hover:bg-gray-300",
                  ],
                  onClick: onClose,
                },
                "Cancel",
              );
              yield* button(
                {
                  classes: [
                    "px-4",
                    "py-2",
                    "bg-blue-500",
                    "text-white",
                    "rounded",
                    "hover:bg-blue-600",
                  ],
                  onClick: onClose,
                },
                "OK",
              );
            },
          );
        },
      );
    },
  );
};
