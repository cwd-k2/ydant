import type { Component } from "@ydant/core";
import { html } from "@ydant/base";
import { navigate } from "@ydant/router";
import { basePath } from "../App";

const { div, h1, p, button } = html;

/**
 * 404 ページ
 */
export const NotFoundPage: Component = () =>
  div({ class: "p-6 text-center" }, function* () {
    yield* h1({ class: "text-4xl font-bold mb-4 text-red-500" }, "404");
    yield* p({ class: "text-gray-600 dark:text-gray-400" }, "Page not found");
    yield* button(
      {
        class: "mt-4 px-4 py-2 bg-blue-500 text-white rounded",
        onClick: () => navigate(`${basePath}/`),
      },
      "Go Home",
    );
  });
