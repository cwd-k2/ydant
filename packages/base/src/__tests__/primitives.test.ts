import { describe, it, expect, vi } from "vitest";
import { text, onMount, onUnmount, cn } from "../primitives";
import type { Lifecycle } from "../types";

describe("text", () => {
  it("yields a Text with correct content", () => {
    const gen = text("Hello, World!");
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "text",
      content: "Hello, World!",
    });
  });

  it("handles empty string", () => {
    const gen = text("");
    const result = gen.next();

    expect(result.value).toEqual({
      type: "text",
      content: "",
    });
  });

  it("handles special characters", () => {
    const gen = text('<script>alert("xss")</script>');
    const result = gen.next();

    expect(result.value).toEqual({
      type: "text",
      content: '<script>alert("xss")</script>',
    });
  });
});

describe("cn", () => {
  it("joins class names with spaces", () => {
    expect(cn("container", "flex", "items-center")).toBe("container flex items-center");
  });

  it("filters out falsy values", () => {
    const isActive = false;
    const isVisible = true;

    expect(cn("base", isActive && "active", isVisible && "visible", null, undefined, 0)).toBe(
      "base visible",
    );
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string for all falsy values", () => {
    expect(cn(false, null, undefined, 0, "")).toBe("");
  });

  it("handles single class", () => {
    expect(cn("single")).toBe("single");
  });
});

describe("onMount", () => {
  it("yields a Lifecycle with mount event", () => {
    const callback = vi.fn();
    const gen = onMount(callback);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "lifecycle",
      event: "mount",
      callback,
    });
  });

  it("supports callback that returns cleanup function", () => {
    const cleanup = vi.fn();
    const callback = () => cleanup;
    const gen = onMount(callback);
    const result = gen.next();

    const lifecycle = result.value as Lifecycle;
    expect(lifecycle.callback).toBe(callback);
  });
});

describe("onUnmount", () => {
  it("yields a Lifecycle with unmount event", () => {
    const callback = vi.fn();
    const gen = onUnmount(callback);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "lifecycle",
      event: "unmount",
      callback,
    });
  });
});
