import { describe, it, expect, vi, beforeEach } from "vitest";
import { div, text } from "@ydant/core";
import { mount } from "@ydant/dom";
import { ErrorBoundary } from "../error-boundary";

describe("ErrorBoundary", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  it("renders children when no error is thrown", () => {
    mount(
      () =>
        ErrorBoundary({
          fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
          children: function* () {
            yield* div(() => [text("Content")]);
          },
        }),
      container,
    );

    expect(container.textContent).toContain("Content");
    expect(container.textContent).not.toContain("Error");
  });

  it("renders fallback when error is thrown", () => {
    mount(
      () =>
        ErrorBoundary({
          fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
          children: function* () {
            throw new Error("Something went wrong");
          },
        }),
      container,
    );

    expect(container.textContent).toContain("Error: Something went wrong");
    expect(container.textContent).not.toContain("Content");
  });

  it("provides error object to fallback", () => {
    const testError = new Error("Test error message");

    mount(
      () =>
        ErrorBoundary({
          fallback: (error) => div(() => [text(`Caught: ${error.name} - ${error.message}`)]),
          children: function* () {
            throw testError;
          },
        }),
      container,
    );

    expect(container.textContent).toContain("Caught: Error - Test error message");
  });

  it("provides reset function to fallback", () => {
    let shouldError = true;
    let resetFn: (() => void) | null = null;

    mount(
      () =>
        ErrorBoundary({
          fallback: (error, reset) => {
            resetFn = reset;
            return div(function* () {
              yield* text(`Error: ${error.message}`);
              yield* div(() => [text("Retry")]);
            });
          },
          children: function* () {
            if (shouldError) {
              throw new Error("Failed");
            }
            yield* div(() => [text("Success!")]);
          },
        }),
      container,
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
      mount(
        () =>
          ErrorBoundary({
            fallback: (error) => div(() => [text(`Error: ${error.message}`)]),
            children: function* () {
              throw pendingPromise;
            },
          }),
        container,
      );
    } catch (e) {
      thrownValue = e;
    }

    expect(thrownValue).toBe(pendingPromise);
  });

  it("catches error after reset", () => {
    let errorCount = 0;
    let resetFn: (() => void) | null = null;

    mount(
      () =>
        ErrorBoundary({
          fallback: (error, reset) => {
            resetFn = reset;
            return div(function* () {
              yield* text(`Error #${errorCount}: ${error.message}`);
              yield* div(() => [text("Retry")]);
            });
          },
          children: function* () {
            errorCount++;
            throw new Error(`Failure ${errorCount}`);
          },
        }),
      container,
    );

    expect(container.textContent).toContain("Error #1: Failure 1");

    // Call reset - should catch new error
    resetFn!();

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Error #2: Failure 2");
  });
});
