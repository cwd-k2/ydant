import type { Component } from "@ydant/core";
import { div, h1, button, input, label, text, createSlotRef } from "@ydant/base";
import { navigate } from "@ydant/router";
import { login, isLoggedIn } from "../auth";
import { refreshNavAuth } from "../components/NavBar";
import { basePath } from "../App";

export const LoginPage: Component = () =>
  div({ class: "flex items-center justify-center min-h-[80vh]" }, function* () {
    if (isLoggedIn()) {
      yield* div({ class: "text-center" }, function* () {
        yield* text("Already logged in. ");
        yield* button(
          {
            class: "text-blue-500 underline",
            onClick: () => navigate(`${basePath}/dashboard`),
          },
          "Go to Dashboard",
        );
      });
      return;
    }

    let username = "";
    const errorRef = createSlotRef();

    yield* div({ class: "bg-slate-800 p-8 rounded-lg border border-slate-700 w-80" }, function* () {
      yield* h1({ class: "text-xl font-bold mb-6 text-center" }, "Login");

      yield* div({ class: "mb-4" }, function* () {
        yield* label({ class: "block text-sm font-medium text-gray-300 mb-1" }, "Username");
        yield* input({
          type: "text",
          placeholder: "Enter any username",
          class:
            "w-full px-3 py-2 border border-slate-600 bg-slate-700 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300",
          onInput: (e) => {
            username = (e.target as HTMLInputElement).value;
          },
        });
      });

      // Login as admin
      yield* button(
        {
          class: "w-full py-2 mb-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600",
          onClick: () => {
            if (!username.trim()) {
              errorRef.refresh(function* () {
                yield* text("Please enter a username");
              });
              return;
            }
            login(username.trim(), "admin");
            refreshNavAuth();
            navigate(`${basePath}/dashboard`);
          },
        },
        "Login as Admin",
      );

      // Login as viewer
      yield* button(
        {
          class: "w-full py-2 bg-slate-700 text-gray-300 rounded font-medium hover:bg-slate-600",
          onClick: () => {
            if (!username.trim()) {
              errorRef.refresh(function* () {
                yield* text("Please enter a username");
              });
              return;
            }
            login(username.trim(), "viewer");
            refreshNavAuth();
            navigate(`${basePath}/dashboard`);
          },
        },
        "Login as Viewer",
      );

      errorRef.bind(yield* div({ class: "text-red-500 text-sm mt-2" }));
    });
  });
