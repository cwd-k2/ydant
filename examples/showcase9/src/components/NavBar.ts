import type { Render } from "@ydant/core";
import { nav, span, button, text, classes, on, createSlotRef } from "@ydant/base";
import { RouterLink } from "@ydant/router";
import { isLoggedIn, getUser, logout } from "../auth";
import { navigate } from "@ydant/router";
import { basePath } from "../App";

const authRef = createSlotRef();

export function refreshNavAuth(): void {
  authRef.refresh(renderAuthSection);
}

function renderAuthSection(): Render {
  if (isLoggedIn()) {
    const user = getUser()!;
    return span(function* () {
      yield* classes("flex", "items-center", "gap-3");
      yield* span(() => [classes("text-sm", "text-gray-300"), text(`${user.name} (${user.role})`)]);
      yield* button(function* () {
        yield* classes(
          "px-3",
          "py-1",
          "text-sm",
          "bg-red-500",
          "text-white",
          "rounded",
          "hover:bg-red-600",
        );
        yield* on("click", () => {
          logout();
          navigate(`${basePath}/`);
          refreshNavAuth();
        });
        yield* text("Logout");
      });
    });
  }
  return span(() => [classes("text-sm", "text-gray-400"), text("Not logged in")]);
}

export function NavBar(): Render {
  return nav(function* () {
    yield* classes(
      "flex",
      "items-center",
      "gap-4",
      "p-4",
      "bg-slate-800",
      "border-b",
      "border-slate-700",
      "text-white",
    );

    yield* span(() => [classes("font-bold", "text-lg"), text("Admin")]);

    yield* RouterLink({
      href: `${basePath}/`,
      children: () =>
        span(function* () {
          yield* classes("hover:text-blue-300", "cursor-pointer", "text-sm");
          yield* text("Home");
        }),
    });

    yield* RouterLink({
      href: `${basePath}/dashboard`,
      children: () =>
        span(function* () {
          yield* classes("hover:text-blue-300", "cursor-pointer", "text-sm");
          yield* text("Dashboard");
        }),
    });

    yield* span(() => [classes("ml-auto")]);

    authRef.bind(yield* span(renderAuthSection));
  });
}
