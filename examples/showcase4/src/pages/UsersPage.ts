import type { Component } from "@ydant/core";
import { html } from "@ydant/base";
import { navigate } from "@ydant/router";
import { reactive } from "@ydant/reactive";
import { users, addUser, removeUser } from "../state/users";
import { basePath } from "../App";

const { div, h1, ul, li, span, button } = html;

/**
 * ユーザー一覧ページ
 */
export const UsersPage: Component = () =>
  div({ classes: ["p-6"] }, function* () {
    yield* h1({ classes: ["text-2xl", "font-bold", "mb-4"] }, "Users");

    // 新しいユーザーを追加するボタン
    yield* button(
      {
        classes: [
          "mb-4",
          "px-4",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "hover:bg-blue-600",
        ],
        onClick: () => {
          const id = Date.now();
          addUser(`User ${id}`, `user${id}@example.com`);
        },
      },
      "Add User",
    );

    // ユーザーリスト（リアクティブ）
    yield* reactive(() => [
      ul({ classes: ["space-y-2"] }, function* () {
        for (const user of users()) {
          yield* li(
            {
              classes: [
                "p-3",
                "bg-gray-50",
                "dark:bg-gray-700",
                "rounded",
                "flex",
                "justify-between",
                "items-center",
              ],
            },
            function* () {
              yield* span(`${user.name} (${user.email})`);

              yield* div({ classes: ["flex", "gap-2"] }, function* () {
                yield* button(
                  {
                    classes: ["px-2", "py-1", "bg-blue-500", "text-white", "text-sm", "rounded"],
                    onClick: () => navigate(`${basePath}/users/${user.id}`),
                  },
                  "View",
                );
                yield* button(
                  {
                    classes: ["px-2", "py-1", "bg-red-500", "text-white", "text-sm", "rounded"],
                    onClick: () => removeUser(user.id),
                  },
                  "Delete",
                );
              });
            },
          );
        }
      }),
    ]);
  });
