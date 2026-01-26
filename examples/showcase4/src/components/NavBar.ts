import { nav, span, button, text, clss, on } from "@ydant/base";
import { RouterLink } from "@ydant/router";
import { reactive } from "@ydant/reactive";
import { currentTheme, toggleTheme } from "../state/theme";

/**
 * ナビゲーションバーコンポーネント
 */
export function NavBar() {
  return nav(function* () {
    yield* clss(["flex", "gap-4", "p-4", "bg-gray-100", "dark:bg-gray-800", "border-b"]);

    yield* RouterLink({
      href: "/",
      children: () =>
        span(function* () {
          yield* clss(["hover:underline", "cursor-pointer"]);
          yield* text("Home");
        }),
    });

    yield* RouterLink({
      href: "/users",
      children: () =>
        span(function* () {
          yield* clss(["hover:underline", "cursor-pointer"]);
          yield* text("Users");
        }),
    });

    yield* RouterLink({
      href: "/contact",
      children: () =>
        span(function* () {
          yield* clss(["hover:underline", "cursor-pointer"]);
          yield* text("Contact");
        }),
    });

    // テーマ切り替えボタン
    yield* button(function* () {
      yield* clss(["ml-auto", "px-3", "py-1", "bg-gray-200", "dark:bg-gray-700", "rounded"]);
      yield* on("click", toggleTheme);

      yield* reactive(() => [text(currentTheme() === "light" ? "🌙 Dark" : "☀️ Light")]);
    });
  });
}
