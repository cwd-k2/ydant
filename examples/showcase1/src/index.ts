import {
  type DefineSlots,
  text,
  compose,
  h1,
  h3,
  p,
  span,
  div,
  img,
  button,
} from "@ydant/composer";
import { render } from "@ydant/renderer";

const dialogComponent = compose<{
  props: {
    open: boolean;
    title: string;
  };
  emits: {
    close: [];
  };
  slots: DefineSlots<["default"]>;
}>("dialog-modal", function* (useProp, useEmit, useSlot) {
  const isOpen = useProp("open");
  const title = useProp("title") ?? "Dialog Title";
  const child = useSlot("default");
  const emitClose = useEmit("close");

  if (!isOpen) return;

  // モーダルオーバーレイ
  yield* div()
    .class([
      "fixed",
      "inset-0",
      "bg-black",
      "bg-opacity-50",
      "flex",
      "items-center",
      "justify-center",
      "z-50",
      "p-4",
      "transition-opacity",
      "duration-300",
    ])
    .style({ animation: "fadeIn 0.3s ease-out" })
    .on("click", e => {
      // オーバーレイをクリックした際にも閉じる
      if ((e.target as HTMLElement)?.classList?.contains("bg-opacity-50")) emitClose();
    })
    .children(function* () {
      // モーダルコンテナ
      yield* div()
        .class([
          "bg-white",
          "p-6",
          "rounded-xl",
          "shadow-2xl",
          "max-w-md",
          "w-full",
          "transition-transform",
          "duration-300",
        ])
        .style({ animation: "slideUp 0.3s ease-out" })
        .children(function* () {
          // ヘッダー
          yield* div()
            .class(["flex", "justify-between", "items-center", "mb-4", "border-b", "pb-2"])
            .children(() => [
              h3()
                .class(["text-xl", "font-semibold", "text-gray-800"])
                .children(() => [text(title)]),

              // 閉じるボタン
              button()
                .class([
                  "p-2",
                  "rounded-full",
                  "text-gray-600",
                  "hover:bg-gray-100",
                  "hover:text-gray-800",
                  "transition",
                  "duration-150",
                  "w-8",
                  "h-8",
                  "flex",
                  "items-center",
                  "justify-center",
                ])
                .on("click", () => {
                  emitClose();
                })
                .children(() => [
                  p()
                    .class(["text-lg", "font-bold"])
                    .children(() => [text("✕")]),
                ]),
            ]);

          // コンテンツ
          if (child)
            yield* div()
              .class(["text-gray-600", "mb-4"])
              .children(() => [child]);

          // 状態表示
          yield* p()
            .class(["text-sm", "font-mono", "text-blue-600", "mt-2"])
            .children(() => [text(`Prop 'open' is: ${isOpen}`)]);
        });
    });
});

const main = compose("app", function* () {
  yield* h1()
    .class(["text-purple-800", "mb-5", "text-center", "text-2xl", "font-bold"])
    .children(() => [text("Demo Showcase 1: Ydant DSL Components")]);

  yield* div().class(["border-t", "border-gray-200", "my-6"]);

  yield* h3()
    .class(["text-xl", "font-semibold", "text-gray-700", "mb-4"])
    .children(() => [text("1. Reactive Component Props Demo (Dialog)")]);
  let isModalOpen = false;

  const dialog = yield* dialogComponent()
    .prop("open", isModalOpen)
    .prop("title", "Prop 駆動のモーダル")
    .on("close", () => {
      isModalOpen = false;
      dialog.prop("open", isModalOpen).apply();
    })
    .children(() => [
      p().children(() => [text("これは DSL で定義されたモーダルコンポーネントの例です。")]),
      p()
        .class(["text-sm", "mt-2"])
        .children(() => [
          text("モーダルの内容も `open` prop の値によって再レンダリングされています。"),
        ]),
      div()
        .class(["mt-4", "p-2", "bg-blue-100", "text-blue-800", "rounded"])
        .children(() => [text("親の状態: " + (isModalOpen ? "OPEN" : "CLOSED"))]),
      img()
        .prop("src", "https://placehold.co/100x20?text=Self-Closing+Tag")
        .class(["mt-4", "rounded"]),
    ]);

  yield* div()
    .class(["text-center", "mb-8"])
    .children(() => [
      button()
        .class(["counter-btn", "bg-green-500", "hover:bg-green-600"])
        .on("click", () => {
          isModalOpen = !isModalOpen;
          dialog.prop("open", isModalOpen).apply();
        })
        .children(() => [text("Toggle Dialog (Update Prop)")]),
    ]);

  yield* div().class(["border-t", "border-gray-200", "my-6"]);

  yield* h3()
    .class(["text-xl", "font-semibold", "text-gray-700", "mb-4"])
    .children(() => [text("2. Simple Counter & Custom Event Demo")]);

  let counter = 0;
  const counterDisplay = yield* p()
    .class([
      "text-center",
      "text-3xl",
      "font-mono",
      "mb-4",
      "p-4",
      "bg-gray-100",
      "rounded-lg",
      "border-2",
      "border-gray-300",
    ])
    .children(() => [text(`Count: ${counter}`)]);

  yield* div()
    .class(["text-center", "mb-8"])
    .children(() => [
      button()
        .class(["counter-btn", "mr-4"])
        .on("click", () => {
          counter++;
          // DOM を直接更新
          counterDisplay.children(() => [text(`Count: ${counter}`)]).apply();
        })
        .children(() => [text("Increment (DOM Update)")]),
      button()
        .class(["counter-btn", "bg-red-600", "hover:bg-red-700"])
        .on("click", () => {
          counter = 0;
          counterDisplay
            .children(() => [
              span()
                .class(["text-red-500"])
                .children(() => [text("RESET: ")]),
              text(`${counter}`),
            ])
            .apply();
        })
        .children(() => [text("Reset (Children Update)")]),
    ]);
});

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) render(main(), appRoot);
});
