import type { Render } from "@ydant/core";
import { nav, span, button, text, createSlotRef } from "@ydant/base";
import { RouterLink, navigate } from "@ydant/router";
import { isLoggedIn, getUser, logout } from "../auth";
import { basePath } from "../App";

const authRef = createSlotRef();

export function refreshNavAuth(): void {
  authRef.refresh(renderAuthSection);
}

function renderAuthSection(): Render {
  if (isLoggedIn()) {
    const user = getUser()!;
    return span({ class: "flex items-center gap-3" }, function* () {
      yield* span({ class: "text-sm text-gray-300" }, `${user.name} (${user.role})`);
      yield* button(
        {
          class: "px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600",
          onClick: () => {
            logout();
            navigate(`${basePath}/`);
            refreshNavAuth();
          },
        },
        "Logout",
      );
    });
  }
  return span({ class: "text-sm text-gray-400" }, "Not logged in");
}

export function NavBar(): Render {
  return nav(
    {
      class: "flex items-center gap-4 p-4 bg-slate-800 border-b border-slate-700 text-white",
    },
    function* () {
      yield* span({ class: "font-bold text-lg" }, "Admin");

      yield* RouterLink({
        href: `${basePath}/`,
        children: () => span({ class: "hover:text-blue-300 cursor-pointer text-sm" }, "Home"),
      });

      yield* RouterLink({
        href: `${basePath}/dashboard`,
        children: () => span({ class: "hover:text-blue-300 cursor-pointer text-sm" }, "Dashboard"),
      });

      yield* span({ class: "ml-auto" });

      authRef.bind(yield* span(renderAuthSection));
    },
  );
}
