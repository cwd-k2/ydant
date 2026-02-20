import type { Render } from "@ydant/core";
import { html, text } from "@ydant/base";
import { RouterLink } from "@ydant/router";
import { reactive } from "@ydant/reactive";
import { currentTheme, toggleTheme } from "../state/theme";
import { basePath } from "../App";

const { nav, span, button } = html;

/**
 * ナビゲーションバーコンポーネント
 */
export function NavBar(): Render {
  return nav(
    {
      class: "flex gap-4 p-4 bg-gray-100 dark:bg-slate-800 border-b dark:border-slate-700",
    },
    function* () {
      yield* RouterLink({
        href: `${basePath}/`,
        children: () => span({ class: "hover:underline cursor-pointer" }, "Home"),
      });

      yield* RouterLink({
        href: `${basePath}/users`,
        children: () => span({ class: "hover:underline cursor-pointer" }, "Users"),
      });

      yield* RouterLink({
        href: `${basePath}/contact`,
        children: () => span({ class: "hover:underline cursor-pointer" }, "Contact"),
      });

      // テーマ切り替えボタン
      yield* button(
        {
          class: "ml-auto px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded",
          onClick: toggleTheme,
        },
        function* () {
          yield* reactive(() => [text(currentTheme() === "light" ? "🌙 Dark" : "☀️ Light")]);
        },
      );
    },
  );
}
