import { describe, it, expect, vi, beforeEach } from "vitest";
import { signal } from "../signal";
import { effect } from "../effect";
import { batch, scheduleEffect, __resetForTesting__ } from "../batch";

describe("batch", () => {
  beforeEach(() => {
    __resetForTesting__();
  });

  it("batches multiple signal updates into a single effect execution", () => {
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

    // Batch should combine updates: 1 (initial) + 1 (after batch) = 2
    expect(effectFn).toHaveBeenCalledTimes(2);
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

    // Nested batch should still batch all updates: 1 (initial) + 1 (after outer batch) = 2
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it("uses final value when same signal is updated multiple times", () => {
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

    // Effect should run once with final value: [0, 3]
    expect(calls).toEqual([0, 3]);
  });

  it("handles errors in batch and still flushes pending effects", () => {
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

    // Even with error, batch should have flushed pending effects
    // 1 (initial) + 1 (batch flush on error) = 2
    expect(effectFn).toHaveBeenCalledTimes(2);

    // After batch, normal behavior resumes
    count.set(2);
    expect(effectFn).toHaveBeenCalledTimes(3);
  });
});

describe("scheduleEffect", () => {
  beforeEach(() => {
    __resetForTesting__();
  });

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
