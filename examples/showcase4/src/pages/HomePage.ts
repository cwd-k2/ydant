import type { Component } from "@ydant/core";
import { div, h1, h2, p, ul, li, text, classes } from "@ydant/base";

/**
 * ホームページ
 */
export const HomePage: Component = () =>
  div(function* () {
    yield* classes("p-6");
    yield* h1(() => [classes("text-3xl", "font-bold", "mb-4"), text("Welcome!")]);
    yield* p(() => [
      classes("text-gray-600", "dark:text-gray-300"),
      text("This is a demo of Ydant SPA with Router, Context, and Reactive features."),
    ]);

    yield* div(function* () {
      yield* classes("mt-6", "p-4", "bg-blue-50", "dark:bg-blue-900", "rounded");
      yield* h2(() => [classes("font-semibold", "mb-2"), text("Features used:")]);
      yield* ul(() => [
        classes("list-disc", "list-inside", "space-y-1"),
        li(() => [text("RouterView/RouterLink - Client-side navigation")]),
        li(() => [text("Context Plugin - Theme switching with persistence")]),
        li(() => [text("Reactive Plugin - Signal-based state management")]),
        li(() => [text("User-implemented Form validation")]),
      ]);
    });

    yield* div(function* () {
      yield* classes("mt-6", "p-4", "bg-green-50", "dark:bg-green-900", "rounded");
      yield* h2(() => [classes("font-semibold", "mb-2"), text("Plugin Architecture:")]);
      yield* p(() => [
        classes("text-sm"),
        text(
          "This app uses the plugin system: createReactivePlugin() and createContextPlugin() " +
            "are passed to mount() to enable each feature. " +
            "Router components (RouterView, RouterLink) work with base primitives alone.",
        ),
      ]);
    });
  });
