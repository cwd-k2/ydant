import type { Component } from "@ydant/core";
import { div, h1, p, button, text, classes, on } from "@ydant/base";
import { navigate } from "@ydant/router";
import { basePath } from "../App";

/**
 * 404 ページ
 */
export const NotFoundPage: Component = () =>
  div(function* () {
    yield* classes("p-6", "text-center");
    yield* h1(() => [classes("text-4xl", "font-bold", "mb-4", "text-red-500"), text("404")]);
    yield* p(() => [classes("text-gray-600", "dark:text-gray-300"), text("Page not found")]);
    yield* button(function* () {
      yield* classes("mt-4", "px-4", "py-2", "bg-blue-500", "text-white", "rounded");
      yield* on("click", () => navigate(`${basePath}/`));
      yield* text("Go Home");
    });
  });
