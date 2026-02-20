import type { Component } from "@ydant/core";
import { div, h1, p, button, text } from "@ydant/base";
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
  div({ class: "p-6 text-center" }, function* () {
    yield* h1({ class: "text-2xl font-bold mb-4" }, "Admin Dashboard Demo");
    yield* p(
      { class: "text-gray-400 mb-6" },
      "This demo shows Route Guards (sync/async) and createResource with refetchInterval.",
    );
    yield* button(
      {
        class: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
        onClick: () => navigate(`${basePath}/login`),
      },
      "Go to Login",
    );
  });

const NotFoundPage: Component = () =>
  div({ class: "p-6 text-center" }, function* () {
    yield* h1({ class: "text-2xl font-bold mb-4" }, "404 - Not Found");
    yield* button(
      {
        class: "text-blue-500 underline",
        onClick: () => navigate(`${basePath}/`),
      },
      "Back to Home",
    );
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
  div({ class: "min-h-screen bg-slate-900" }, function* () {
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
