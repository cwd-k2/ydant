import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "../mount";
import type { Plugin } from "../plugin";

function createMockCapabilities(): Plugin {
  return {
    name: "mock-capabilities",
    types: [],
  };
}

describe("Plugin dependencies", () => {
  let root: object;

  beforeEach(() => {
    root = {};
  });

  it("warns when a dependency is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const basePlugin: Plugin = {
      name: "base",
      types: [],
    };

    const depPlugin: Plugin = {
      name: "dependent",
      types: [],
      dependencies: ["nonexistent"],
    };

    mount(
      function* () {
        // empty render
      },
      { root, plugins: [createMockCapabilities(), basePlugin, depPlugin] },
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
    };

    const depPlugin: Plugin = {
      name: "dependent",
      types: [],
      dependencies: ["base"],
    };

    mount(
      function* () {
        // empty render
      },
      { root, plugins: [createMockCapabilities(), basePlugin, depPlugin] },
    );

    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("does not warn when no dependencies are declared", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const basePlugin: Plugin = {
      name: "base",
      types: [],
    };

    mount(
      function* () {
        // empty render
      },
      { root, plugins: [createMockCapabilities(), basePlugin] },
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
    };
    expect(plugin.mergeChildContext).toBeUndefined();
  });

  it("can be defined on a plugin", () => {
    const mergeChildContext = vi.fn();
    const plugin: Plugin = {
      name: "test",
      types: [],
      mergeChildContext,
    };
    expect(plugin.mergeChildContext).toBe(mergeChildContext);
  });
});

describe("Plugin setup/teardown", () => {
  let root: object;

  beforeEach(() => {
    root = {};
  });

  it("calls setup after rendering", () => {
    const setup = vi.fn();
    const plugin: Plugin = {
      name: "test",
      types: [],
      setup,
    };

    mount(function* () {}, { root, plugins: [createMockCapabilities(), plugin] });

    expect(setup).toHaveBeenCalledTimes(1);
  });

  it("calls teardown on dispose in reverse order", () => {
    const order: string[] = [];
    const pluginA: Plugin = {
      name: "a",
      types: [],
      teardown: () => order.push("a"),
    };
    const pluginB: Plugin = {
      name: "b",
      types: [],
      teardown: () => order.push("b"),
    };

    const handle = mount(function* () {}, {
      root,
      plugins: [createMockCapabilities(), pluginA, pluginB],
    });
    handle.dispose();

    expect(order).toEqual(["b", "a"]);
  });

  it("setup and teardown are optional", () => {
    const plugin: Plugin = {
      name: "test",
      types: [],
    };

    const handle = mount(function* () {}, { root, plugins: [createMockCapabilities(), plugin] });
    expect(() => handle.dispose()).not.toThrow();
  });
});

describe("MountHandle", () => {
  it("mount returns a MountHandle with dispose", () => {
    const root = {};
    const handle = mount(function* () {}, { root, plugins: [createMockCapabilities()] });

    expect(handle).toHaveProperty("dispose");
    expect(typeof handle.dispose).toBe("function");
  });
});
