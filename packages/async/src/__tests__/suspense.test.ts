import { describe, it, expect, vi, beforeEach } from "vitest";
import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import { Suspense } from "../Suspense";

describe("Suspense", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  it("renders content when no promise is thrown", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      Suspense({
        fallback: () => div(() => [text("Loading...")]),
        content: function* () {
          yield* div(() => [text("Content")]);
        },
      }),
    );

    expect(container.textContent).toContain("Content");
    expect(container.textContent).not.toContain("Loading");
  });

  it("renders fallback when promise is thrown", () => {
    const pendingPromise = new Promise(() => {});

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      Suspense({
        fallback: () => div(() => [text("Loading...")]),
        content: function* () {
          throw pendingPromise;
        },
      }),
    );

    expect(container.textContent).toContain("Loading...");
    expect(container.textContent).not.toContain("Content");
  });

  it("renders content after promise resolves", async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    let hasResolved = false;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      Suspense({
        fallback: () => div(() => [text("Loading...")]),
        content: function* () {
          if (!hasResolved) {
            throw promise;
          }
          yield* div(() => [text("Loaded Content")]);
        },
      }),
    );

    expect(container.textContent).toContain("Loading...");

    // Resolve the promise
    hasResolved = true;
    resolvePromise!();
    await vi.runAllTimersAsync();

    // After promise resolves, content should re-render
    expect(container.textContent).toContain("Loaded Content");
  });

  it("re-throws non-promise errors", () => {
    const error = new Error("Component error");

    expect(() => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            throw error;
          },
        }),
      );
    }).toThrow(error);
  });
});
