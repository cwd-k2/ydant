import type { Component } from "@ydant/core";
import { html, onMount } from "@ydant/base";
import { RouterView } from "@ydant/router";
import { NavBar } from "./components/NavBar";
import { applyThemeToDocument } from "./state/theme";
import { HomePage, UsersPage, UserDetailPage, ContactPage, NotFoundPage } from "./pages";

const { div } = html;

/**
 * ベースパスを検出
 * - トップレベルから実行: /showcase4
 * - showcase4 内から実行: (空文字)
 */
export const basePath = window.location.pathname.includes("/showcase4") ? "/showcase4" : "";

/**
 * メインアプリケーションコンポーネント
 */
export const App: Component = () =>
  div(
    { classes: ["min-h-screen", "bg-white", "dark:bg-gray-900", "dark:text-white"] },
    function* () {
      // テーマに応じてダークモードクラスを適用
      yield* onMount(() => {
        applyThemeToDocument();
        const interval = setInterval(applyThemeToDocument, 100);
        return () => clearInterval(interval);
      });

      yield* NavBar();

      yield* RouterView({
        base: basePath,
        routes: [
          { path: "/", component: HomePage },
          { path: "/users", component: UsersPage },
          { path: "/users/:id", component: UserDetailPage },
          { path: "/contact", component: ContactPage },
          { path: "*", component: NotFoundPage },
        ],
      });
    },
  );
