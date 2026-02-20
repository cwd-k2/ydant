import type { Component } from "@ydant/core";
import { html } from "@ydant/base";

const { div, h1, h2, p, ul, li } = html;

/**
 * ホームページ
 */
export const HomePage: Component = () =>
  div({ class: "p-6" }, function* () {
    yield* h1({ class: "text-3xl font-bold mb-4" }, "Welcome!");
    yield* p(
      { class: "text-gray-600 dark:text-gray-400" },
      "This is a demo of Ydant SPA with Router, Context, and Reactive features.",
    );

    yield* div({ class: "mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded" }, function* () {
      yield* h2({ class: "font-semibold mb-2" }, "Features used:");
      yield* ul({ class: "list-disc list-inside space-y-1" }, function* () {
        yield* li("RouterView/RouterLink - Client-side navigation");
        yield* li("Context Plugin - Theme switching with persistence");
        yield* li("Reactive Plugin - Signal-based state management");
        yield* li("User-implemented Form validation");
      });
    });

    yield* div({ class: "mt-6 p-4 bg-green-50 dark:bg-green-900 rounded" }, function* () {
      yield* h2({ class: "font-semibold mb-2" }, "Plugin Architecture:");
      yield* p(
        { class: "text-sm" },
        "This app uses the plugin system: createReactivePlugin() and createContextPlugin() " +
          "are passed to mount() to enable each feature. " +
          "Router components (RouterView, RouterLink) work with base primitives alone.",
      );
    });
  });
