import { text, div, h3, p, button, classes, on } from "@ydant/base";

export interface DialogProps {
  title: string;
  content: string;
  onClose: () => void;
}

/**
 * ダイアログコンポーネント
 * 配列形式を使用した静的な構造の例
 */
export function Dialog(props: DialogProps) {
  const { title, content, onClose } = props;

  return div(() => [
    // オーバーレイ背景
    classes(
      "fixed",
      "inset-0",
      "bg-black",
      "bg-opacity-50",
      "flex",
      "items-center",
      "justify-center",
      "z-50",
    ),
    on("click", (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }),

    // ダイアログ本体
    div(() => [
      classes("bg-white", "rounded-lg", "shadow-xl", "max-w-md", "w-full", "mx-4"),

      // ヘッダー
      div(() => [
        classes("flex", "items-center", "justify-between", "p-4", "border-b"),
        h3(() => [classes("text-lg", "font-semibold", "text-gray-800"), text(title)]),
        button(() => [
          classes("text-gray-400", "hover:text-gray-600", "text-2xl", "leading-none"),
          on("click", onClose),
          text("×"),
        ]),
      ]),

      // コンテンツ
      div(() => [classes("p-4"), p(() => [classes("text-gray-600"), text(content)])]),

      // フッター
      div(() => [
        classes("flex", "justify-end", "gap-2", "p-4", "border-t"),
        button(() => [
          classes("px-4", "py-2", "bg-gray-200", "text-gray-700", "rounded", "hover:bg-gray-300"),
          on("click", onClose),
          text("Cancel"),
        ]),
        button(() => [
          classes("px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600"),
          on("click", onClose),
          text("OK"),
        ]),
      ]),
    ]),
  ]);
}
