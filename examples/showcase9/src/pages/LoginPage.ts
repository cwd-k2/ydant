import type { Component } from "@ydant/core";
import { div, h1, button, input, label, text, classes, on, attr, createSlotRef } from "@ydant/base";
import { navigate } from "@ydant/router";
import { login, isLoggedIn } from "../auth";
import { refreshNavAuth } from "../components/NavBar";
import { basePath } from "../App";

export const LoginPage: Component = () =>
  div(function* () {
    yield* classes("flex", "items-center", "justify-center", "min-h-[80vh]");

    if (isLoggedIn()) {
      yield* div(function* () {
        yield* classes("text-center");
        yield* text("Already logged in. ");
        yield* button(function* () {
          yield* classes("text-blue-500", "underline");
          yield* on("click", () => navigate(`${basePath}/dashboard`));
          yield* text("Go to Dashboard");
        });
      });
      return;
    }

    let username = "";
    const errorRef = createSlotRef();

    yield* div(function* () {
      yield* classes("bg-white", "p-8", "rounded-lg", "shadow-md", "w-80");
      yield* h1(() => [classes("text-xl", "font-bold", "mb-6", "text-center"), text("Login")]);

      yield* div(function* () {
        yield* classes("mb-4");
        yield* label(() => [
          classes("block", "text-sm", "font-medium", "text-gray-700", "mb-1"),
          text("Username"),
        ]);
        yield* input(function* () {
          yield* attr("type", "text");
          yield* attr("placeholder", "Enter any username");
          yield* classes(
            "w-full",
            "px-3",
            "py-2",
            "border",
            "rounded",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-blue-300",
          );
          yield* on("input", (e) => {
            username = (e.target as HTMLInputElement).value;
          });
        });
      });

      // Login as admin
      yield* button(function* () {
        yield* classes(
          "w-full",
          "py-2",
          "mb-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "font-medium",
          "hover:bg-blue-600",
        );
        yield* on("click", () => {
          if (!username.trim()) {
            errorRef.refresh(function* () {
              yield* classes("text-red-500", "text-sm", "mt-2");
              yield* text("Please enter a username");
            });
            return;
          }
          login(username.trim(), "admin");
          refreshNavAuth();
          navigate(`${basePath}/dashboard`);
        });
        yield* text("Login as Admin");
      });

      // Login as viewer
      yield* button(function* () {
        yield* classes(
          "w-full",
          "py-2",
          "bg-gray-200",
          "text-gray-700",
          "rounded",
          "font-medium",
          "hover:bg-gray-300",
        );
        yield* on("click", () => {
          if (!username.trim()) {
            errorRef.refresh(function* () {
              yield* classes("text-red-500", "text-sm", "mt-2");
              yield* text("Please enter a username");
            });
            return;
          }
          login(username.trim(), "viewer");
          refreshNavAuth();
          navigate(`${basePath}/dashboard`);
        });
        yield* text("Login as Viewer");
      });

      errorRef.bind(yield* div(() => []));
    });
  });
