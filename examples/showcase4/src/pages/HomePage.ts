import { type Component, div, h1, h2, p, ul, li, text, clss } from "@ydant/core";

/**
 * ホームページ
 */
export const HomePage: Component = () =>
  div(function* () {
    yield* clss(["p-6"]);
    yield* h1(() => [clss(["text-3xl", "font-bold", "mb-4"]), text("Welcome!")]);
    yield* p(() => [
      clss(["text-gray-600", "dark:text-gray-300"]),
      text("This is a demo of Ydant SPA with Router, Context, and Reactive features."),
    ]);

    yield* div(function* () {
      yield* clss(["mt-6", "p-4", "bg-blue-50", "dark:bg-blue-900", "rounded"]);
      yield* h2(() => [clss(["font-semibold", "mb-2"]), text("Features used:")]);
      yield* ul(() => [
        clss(["list-disc", "list-inside", "space-y-1"]),
        li(() => [text("RouterView/RouterLink - Client-side navigation")]),
        li(() => [text("Context Plugin - Theme switching with persistence")]),
        li(() => [text("Reactive Plugin - Signal-based state management")]),
        li(() => [text("User-implemented Form validation")]),
      ]);
    });

    yield* div(function* () {
      yield* clss(["mt-6", "p-4", "bg-green-50", "dark:bg-green-900", "rounded"]);
      yield* h2(() => [clss(["font-semibold", "mb-2"]), text("Plugin Architecture:")]);
      yield* p(() => [
        clss(["text-sm"]),
        text(
          "This app uses the plugin system: createReactivePlugin() and createContextPlugin() " +
            "are passed to mount() to enable reactive and context features.",
        ),
      ]);
    });
  });
