import type { Component } from "@ydant/core";
import { div, clss, onMount } from "@ydant/base";
import { RouterView } from "@ydant/router";
import { NavBar } from "./components/NavBar";
import { applyThemeToDocument } from "./state/theme";
import { HomePage, UsersPage, UserDetailPage, ContactPage, NotFoundPage } from "./pages";

/**
 * メインアプリケーションコンポーネント
 */
export const App: Component = () =>
  div(function* () {
    // テーマに応じてダークモードクラスを適用
    yield* onMount(() => {
      // 初期適用
      applyThemeToDocument();

      // テーマ変更を監視（シンプルな実装）
      const interval = setInterval(applyThemeToDocument, 100);
      return () => clearInterval(interval);
    });

    yield* clss(["min-h-screen", "bg-white", "dark:bg-gray-900", "dark:text-white"]);

    yield* NavBar();

    yield* RouterView({
      routes: [
        { path: "/", component: HomePage },
        { path: "/users", component: UsersPage },
        { path: "/users/:id", component: UserDetailPage },
        { path: "/contact", component: ContactPage },
        { path: "*", component: NotFoundPage },
      ],
    });
  });
