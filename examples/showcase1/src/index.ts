import { text, div, h1, h3, p, span, button, attr, on, type ElementGen } from "@ydant/composer";
import { render } from "@ydant/renderer";

function* main(): ElementGen<any> {
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

  return undefined as any;
}

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    const gen = main();
    render(gen, appRoot);
  }
});
