import type { Component } from "@ydant/core";
import { div, h1, ul, li, span, button, text, classes, on } from "@ydant/base";
import { navigate } from "@ydant/router";
import { reactive } from "@ydant/reactive";
import { users, addUser, removeUser } from "../state/users";
import { basePath } from "../App";

/**
 * ユーザー一覧ページ
 */
export const UsersPage: Component = () =>
  div(function* () {
    yield* classes("p-6");
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-4"), text("Users")]);

    // 新しいユーザーを追加するボタン
    yield* button(function* () {
      yield* classes(
        "mb-4",
        "px-4",
        "py-2",
        "bg-blue-500",
        "text-white",
        "rounded",
        "hover:bg-blue-600",
      );
      yield* on("click", () => {
        const id = Date.now();
        addUser(`User ${id}`, `user${id}@example.com`);
      });
      yield* text("Add User");
    });

    // ユーザーリスト（リアクティブ）
    yield* reactive(() => [
      ul(function* () {
        yield* classes("space-y-2");

        for (const user of users()) {
          yield* li(function* () {
            yield* classes(
              "p-3",
              "bg-gray-50",
              "dark:bg-gray-700",
              "rounded",
              "flex",
              "justify-between",
              "items-center",
            );

            yield* span(() => [text(`${user.name} (${user.email})`)]);

            yield* div(() => [
              classes("flex", "gap-2"),
              button(function* () {
                yield* classes("px-2", "py-1", "bg-blue-500", "text-white", "text-sm", "rounded");
                yield* on("click", () => navigate(`${basePath}/users/${user.id}`));
                yield* text("View");
              }),
              button(function* () {
                yield* classes("px-2", "py-1", "bg-red-500", "text-white", "text-sm", "rounded");
                yield* on("click", () => removeUser(user.id));
                yield* text("Delete");
              }),
            ]);
          });
        }
      }),
    ]);
  });
