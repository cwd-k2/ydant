import { type Component, div, h1, p, button, text, clss, on } from "@ydant/base";
import { navigate } from "@ydant/router";

/**
 * 404 ページ
 */
export const NotFoundPage: Component = () =>
  div(function* () {
    yield* clss(["p-6", "text-center"]);
    yield* h1(() => [clss(["text-4xl", "font-bold", "mb-4", "text-red-500"]), text("404")]);
    yield* p(() => [clss(["text-gray-600", "dark:text-gray-300"]), text("Page not found")]);
    yield* button(function* () {
      yield* clss(["mt-4", "px-4", "py-2", "bg-blue-500", "text-white", "rounded"]);
      yield* on("click", () => navigate("/"));
      yield* text("Go Home");
    });
  });
