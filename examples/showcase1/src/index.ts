import { text, div, h1, h3, p, span, button, attr, on, compose } from "@ydant/composer";
import { mount } from "@ydant/renderer";

// ============================================================================
// Dialog Component using compose
// ============================================================================

interface DialogProps {
  title: string;
  content: string;
  onClose: () => void;
}

const Dialog = compose<DialogProps>(function* (inject) {
  const title = yield* inject("title");
  const content = yield* inject("content");
  const onClose = yield* inject("onClose");

  return div(function* () {
    // オーバーレイ背景
    yield* attr("class", "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50");
    yield* on("click", (e) => {
      // 背景クリックで閉じる
      if (e.target === e.currentTarget) {
        onClose();
      }
    });

    // ダイアログ本体
    yield* div(function* () {
      yield* attr("class", "bg-white rounded-lg shadow-xl max-w-md w-full mx-4");

      // ヘッダー
      yield* div(function* () {
        yield* attr("class", "flex items-center justify-between p-4 border-b");
        yield* h3(function* () {
          yield* attr("class", "text-lg font-semibold text-gray-800");
          yield* text(title);
        });
        yield* button(function* () {
          yield* attr("class", "text-gray-400 hover:text-gray-600 text-2xl leading-none");
          yield* on("click", onClose);
          yield* text("×");
        });
      });

      // コンテンツ
      yield* div(function* () {
        yield* attr("class", "p-4");
        yield* p(function* () {
          yield* attr("class", "text-gray-600");
          yield* text(content);
        });
      });

      // フッター
      yield* div(function* () {
        yield* attr("class", "flex justify-end gap-2 p-4 border-t");
        yield* button(function* () {
          yield* attr("class", "px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300");
          yield* on("click", onClose);
          yield* text("Cancel");
        });
        yield* button(function* () {
          yield* attr("class", "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600");
          yield* on("click", onClose);
          yield* text("OK");
        });
      });
    });
  });
});

// ============================================================================
// Main App Component
// ============================================================================

const Main = compose<{}>(function* () {
  return div(function* () {
    yield* attr("class", "container mx-auto p-6");

    // タイトル
    yield* h1(function* () {
      yield* attr("class", "text-purple-800 mb-5 text-center text-2xl font-bold");
      yield* text("Demo Showcase 1: Ydant DSL Components (Generator-based)");
    });

    // 区切り線
    yield* div(function* () {
      yield* attr("class", "border-t border-gray-200 my-6");
    });

    // セクション1: カウンター
    yield* h3(function* () {
      yield* attr("class", "text-xl font-semibold text-gray-700 mb-4");
      yield* text("1. Simple Counter Demo");
    });

    let counter = 0;

    // カウンター表示
    const counterRefresh = yield* p(function* () {
      yield* attr("class", "text-center text-3xl font-mono mb-4 p-4 bg-gray-100 rounded-lg border-2 border-gray-300");
      yield* text(`Count: ${counter}`);
    });

    // ボタン群
    yield* div(function* () {
      yield* attr("class", "text-center mb-8");

      // Increment ボタン
      yield* button(function* () {
        yield* attr("class", "counter-btn mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600");
        yield* on("click", () => {
          counter++;
          counterRefresh(function* () {
            yield* attr("class", "text-center text-3xl font-mono mb-4 p-4 bg-gray-100 rounded-lg border-2 border-gray-300");
            yield* text(`Count: ${counter}`);
          });
        });
        yield* text("Increment");
      });

      // Reset ボタン
      yield* button(function* () {
        yield* attr("class", "counter-btn px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700");
        yield* on("click", () => {
          counter = 0;
          counterRefresh(function* () {
            yield* attr("class", "text-center text-3xl font-mono mb-4 p-4 bg-gray-100 rounded-lg border-2 border-gray-300");
            yield* span(function* () {
              yield* attr("class", "text-red-500");
              yield* text("RESET: ");
            });
            yield* text(`${counter}`);
          });
        });
        yield* text("Reset");
      });
    });

    // 区切り線
    yield* div(function* () {
      yield* attr("class", "border-t border-gray-200 my-6");
    });

    // セクション2: メッセージ
    yield* h3(function* () {
      yield* attr("class", "text-xl font-semibold text-gray-700 mb-4");
      yield* text("2. Generator-based DSL Info");
    });

    yield* div(function* () {
      yield* attr("class", "p-4 bg-blue-50 rounded-lg");
      yield* p(function* () {
        yield* attr("class", "text-gray-700");
        yield* text("This demo uses the new generator-based DSL.");
      });
      yield* p(function* () {
        yield* attr("class", "text-gray-600 mt-2 text-sm");
        yield* text("All elements, attributes, and event listeners are yielded.");
      });
    });

    // 区切り線
    yield* div(function* () {
      yield* attr("class", "border-t border-gray-200 my-6");
    });

    // セクション3: Dialog Component (compose の例)
    yield* h3(function* () {
      yield* attr("class", "text-xl font-semibold text-gray-700 mb-4");
      yield* text("3. Dialog Component (compose example)");
    });

    yield* div(function* () {
      yield* attr("class", "p-4 bg-green-50 rounded-lg mb-4");
      yield* p(function* () {
        yield* attr("class", "text-gray-700 text-sm");
        yield* text("This section demonstrates the compose() function for creating reusable components with props.");
      });
    });

    // ダイアログの状態
    let isDialogOpen = false;

    // ダイアログコンテナ（表示/非表示を制御）
    const dialogContainerRefresh = yield* div(function* () {
      yield* attr("class", "dialog-container");
      // 初期状態では空
    });

    // ダイアログを開くボタン
    yield* div(function* () {
      yield* attr("class", "text-center");
      yield* button(function* () {
        yield* attr("class", "px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold");
        yield* on("click", () => {
          if (!isDialogOpen) {
            isDialogOpen = true;
            dialogContainerRefresh(function* () {
              yield* Dialog(function* (provide) {
                yield* provide("title", "Welcome!");
                yield* provide("content", "This is a dialog component created using compose(). Click outside or press a button to close.");
                yield* provide("onClose", () => {
                  isDialogOpen = false;
                  dialogContainerRefresh(function* () {
                    // 空にしてダイアログを閉じる
                  });
                });
              });
            });
          }
        });
        yield* text("Open Dialog");
      });
    });
  });
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
