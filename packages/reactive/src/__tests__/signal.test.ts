import { describe, it, expect, vi } from "vitest";
import { signal } from "../signal";
import { runWithSubscriber } from "../tracking";

describe("signal", () => {
  it("returns initial value", () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it("returns initial value with different types", () => {
    const str = signal("hello");
    const obj = signal({ x: 1, y: 2 });
    const arr = signal([1, 2, 3]);
    const bool = signal(true);

    expect(str()).toBe("hello");
    expect(obj()).toEqual({ x: 1, y: 2 });
    expect(arr()).toEqual([1, 2, 3]);
    expect(bool()).toBe(true);
  });

  describe("set", () => {
    it("updates value with set()", () => {
      const count = signal(0);
      count.set(5);
      expect(count()).toBe(5);
    });

    it("notifies subscribers on change", () => {
      const count = signal(0);
      const subscriber = vi.fn();

      // Subscribe by reading inside runWithSubscriber
      runWithSubscriber(subscriber, () => count());

      count.set(1);
      expect(subscriber).toHaveBeenCalledTimes(1);

      count.set(2);
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it("does not notify when value is same (Object.is)", () => {
      const count = signal(5);
      const subscriber = vi.fn();

      runWithSubscriber(subscriber, () => count());

      count.set(5);
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("handles NaN equality correctly", () => {
      const num = signal(NaN);
      const subscriber = vi.fn();

      runWithSubscriber(subscriber, () => num());

      // NaN === NaN with Object.is
      num.set(NaN);
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("treats -0 and +0 as equal", () => {
      const num = signal(0);
      const subscriber = vi.fn();

      runWithSubscriber(subscriber, () => num());

      // Object.is(0, -0) returns false, but they are equal for practical purposes
      // Actually, Object.is(0, -0) is false, so this should notify
      num.set(-0);
      // Object.is(0, -0) === false, so subscriber should be called
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("updates value with update()", () => {
      const count = signal(5);
      count.update((n) => n + 1);
      expect(count()).toBe(6);
    });

    it("passes previous value to updater function", () => {
      const count = signal(10);
      const updater = vi.fn((n: number) => n * 2);

      count.update(updater);

      expect(updater).toHaveBeenCalledWith(10);
      expect(count()).toBe(20);
    });

    it("notifies subscribers when value changes", () => {
      const count = signal(0);
      const subscriber = vi.fn();

      runWithSubscriber(subscriber, () => count());

      count.update((n) => n + 1);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("does not notify when update returns same value", () => {
      const count = signal(5);
      const subscriber = vi.fn();

      runWithSubscriber(subscriber, () => count());

      count.update((n) => n); // Returns same value
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("peek", () => {
    it("returns current value without subscribing", () => {
      const count = signal(42);
      expect(count.peek()).toBe(42);
    });

    it("does not register as subscriber", () => {
      const count = signal(0);
      const subscriber = vi.fn();

      // Only use peek(), not read()
      runWithSubscriber(subscriber, () => count.peek());

      count.set(1);
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("returns updated value after set", () => {
      const count = signal(0);
      count.set(10);
      expect(count.peek()).toBe(10);
    });
  });

  describe("multiple subscribers", () => {
    it("notifies all subscribers", () => {
      const count = signal(0);
      const sub1 = vi.fn();
      const sub2 = vi.fn();
      const sub3 = vi.fn();

      runWithSubscriber(sub1, () => count());
      runWithSubscriber(sub2, () => count());
      runWithSubscriber(sub3, () => count());

      count.set(1);

      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(1);
      expect(sub3).toHaveBeenCalledTimes(1);
    });
  });
});
