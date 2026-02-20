import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentSubscriber,
  runWithSubscriber,
  trackDependency,
  clearDependencies,
  __resetForTesting__,
} from "../tracking";

describe("getCurrentSubscriber", () => {
  beforeEach(() => {
    __resetForTesting__();
  });

  it("returns null when no subscriber is active", () => {
    expect(getCurrentSubscriber()).toBeNull();
  });

  it("returns current subscriber during runWithSubscriber", () => {
    const subscriber = vi.fn();

    runWithSubscriber(subscriber, () => {
      expect(getCurrentSubscriber()).toBe(subscriber);
    });
  });

  it("returns null after runWithSubscriber completes", () => {
    const subscriber = vi.fn();

    runWithSubscriber(subscriber, () => {});

    expect(getCurrentSubscriber()).toBeNull();
  });
});

describe("runWithSubscriber", () => {
  beforeEach(() => {
    __resetForTesting__();
  });

  it("sets subscriber during function execution", () => {
    const subscriber = vi.fn();
    let capturedSubscriber: unknown = null;

    runWithSubscriber(subscriber, () => {
      capturedSubscriber = getCurrentSubscriber();
    });

    expect(capturedSubscriber).toBe(subscriber);
  });

  it("returns the result of the function", () => {
    const subscriber = vi.fn();
    const result = runWithSubscriber(subscriber, () => 42);

    expect(result).toBe(42);
  });

  it("restores previous subscriber after execution", () => {
    const outer = vi.fn();
    const inner = vi.fn();

    runWithSubscriber(outer, () => {
      expect(getCurrentSubscriber()).toBe(outer);

      runWithSubscriber(inner, () => {
        expect(getCurrentSubscriber()).toBe(inner);
      });

      expect(getCurrentSubscriber()).toBe(outer);
    });

    expect(getCurrentSubscriber()).toBeNull();
  });

  it("restores subscriber even if function throws", () => {
    const subscriber = vi.fn();

    expect(() => {
      runWithSubscriber(subscriber, () => {
        throw new Error("Test error");
      });
    }).toThrow("Test error");

    expect(getCurrentSubscriber()).toBeNull();
  });

  it("restores nested subscriber even if inner function throws", () => {
    const outer = vi.fn();
    const inner = vi.fn();

    runWithSubscriber(outer, () => {
      try {
        runWithSubscriber(inner, () => {
          throw new Error("Inner error");
        });
      } catch {
        // Ignore error
      }

      expect(getCurrentSubscriber()).toBe(outer);
    });

    expect(getCurrentSubscriber()).toBeNull();
  });

  it("handles deeply nested subscribers", () => {
    const subs = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    const captured: unknown[] = [];

    runWithSubscriber(subs[0], () => {
      captured.push(getCurrentSubscriber());

      runWithSubscriber(subs[1], () => {
        captured.push(getCurrentSubscriber());

        runWithSubscriber(subs[2], () => {
          captured.push(getCurrentSubscriber());

          runWithSubscriber(subs[3], () => {
            captured.push(getCurrentSubscriber());
          });

          captured.push(getCurrentSubscriber());
        });

        captured.push(getCurrentSubscriber());
      });

      captured.push(getCurrentSubscriber());
    });

    expect(captured).toEqual([subs[0], subs[1], subs[2], subs[3], subs[2], subs[1], subs[0]]);
  });
});

describe("trackDependency / clearDependencies", () => {
  it("removes subscriber from all tracked sets on clearDependencies", () => {
    const subscriber = vi.fn();
    const setA = new Set<() => void>();
    const setB = new Set<() => void>();

    setA.add(subscriber);
    setB.add(subscriber);
    trackDependency(subscriber, setA);
    trackDependency(subscriber, setB);

    expect(setA.has(subscriber)).toBe(true);
    expect(setB.has(subscriber)).toBe(true);

    clearDependencies(subscriber);

    expect(setA.has(subscriber)).toBe(false);
    expect(setB.has(subscriber)).toBe(false);
  });

  it("is safe to call clearDependencies with no tracked dependencies", () => {
    const subscriber = vi.fn();
    expect(() => clearDependencies(subscriber)).not.toThrow();
  });

  it("can re-track after clearing", () => {
    const subscriber = vi.fn();
    const setA = new Set<() => void>();

    setA.add(subscriber);
    trackDependency(subscriber, setA);

    clearDependencies(subscriber);
    expect(setA.has(subscriber)).toBe(false);

    // Re-add and re-track
    setA.add(subscriber);
    trackDependency(subscriber, setA);
    expect(setA.has(subscriber)).toBe(true);

    clearDependencies(subscriber);
    expect(setA.has(subscriber)).toBe(false);
  });
});
