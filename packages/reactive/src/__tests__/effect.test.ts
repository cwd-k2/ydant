import { describe, it, expect, vi } from "vitest";
import { signal } from "../signal";
import { effect } from "../effect";

describe("effect", () => {
  it("executes immediately on creation", () => {
    const effectFn = vi.fn();
    effect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);
  });

  it("re-executes when dependency changes", () => {
    const count = signal(0);
    const effectFn = vi.fn(() => {
      count(); // Read to track dependency
    });

    effect(effectFn);
    expect(effectFn).toHaveBeenCalledTimes(1);

    count.set(1);
    expect(effectFn).toHaveBeenCalledTimes(2);

    count.set(2);
    expect(effectFn).toHaveBeenCalledTimes(3);
  });

  it("tracks multiple dependencies", () => {
    const a = signal(1);
    const b = signal(2);
    const effectFn = vi.fn(() => {
      a();
      b();
    });

    effect(effectFn);
    expect(effectFn).toHaveBeenCalledTimes(1);

    a.set(10);
    expect(effectFn).toHaveBeenCalledTimes(2);

    b.set(20);
    expect(effectFn).toHaveBeenCalledTimes(3);
  });

  describe("cleanup", () => {
    it("runs cleanup before re-execution", () => {
      const count = signal(0);
      const cleanup = vi.fn();
      const effectFn = vi.fn(() => {
        count();
        return cleanup;
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);
      expect(cleanup).not.toHaveBeenCalled();

      count.set(1);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(effectFn).toHaveBeenCalledTimes(2);

      count.set(2);
      expect(cleanup).toHaveBeenCalledTimes(2);
      expect(effectFn).toHaveBeenCalledTimes(3);
    });

    it("runs cleanup on dispose", () => {
      const cleanup = vi.fn();
      const dispose = effect(() => cleanup);

      expect(cleanup).not.toHaveBeenCalled();

      dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispose", () => {
    it("returns dispose function", () => {
      const dispose = effect(() => {});
      expect(typeof dispose).toBe("function");
    });

    it("stops effect after dispose", () => {
      const count = signal(0);
      const effectFn = vi.fn(() => {
        count();
      });

      const dispose = effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      dispose();

      count.set(1);
      count.set(2);
      expect(effectFn).toHaveBeenCalledTimes(1); // No re-executions
    });

    it("does not re-execute after dispose", () => {
      const count = signal(0);
      let runCount = 0;

      const dispose = effect(() => {
        count();
        runCount++;
      });

      expect(runCount).toBe(1);

      dispose();

      count.set(1);
      count.set(2);
      count.set(3);

      expect(runCount).toBe(1);
    });

    it("is safe to call dispose multiple times", () => {
      const cleanup = vi.fn();
      const dispose = effect(() => cleanup);

      dispose();
      dispose();
      dispose();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("reading values", () => {
    it("can read signal values", () => {
      const count = signal(42);
      let capturedValue: number = 0;

      effect(() => {
        capturedValue = count();
      });

      expect(capturedValue).toBe(42);

      count.set(100);
      expect(capturedValue).toBe(100);
    });

    it("does not track peek() calls", () => {
      const count = signal(0);
      const effectFn = vi.fn(() => {
        count.peek();
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      count.set(1);
      expect(effectFn).toHaveBeenCalledTimes(1); // No re-execution
    });
  });

  describe("conditional tracking", () => {
    it("updates tracked dependencies based on execution path", () => {
      const condition = signal(true);
      const a = signal(1);
      const b = signal(2);

      const effectFn = vi.fn(() => {
        if (condition()) {
          a();
        } else {
          b();
        }
      });

      effect(effectFn);
      expect(effectFn).toHaveBeenCalledTimes(1);

      // a is tracked, b is not
      a.set(10);
      expect(effectFn).toHaveBeenCalledTimes(2);

      b.set(20);
      expect(effectFn).toHaveBeenCalledTimes(2); // No change

      // Switch to track b
      condition.set(false);
      expect(effectFn).toHaveBeenCalledTimes(3);

      // Now b is tracked
      b.set(30);
      expect(effectFn).toHaveBeenCalledTimes(4);
    });
  });
});
