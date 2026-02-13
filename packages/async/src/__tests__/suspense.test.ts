import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@ydant/core";
import { createBasePlugin, createDOMCapabilities, div, text } from "@ydant/base";
import { Suspense } from "../Suspense";

describe("Suspense", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  it("renders content when no promise is thrown", () => {
    mount(
      () =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            yield* div(() => [text("Content")]);
          },
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("Content");
    expect(container.textContent).not.toContain("Loading");
  });

  it("renders fallback when promise is thrown", () => {
    const pendingPromise = new Promise(() => {});

    mount(
      () =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            throw pendingPromise;
          },
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
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

    mount(
      () =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            if (!hasResolved) {
              throw promise;
            }
            yield* div(() => [text("Loaded Content")]);
          },
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
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
      mount(
        () =>
          Suspense({
            fallback: () => div(() => [text("Loading...")]),
            content: function* () {
              throw error;
            },
          }),
        { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
      );
    }).toThrow(error);
  });
});
