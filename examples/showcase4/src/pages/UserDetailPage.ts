import type { Component } from "@ydant/core";
import { div, h1, p, span, button, text, classes, on } from "@ydant/base";
import type { RouteComponentProps } from "@ydant/router";
import { navigate } from "@ydant/router";
import { findUser } from "../state/users";
import { basePath } from "../App";

/**
 * ユーザー詳細ページ
 */
export const UserDetailPage: Component<RouteComponentProps> = ({ params }) =>
  div(function* () {
    yield* classes("p-6");
    const userId = parseInt(params.id, 10);
    const user = findUser(userId);

    if (user) {
      yield* h1(() => [classes("text-2xl", "font-bold", "mb-4"), text(`User: ${user.name}`)]);
      yield* div(function* () {
        yield* classes("space-y-2");
        yield* p(() => [
          span(() => [classes("font-semibold"), text("ID: ")]),
          text(String(user.id)),
        ]);
        yield* p(() => [span(() => [classes("font-semibold"), text("Email: ")]), text(user.email)]);
      });
    } else {
      yield* h1(() => [
        classes("text-2xl", "font-bold", "mb-4", "text-red-500"),
        text("User Not Found"),
      ]);
    }

    yield* button(function* () {
      yield* classes("mt-4", "px-4", "py-2", "bg-gray-500", "text-white", "rounded");
      yield* on("click", () => navigate(`${basePath}/users`));
      yield* text("← Back to Users");
    });
  });
