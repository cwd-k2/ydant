import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scope, sync } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { signal, reactive } from "@ydant/reactive";
import { Suspense } from "../Suspense";
import { createAsyncPlugin } from "../plugin";

describe("Suspense", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
  });

  // ─── Existing: sync suspend tests ───

  it("renders content when no promise is thrown", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
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

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
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

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
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
      scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            throw error;
          },
        }),
      );
    }).toThrow(error);
  });

  // ─── NEW: reactive update suspend tests ───

  it("catches Promise during reactive update", async () => {
    const count = signal(0);
    let pendingPromise: Promise<void> | null = null;
    let resolvePromise: (() => void) | null = null;
    let isSuspended = false;

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            yield* div(function* () {
              yield* reactive(() => {
                const val = count();
                if (isSuspended) throw pendingPromise!;
                return [text(`Count: ${val}`)];
              });
            });
          },
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Create a pending promise and trigger suspend
    pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    isSuspended = true;
    count.set(1);

    expect(container.textContent).toContain("Loading...");

    // Resolve the promise — should retry
    isSuspended = false;
    resolvePromise!();
    await vi.runAllTimersAsync();

    expect(container.textContent).toContain("Count: 1");
  });

  it("does not cause unhandled rejection when retry throws (safeRetry)", async () => {
    let resolvePromise: (() => void) | null = null;
    let throwCount = 0;

    // Track unhandled rejections
    const unhandledRejections: unknown[] = [];
    const handler = (event: PromiseRejectionEvent) => {
      unhandledRejections.push(event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);

    try {
      scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
        Suspense({
          fallback: () => div(() => [text("Loading...")]),
          content: function* () {
            throwCount++;
            // Always throw a new promise — retry will also suspend (throw a Promise)
            const p = new Promise<void>((resolve) => {
              resolvePromise = resolve;
            });
            throw p;
          },
        }),
      );

      expect(container.textContent).toContain("Loading...");
      expect(throwCount).toBe(1);

      // Resolve the first promise — retry fires, but content throws another promise
      resolvePromise!();
      await vi.runAllTimersAsync();

      // The retry succeeded without unhandled rejection (safeRetry caught the thrown Promise)
      expect(throwCount).toBe(2);
      expect(unhandledRejections).toEqual([]);
    } finally {
      window.removeEventListener("unhandledrejection", handler);
    }
  });
});
