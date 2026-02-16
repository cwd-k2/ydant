import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "../mount";
import type { Backend } from "../plugin";
import type { Plugin } from "../plugin";

function createMockBackend(): Backend {
  return {
    name: "mock-backend",
    root: {},
    initContext() {},
  };
}

describe("Plugin dependencies", () => {
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
      { backend: createMockBackend(), plugins: [basePlugin, depPlugin] },
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
      { backend: createMockBackend(), plugins: [basePlugin, depPlugin] },
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
      { backend: createMockBackend(), plugins: [basePlugin] },
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
  it("calls setup after rendering", () => {
    const setup = vi.fn();
    const plugin: Plugin = {
      name: "test",
      types: [],
      setup,
    };

    mount(function* () {}, { backend: createMockBackend(), plugins: [plugin] });

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
      backend: createMockBackend(),
      plugins: [pluginA, pluginB],
    });
    handle.dispose();

    expect(order).toEqual(["b", "a"]);
  });

  it("setup and teardown are optional", () => {
    const plugin: Plugin = {
      name: "test",
      types: [],
    };

    const handle = mount(function* () {}, { backend: createMockBackend(), plugins: [plugin] });
    expect(() => handle.dispose()).not.toThrow();
  });
});

describe("MountHandle", () => {
  it("mount returns a MountHandle with dispose", () => {
    const handle = mount(function* () {}, { backend: createMockBackend() });

    expect(handle).toHaveProperty("dispose");
    expect(typeof handle.dispose).toBe("function");
  });

  it("allows calling dispose() multiple times safely", () => {
    const teardown = vi.fn();
    const plugin: Plugin = { name: "test", types: [], teardown };

    const handle = mount(function* () {}, {
      backend: createMockBackend(),
      plugins: [plugin],
    });

    handle.dispose();
    handle.dispose();

    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it("dispose works when no plugins are provided", () => {
    const handle = mount(function* () {}, { backend: createMockBackend() });
    expect(() => handle.dispose()).not.toThrow();
  });
});
