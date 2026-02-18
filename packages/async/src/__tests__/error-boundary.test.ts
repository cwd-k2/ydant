import { describe, it, expect, vi, beforeEach } from "vitest";
import { scope, sync } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { signal, reactive } from "@ydant/reactive";
import { ErrorBoundary } from "../ErrorBoundary";
import { createAsyncPlugin } from "../plugin";

describe("ErrorBoundary", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  // ─── Existing: sync error tests ───

  it("renders content when no error is thrown", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
      ErrorBoundary({
        fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
        content: function* () {
          yield* div(() => [text("Content")]);
        },
      }),
    );

    expect(container.textContent).toContain("Content");
    expect(container.textContent).not.toContain("Error");
  });

  it("renders fallback when error is thrown", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
      ErrorBoundary({
        fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
        content: function* () {
          throw new Error("Something went wrong");
        },
      }),
    );

    expect(container.textContent).toContain("Error: Something went wrong");
    expect(container.textContent).not.toContain("Content");
  });

  it("provides error object to fallback", () => {
    const testError = new Error("Test error message");

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
      ErrorBoundary({
        fallback: (error) => div(() => [text(`Caught: ${error.name} - ${error.message}`)]),
        content: function* () {
          throw testError;
        },
      }),
    );

    expect(container.textContent).toContain("Caught: Error - Test error message");
  });

  it("provides reset function to fallback", () => {
    let shouldError = true;
    let resetFn: (() => void) | null = null;

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
      ErrorBoundary({
        fallback: (error, reset) => {
          resetFn = reset;
          return div(function* () {
            yield* text(`Error: ${error.message}`);
            yield* div(() => [text("Retry")]);
          });
        },
        content: function* () {
          if (shouldError) {
            throw new Error("Failed");
          }
          yield* div(() => [text("Success!")]);
        },
      }),
    );

    expect(container.textContent).toContain("Error: Failed");
    expect(resetFn).not.toBeNull();

    // Call reset directly after fixing the error condition
    shouldError = false;
    resetFn!();

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Success!");
  });

  it("re-throws Promise (suspense pattern)", () => {
    const pendingPromise = new Promise(() => {});
    let thrownValue: unknown = null;

    try {
      scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
        ErrorBoundary({
          fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
          content: function* () {
            throw pendingPromise;
          },
        }),
      );
    } catch (e) {
      thrownValue = e;
    }

    expect(thrownValue).toBe(pendingPromise);
  });

  it("catches error after reset", () => {
    let errorCount = 0;
    let resetFn: (() => void) | null = null;

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(() =>
      ErrorBoundary({
        fallback: (error, reset) => {
          resetFn = reset;
          return div(function* () {
            yield* text(`Error #${errorCount}: ${error.message}`);
            yield* div(() => [text("Retry")]);
          });
        },
        content: function* () {
          errorCount++;
          throw new Error(`Failure ${errorCount}`);
        },
      }),
    );

    expect(container.textContent).toContain("Error #1: Failure 1");

    // Call reset - should catch new error
    resetFn!();

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Error #2: Failure 2");
  });

  // ─── NEW: reactive update error tests ───

  it("catches errors during reactive updates", () => {
    const count = signal(0);
    let shouldThrow = false;

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        ErrorBoundary({
          fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
          content: function* () {
            yield* div(function* () {
              yield* reactive(() => {
                const val = count();
                if (shouldThrow) throw new Error(`Reactive error at ${val}`);
                return [text(`Count: ${val}`)];
              });
            });
          },
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Trigger reactive update that throws
    shouldThrow = true;
    count.set(1);

    expect(container.textContent).toContain("Error: Reactive error at 1");
  });

  it("resets after catching reactive update error", () => {
    const count = signal(0);
    let shouldThrow = false;
    let resetFn: (() => void) | null = null;

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        ErrorBoundary({
          fallback: (error, reset) => {
            resetFn = reset;
            return div(() => [text(`Error: ${error.message}`)]);
          },
          content: function* () {
            yield* div(function* () {
              yield* reactive(() => {
                const val = count();
                if (shouldThrow) throw new Error(`Reactive error at ${val}`);
                return [text(`Count: ${val}`)];
              });
            });
          },
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Trigger reactive error
    shouldThrow = true;
    count.set(1);
    expect(container.textContent).toContain("Error: Reactive error at 1");

    // Reset — should re-render content successfully
    shouldThrow = false;
    resetFn!();
    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Count: 1");
  });

  it("catches nested ErrorBoundary errors (inner takes priority)", () => {
    const count = signal(0);

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        ErrorBoundary({
          fallback: (error) => div(() => [text(`Outer: ${error.message}`)]),
          content: function* () {
            yield* div(function* () {
              yield* ErrorBoundary({
                fallback: (error) => div(() => [text(`Inner: ${error.message}`)]),
                content: function* () {
                  yield* reactive(() => {
                    const val = count();
                    if (val > 0) throw new Error("boom");
                    return [text(`Count: ${val}`)];
                  });
                },
              });
            });
          },
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Inner boundary should catch this
    count.set(1);

    expect(container.textContent).toContain("Inner: boom");
    expect(container.textContent).not.toContain("Outer");
  });
});
