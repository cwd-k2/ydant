import { describe, it, expect, vi, beforeEach } from "vitest";
import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import { ErrorBoundary } from "../ErrorBoundary";

describe("ErrorBoundary", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  it("renders content when no error is thrown", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
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
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
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

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
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

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
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
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
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

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
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
});
