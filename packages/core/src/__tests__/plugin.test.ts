import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "../mount";
import type { Plugin } from "../plugin";

describe("Plugin dependencies", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("warns when a dependency is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const basePlugin: Plugin = {
      name: "base",
      types: [],
      process: () => ({}),
    };

    const depPlugin: Plugin = {
      name: "dependent",
      types: [],
      dependencies: ["nonexistent"],
      process: () => ({}),
    };

    mount(
      function* () {
        // empty render
      },
      container,
      { plugins: [basePlugin, depPlugin] },
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('"dependent" depends on "nonexistent"'),
    );

    warn.mockRestore();
  });

  it("does not warn when dependencies are satisfied", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const basePlugin: Plugin = {
      name: "base",
      types: [],
      process: () => ({}),
    };

    const depPlugin: Plugin = {
      name: "dependent",
      types: [],
      dependencies: ["base"],
      process: () => ({}),
    };

    mount(
      function* () {
        // empty render
      },
      container,
      { plugins: [basePlugin, depPlugin] },
    );

    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("does not warn when no dependencies are declared", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const basePlugin: Plugin = {
      name: "base",
      types: [],
      process: () => ({}),
    };

    mount(
      function* () {
        // empty render
      },
      container,
      { plugins: [basePlugin] },
    );

    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe("Plugin mergeChildContext", () => {
  it("is optional on Plugin interface", () => {
    const plugin: Plugin = {
      name: "test",
      types: [],
      process: () => ({}),
    };
    expect(plugin.mergeChildContext).toBeUndefined();
  });

  it("can be defined on a plugin", () => {
    const mergeChildContext = vi.fn();
    const plugin: Plugin = {
      name: "test",
      types: [],
      process: () => ({}),
      mergeChildContext,
    };
    expect(plugin.mergeChildContext).toBe(mergeChildContext);
  });
});
