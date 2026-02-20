import type { Component, Render } from "@ydant/core";
import { createSlotRef, div, h1, h2, h3, p, ul, li, button, cn } from "@ydant/base";
import { createResource, Suspense, ErrorBoundary } from "@ydant/async";
import type { Post, User } from "./types";
import { fetchPosts, fetchUsers } from "./api";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorDisplay } from "./components/ErrorDisplay";

// Create resources for data fetching
const postsResource = createResource<Post[]>(fetchPosts);
const usersResource = createResource<User[]>(fetchUsers);

// Section: Posts with Suspense
function PostsSection(): Render {
  return div(function* () {
    yield* h2({ class: cn("text-xl", "font-semibold", "mb-4") }, "Latest Posts");

    yield* Suspense({
      fallback: () => LoadingSpinner("Loading posts..."),
      content: function* () {
        const posts = postsResource();
        yield* ul({ class: "space-y-3" }, function* () {
          for (const post of posts) {
            yield* li({ class: cn("p-4", "bg-slate-800", "rounded-lg") }, function* () {
              yield* h3({ class: cn("font-medium", "text-gray-100") }, post.title);
              yield* p(
                { class: cn("text-sm", "text-gray-400", "mt-1") },
                post.body.slice(0, 100) + "...",
              );
            });
          }
        });
      },
    });
  });
}

// Section: Users with Suspense
function UsersSection(): Render {
  return div(function* () {
    yield* h2({ class: cn("text-xl", "font-semibold", "mb-4") }, "Users");

    yield* Suspense({
      fallback: () => LoadingSpinner("Loading users..."),
      content: function* () {
        const users = usersResource();
        yield* div({ class: cn("grid", "gap-4", "md:grid-cols-3") }, function* () {
          for (const user of users) {
            yield* div({ class: cn("p-4", "bg-blue-900/30", "rounded-lg") }, function* () {
              yield* h3({ class: cn("font-medium", "text-blue-300") }, user.name);
              yield* p({ class: cn("text-sm", "text-blue-400") }, user.email);
              yield* p({ class: cn("text-xs", "text-blue-400", "mt-1") }, `@ ${user.company.name}`);
            });
          }
        });
      },
    });
  });
}

// Section: Error handling demo
function ErrorDemoSection(): Render {
  const errorRef = createSlotRef();
  let showError = false;

  const renderContent = function* () {
    if (!showError) {
      yield* div({ class: "text-center" }, function* () {
        yield* p({ class: cn("text-gray-400", "mb-4") }, "Click the button to simulate an error.");
        yield* button(
          {
            class: cn("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600"),
            onClick: () => {
              showError = true;
              errorRef.refresh(renderContent);
            },
          },
          "Trigger Error",
        );
      });
    } else {
      yield* ErrorBoundary({
        fallback: (error: Error) =>
          ErrorDisplay({
            error,
            onRetry: () => {
              showError = false;
              errorRef.refresh(renderContent);
            },
          }),
        content: function* () {
          // This will throw an error
          throw new Error("Simulated error from ErrorBoundary demo!");
        },
      });
    }
  };

  return div(function* () {
    yield* h2({ class: cn("text-xl", "font-semibold", "mb-4") }, "ErrorBoundary Demo");
    errorRef.bind(yield* div({ class: cn("p-4", "bg-slate-800", "rounded-lg") }, renderContent));
  });
}

// Section: Manual loading state (alternative pattern)
function ManualLoadingSection(): Render {
  const dataRef = createSlotRef();
  let isLoading = false;
  let error: Error | null = null;
  let data: Post[] | null = null;

  const loadData = async () => {
    isLoading = true;
    error = null;
    dataRef.refresh(renderContent);

    try {
      data = await fetchPosts(3);
    } catch (e) {
      error = e as Error;
    } finally {
      isLoading = false;
      dataRef.refresh(renderContent);
    }
  };

  const renderContent = function* () {
    if (isLoading) {
      yield* LoadingSpinner("Fetching data...");
    } else if (error) {
      yield* ErrorDisplay({ error, onRetry: loadData });
    } else if (data) {
      yield* ul({ class: "space-y-2" }, function* () {
        for (const post of data!) {
          yield* li(
            { class: cn("p-2", "bg-slate-800", "rounded", "border", "border-slate-700") },
            post.title,
          );
        }
      });
    } else {
      yield* div({ class: "text-center" }, function* () {
        yield* p({ class: cn("text-gray-400", "mb-4") }, "No data loaded yet.");
        yield* button(
          {
            class: cn(
              "px-4",
              "py-2",
              "bg-green-500",
              "text-white",
              "rounded",
              "hover:bg-green-600",
            ),
            onClick: loadData,
          },
          "Load Data",
        );
      });
    }
  };

  return div(function* () {
    yield* h2({ class: cn("text-xl", "font-semibold", "mb-4") }, "Manual Loading Pattern");
    yield* p(
      { class: cn("text-sm", "text-gray-400", "mb-4") },
      "Alternative to Suspense: explicitly manage loading/error/data states.",
    );
    dataRef.bind(yield* div({ class: cn("p-4", "bg-slate-800", "rounded-lg") }, renderContent));
  });
}

export const App: Component = () =>
  div({ class: "space-y-8" }, function* () {
    // Header
    yield* h1(
      { class: cn("text-2xl", "font-bold", "text-center", "text-purple-300", "mb-2") },
      "Async Data Fetching",
    );

    yield* p(
      { class: cn("text-center", "text-gray-400", "text-sm", "mb-6") },
      "Demonstrates Suspense, ErrorBoundary, and Resource patterns.",
    );

    // Posts section
    yield* PostsSection();

    // Divider
    yield* div({ class: cn("border-t", "border-slate-700", "my-6") });

    // Users section
    yield* UsersSection();

    // Divider
    yield* div({ class: cn("border-t", "border-slate-700", "my-6") });

    // Error demo section
    yield* ErrorDemoSection();

    // Divider
    yield* div({ class: cn("border-t", "border-slate-700", "my-6") });

    // Manual loading section
    yield* ManualLoadingSection();

    // Info
    yield* div(
      { class: cn("mt-6", "p-4", "bg-blue-900/30", "rounded-lg", "text-sm") },
      function* () {
        yield* h2({ class: cn("font-semibold", "mb-2") }, "How Async Works:");
        yield* ul({ class: cn("list-disc", "list-inside", "space-y-1") }, function* () {
          yield* li(
            "createResource() creates a reactive data fetcher that integrates with Suspense",
          );
          yield* li("Suspense shows fallback while data is loading");
          yield* li("ErrorBoundary catches errors and displays a fallback UI");
          yield* li("Manual pattern gives you full control over loading states");
        });
      },
    );
  });
