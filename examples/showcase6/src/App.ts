import type { Component } from "@ydant/core";
import { type Slot, div, h1, h2, h3, p, ul, li, button, text, clss, on } from "@ydant/base";
import { createResource, Suspense, ErrorBoundary } from "@ydant/async";
import type { Post, User } from "./types";
import { fetchPosts, fetchUsers } from "./api";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorDisplay } from "./components/ErrorDisplay";

// Create resources for data fetching
const postsResource = createResource<Post[]>(fetchPosts);
const usersResource = createResource<User[]>(fetchUsers);

// Section: Posts with Suspense
function PostsSection() {
  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("Latest Posts")]);

    yield* Suspense({
      fallback: () => LoadingSpinner("Loading posts..."),
      children: function* () {
        const posts = postsResource();
        yield* ul(function* () {
          yield* clss(["space-y-3"]);
          for (const post of posts) {
            yield* li(() => [
              clss(["p-4", "bg-gray-50", "rounded-lg"]),
              h3(() => [clss(["font-medium", "text-gray-800"]), text(post.title)]),
              p(() => [
                clss(["text-sm", "text-gray-600", "mt-1"]),
                text(post.body.slice(0, 100) + "..."),
              ]),
            ]);
          }
        });
      },
    });
  });
}

// Section: Users with Suspense
function UsersSection() {
  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("Users")]);

    yield* Suspense({
      fallback: () => LoadingSpinner("Loading users..."),
      children: function* () {
        const users = usersResource();
        yield* div(function* () {
          yield* clss(["grid", "gap-4", "md:grid-cols-3"]);
          for (const user of users) {
            yield* div(() => [
              clss(["p-4", "bg-blue-50", "rounded-lg"]),
              h3(() => [clss(["font-medium", "text-blue-800"]), text(user.name)]),
              p(() => [clss(["text-sm", "text-blue-600"]), text(user.email)]),
              p(() => [clss(["text-xs", "text-blue-500", "mt-1"]), text(`@ ${user.company.name}`)]),
            ]);
          }
        });
      },
    });
  });
}

// Section: Error handling demo
function ErrorDemoSection() {
  let errorSlot: Slot;
  let showError = false;

  const renderContent = function* () {
    yield* clss(["p-4", "bg-gray-50", "rounded-lg"]);

    if (!showError) {
      yield* div(() => [
        clss(["text-center"]),
        p(() => [clss(["text-gray-600", "mb-4"]), text("Click the button to simulate an error.")]),
        button(function* () {
          yield* clss(["px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600"]);
          yield* on("click", () => {
            showError = true;
            errorSlot.refresh(renderContent);
          });
          yield* text("Trigger Error");
        }),
      ]);
    } else {
      yield* ErrorBoundary({
        fallback: (error: Error) =>
          ErrorDisplay({
            error,
            onRetry: () => {
              showError = false;
              errorSlot.refresh(renderContent);
            },
          }),
        children: function* () {
          // This will throw an error
          throw new Error("Simulated error from ErrorBoundary demo!");
        },
      });
    }
  };

  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("ErrorBoundary Demo")]);
    errorSlot = yield* div(renderContent);
  });
}

// Section: Manual loading state (alternative pattern)
function ManualLoadingSection() {
  let dataSlot: Slot;
  let isLoading = false;
  let error: Error | null = null;
  let data: Post[] | null = null;

  const loadData = async () => {
    isLoading = true;
    error = null;
    dataSlot.refresh(renderContent);

    try {
      data = await fetchPosts(3);
    } catch (e) {
      error = e as Error;
    } finally {
      isLoading = false;
      dataSlot.refresh(renderContent);
    }
  };

  const renderContent = function* () {
    yield* clss(["p-4", "bg-gray-50", "rounded-lg"]);

    if (isLoading) {
      yield* LoadingSpinner("Fetching data...");
    } else if (error) {
      yield* ErrorDisplay({ error, onRetry: loadData });
    } else if (data) {
      yield* ul(function* () {
        yield* clss(["space-y-2"]);
        for (const post of data!) {
          yield* li(() => [clss(["p-2", "bg-white", "rounded", "border"]), text(post.title)]);
        }
      });
    } else {
      yield* div(() => [
        clss(["text-center"]),
        p(() => [clss(["text-gray-500", "mb-4"]), text("No data loaded yet.")]),
        button(function* () {
          yield* clss([
            "px-4",
            "py-2",
            "bg-green-500",
            "text-white",
            "rounded",
            "hover:bg-green-600",
          ]);
          yield* on("click", loadData);
          yield* text("Load Data");
        }),
      ]);
    }
  };

  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("Manual Loading Pattern")]);
    yield* p(() => [
      clss(["text-sm", "text-gray-500", "mb-4"]),
      text("Alternative to Suspense: explicitly manage loading/error/data states."),
    ]);
    dataSlot = yield* div(renderContent);
  });
}

export const App: Component = () =>
  div(function* () {
    yield* clss(["space-y-8"]);

    // Header
    yield* h1(() => [
      clss(["text-2xl", "font-bold", "text-center", "text-purple-800", "mb-2"]),
      text("Async Data Fetching"),
    ]);

    yield* p(() => [
      clss(["text-center", "text-gray-500", "text-sm", "mb-6"]),
      text("Demonstrates Suspense, ErrorBoundary, and Resource patterns."),
    ]);

    // Posts section
    yield* PostsSection();

    // Divider
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // Users section
    yield* UsersSection();

    // Divider
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // Error demo section
    yield* ErrorDemoSection();

    // Divider
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // Manual loading section
    yield* ManualLoadingSection();

    // Info
    yield* div(() => [
      clss(["mt-6", "p-4", "bg-blue-50", "rounded-lg", "text-sm"]),
      h2(() => [clss(["font-semibold", "mb-2"]), text("How Async Works:")]),
      ul(() => [
        clss(["list-disc", "list-inside", "space-y-1"]),
        li(() => [
          text("createResource() creates a reactive data fetcher that integrates with Suspense"),
        ]),
        li(() => [text("Suspense shows fallback while data is loading")]),
        li(() => [text("ErrorBoundary catches errors and displays a fallback UI")]),
        li(() => [text("Manual pattern gives you full control over loading states")]),
      ]),
    ]);
  });
