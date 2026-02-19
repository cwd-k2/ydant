import type { Component } from "@ydant/core";
import { div, h1, p, button, text, classes, on } from "@ydant/base";
import { RouterView, navigate } from "@ydant/router";
import { NavBar } from "./components/NavBar";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { isLoggedIn } from "./auth";

/**
 * Detect base path for dev server routing.
 * - From root: /showcase9
 * - From showcase9 dir: (empty)
 */
export const basePath = window.location.pathname.includes("/showcase9") ? "/showcase9" : "";

const HomePage: Component = () =>
  div(function* () {
    yield* classes("p-6", "text-center");
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-4"), text("Admin Dashboard Demo")]);
    yield* p(() => [
      classes("text-gray-400", "mb-6"),
      text("This demo shows Route Guards (sync/async) and createResource with refetchInterval."),
    ]);
    yield* button(function* () {
      yield* classes("px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600");
      yield* on("click", () => navigate(`${basePath}/login`));
      yield* text("Go to Login");
    });
  });

const NotFoundPage: Component = () =>
  div(function* () {
    yield* classes("p-6", "text-center");
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-4"), text("404 - Not Found")]);
    yield* button(function* () {
      yield* classes("text-blue-500", "underline");
      yield* on("click", () => navigate(`${basePath}/`));
      yield* text("Back to Home");
    });
  });

/**
 * Main App with route guards.
 *
 * - /dashboard: sync guard (isLoggedIn)
 * - /dashboard with admin check: demonstrates async guard concept
 *
 * Guard returns false → empty view rendered. No built-in redirect.
 * The login redirect is done manually via navigate().
 */
export const App: Component = () =>
  div(function* () {
    yield* classes("min-h-screen", "bg-slate-900");

    yield* NavBar();

    yield* RouterView({
      base: basePath,
      routes: [
        { path: "/", component: HomePage },
        { path: "/login", component: LoginPage },
        {
          path: "/dashboard",
          component: DashboardPage,
          // Sync guard: must be logged in
          guard: () => {
            if (!isLoggedIn()) {
              navigate(`${basePath}/login`);
              return false;
            }
            return true;
          },
        },
        { path: "*", component: NotFoundPage },
      ],
    });
  });
