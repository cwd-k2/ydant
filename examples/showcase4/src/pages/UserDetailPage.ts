import type { Component } from "@ydant/core";
import { div, h1, p, span, button, text, clss, on } from "@ydant/base";
import { useRoute, navigate } from "@ydant/router";
import { findUser } from "../state/users";

/**
 * ユーザー詳細ページ
 */
export const UserDetailPage: Component = () =>
  div(function* () {
    yield* clss(["p-6"]);
    const route = useRoute();
    const userId = parseInt(route.params.id, 10);
    const user = findUser(userId);

    if (user) {
      yield* h1(() => [clss(["text-2xl", "font-bold", "mb-4"]), text(`User: ${user.name}`)]);
      yield* div(function* () {
        yield* clss(["space-y-2"]);
        yield* p(() => [
          span(() => [clss(["font-semibold"]), text("ID: ")]),
          text(String(user.id)),
        ]);
        yield* p(() => [span(() => [clss(["font-semibold"]), text("Email: ")]), text(user.email)]);
      });
    } else {
      yield* h1(() => [
        clss(["text-2xl", "font-bold", "mb-4", "text-red-500"]),
        text("User Not Found"),
      ]);
    }

    yield* button(function* () {
      yield* clss(["mt-4", "px-4", "py-2", "bg-gray-500", "text-white", "rounded"]);
      yield* on("click", () => navigate("/users"));
      yield* text("← Back to Users");
    });
  });
