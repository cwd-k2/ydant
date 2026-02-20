import type { Component } from "@ydant/core";
import { html } from "@ydant/base";
import type { RouteComponentProps } from "@ydant/router";
import { navigate } from "@ydant/router";
import { findUser } from "../state/users";
import { basePath } from "../App";

const { div, h1, p, span, button } = html;

/**
 * ユーザー詳細ページ
 */
export const UserDetailPage: Component<RouteComponentProps> = ({ params }) =>
  div({ class: "p-6" }, function* () {
    const userId = parseInt(params.id, 10);
    const user = findUser(userId);

    if (user) {
      yield* h1({ class: "text-2xl font-bold mb-4" }, `User: ${user.name}`);
      yield* div({ class: "space-y-2" }, function* () {
        yield* p(function* () {
          yield* span({ class: "font-semibold" }, "ID: ");
          yield* span(String(user.id));
        });
        yield* p(function* () {
          yield* span({ class: "font-semibold" }, "Email: ");
          yield* span(user.email);
        });
      });
    } else {
      yield* h1({ class: "text-2xl font-bold mb-4 text-red-500" }, "User Not Found");
    }

    yield* button(
      {
        class: "mt-4 px-4 py-2 bg-gray-500 text-white rounded",
        onClick: () => navigate(`${basePath}/users`),
      },
      "\u2190 Back to Users",
    );
  });
