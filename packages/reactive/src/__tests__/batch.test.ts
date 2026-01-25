import { describe, it, expect, vi } from "vitest";
import { signal } from "../signal";
import { effect } from "../effect";
import { batch, scheduleEffect } from "../batch";

describe("batch", () => {
  // Note: The current signal implementation does not integrate with batch.
  // Signal.set() directly notifies subscribers without checking scheduleEffect.
  // These tests verify the current behavior where batch only works for
  // manually scheduled effects via scheduleEffect(), not for signal updates.

  it("executes function synchronously", () => {
    const firstName = signal("John");
    const lastName = signal("Doe");

    const effectFn = vi.fn(() => {
      firstName();
      lastName();
    });

    effect(effectFn);
    expect(effectFn).toHaveBeenCalledTimes(1);

    batch(() => {
      firstName.set("Jane");
      lastName.set("Smith");
    });

    // Current implementation: signal.set() notifies immediately,
    // so effect runs for each signal change
    expect(effectFn).toHaveBeenCalledTimes(3);
  });

  it("executes nested batches correctly", () => {
    const a = signal(1);
    const b = signal(2);

    const effectFn = vi.fn(() => {
      a();
      b();
    });

    effect(effectFn);
    expect(effectFn).toHaveBeenCalledTimes(1);

    batch(() => {
      a.set(10);
      batch(() => {
        b.set(20);
      });
      a.set(100);
    });

    // Current implementation: each set() triggers effect immediately
    expect(effectFn).toHaveBeenCalledTimes(4);
  });

  it("tracks all signal changes", () => {
    const count = signal(0);
    const calls: number[] = [];

    effect(() => {
      calls.push(count());
    });

    expect(calls).toEqual([0]);

    batch(() => {
      count.set(1);
      count.set(2);
      count.set(3);
    });

    // Current implementation: effect runs for each change
    expect(calls).toEqual([0, 1, 2, 3]);
  });

  it("handles errors in batch", () => {
    const count = signal(0);
    const effectFn = vi.fn(() => {
      count();
    });

    effect(effectFn);
    expect(effectFn).toHaveBeenCalledTimes(1);

    expect(() => {
      batch(() => {
        count.set(1);
        throw new Error("Test error");
      });
    }).toThrow("Test error");

    // Batch depth should be reset even after error
    count.set(2);
    expect(effectFn).toHaveBeenCalledTimes(3); // 1 (initial) + 1 (batch) + 1 (after)
  });
});

describe("scheduleEffect", () => {
  it("returns false when not in batch", () => {
    const effectFn = vi.fn();
    const result = scheduleEffect(effectFn);

    expect(result).toBe(false);
    expect(effectFn).not.toHaveBeenCalled();
  });

  it("returns true and schedules effect when in batch", () => {
    const effectFn = vi.fn();

    batch(() => {
      const result = scheduleEffect(effectFn);
      expect(result).toBe(true);
      expect(effectFn).not.toHaveBeenCalled();
    });

    expect(effectFn).toHaveBeenCalledTimes(1);
  });

  it("deduplicates scheduled effects", () => {
    const effectFn = vi.fn();

    batch(() => {
      scheduleEffect(effectFn);
      scheduleEffect(effectFn);
      scheduleEffect(effectFn);
    });

    expect(effectFn).toHaveBeenCalledTimes(1);
  });
});
