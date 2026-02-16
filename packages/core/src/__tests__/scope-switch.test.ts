import { describe, it, expect, vi } from "vitest";
import { mount, createExecutionScope } from "../mount";
import type { Backend, Plugin, RenderContext } from "../plugin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockBackend(name: string, initExtra?: (ctx: RenderContext) => void): Backend {
  return {
    name,
    root: { __backend: name },
    initContext(ctx) {
      initExtra?.(ctx);
    },
  };
}

// SpellSchema is empty in core-only tests, so generator types don't match Render.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asApp = (fn: () => Generator) => fn as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asBuilder = (fn: () => Generator) => fn as any;

function createRecordingPlugin(name: string, log: string[]): Plugin {
  return {
    name,
    types: ["mock"],
    initContext(_ctx, parentCtx) {
      log.push(`${name}:initContext(parent=${!!parentCtx})`);
    },
    mergeChildContext(_parentCtx, _childCtx) {
      log.push(`${name}:mergeChildContext`);
    },
    process(request, _ctx) {
      const req = request as { type: string; value: string };
      log.push(`${name}:process(${req.value})`);
      return undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("processChildren scope override", () => {
  it("uses the child scope's backend.initContext", () => {
    const parentInit = vi.fn();
    const childInit = vi.fn();

    const parentBackend = createMockBackend("parent-be", parentInit);
    const childBackend = createMockBackend("child-be", childInit);

    const childPlugin: Plugin = { name: "child-only", types: [] };
    const childScope = createExecutionScope(childBackend, [childPlugin]);

    const parentPlugin: Plugin = {
      name: "parent-plugin",
      types: ["mock"],
      process(_request, ctx) {
        ctx.processChildren(function* () {}, { scope: childScope });
        return undefined;
      },
    };

    mount(
      asApp(function* () {
        yield { type: "mock", value: "trigger" };
      }),
      { backend: parentBackend, plugins: [parentPlugin] },
    );

    expect(childInit).toHaveBeenCalled();
  });

  it("dispatches requests to the child scope's plugins", () => {
    const log: string[] = [];

    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const parentPlugin = createRecordingPlugin("parent-plugin", log);
    const childPlugin = createRecordingPlugin("child-plugin", log);

    const childScope = createExecutionScope(childBackend, [childPlugin]);

    const switchPlugin: Plugin = {
      name: "switch-plugin",
      types: ["switch"],
      process(_request, ctx) {
        ctx.processChildren(
          asBuilder(function* () {
            yield { type: "mock", value: "in-child" };
          }),
          { scope: childScope },
        );
        return undefined;
      },
    };

    mount(
      asApp(function* () {
        yield { type: "mock", value: "in-parent" };
        yield { type: "switch" };
      }),
      { backend: parentBackend, plugins: [parentPlugin, switchPlugin] },
    );

    expect(log).toContain("parent-plugin:process(in-parent)");
    expect(log).toContain("child-plugin:process(in-child)");
    expect(log).not.toContain("child-plugin:process(in-parent)");
  });

  it("calls mergeChildContext using parent scope's plugins", () => {
    const parentLog: string[] = [];
    const childLog: string[] = [];

    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const parentPlugin: Plugin = {
      name: "tracking",
      types: ["switch"],
      mergeChildContext() {
        parentLog.push("parent:merge");
      },
      process(_request, ctx) {
        const childPlugin: Plugin = {
          name: "child-tracking",
          types: [],
          mergeChildContext() {
            childLog.push("child:merge");
          },
        };
        const childScope = createExecutionScope(childBackend, [childPlugin]);
        ctx.processChildren(function* () {}, { scope: childScope });
        return undefined;
      },
    };

    mount(
      asApp(function* () {
        yield { type: "switch" };
      }),
      { backend: parentBackend, plugins: [parentPlugin] },
    );

    // Parent's mergeChildContext IS called (it's in parent's allPlugins)
    expect(parentLog).toContain("parent:merge");
    // Child-only plugin's mergeChildContext is NOT called (not in parent's allPlugins)
    expect(childLog).toEqual([]);
  });

  it("passes parentCtx to child scope's plugin.initContext", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    let receivedParentCtx: RenderContext | undefined;

    const childPlugin: Plugin = {
      name: "child-plugin",
      types: [],
      initContext(_ctx, parentCtx) {
        receivedParentCtx = parentCtx;
      },
    };
    const childScope = createExecutionScope(childBackend, [childPlugin]);

    const switchPlugin: Plugin = {
      name: "switch",
      types: ["switch"],
      process(_request, ctx) {
        ctx.processChildren(function* () {}, { scope: childScope });
        return undefined;
      },
    };

    mount(
      asApp(function* () {
        yield { type: "switch" };
      }),
      { backend: parentBackend, plugins: [switchPlugin] },
    );

    expect(receivedParentCtx).toBeDefined();
  });

  it("defaults parent to ctx.parent when no parent option is given", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    let childParent: unknown;

    const childPlugin: Plugin = {
      name: "child-plugin",
      types: ["mock"],
      process(_request, ctx) {
        childParent = ctx.parent;
        return undefined;
      },
    };
    const childScope = createExecutionScope(childBackend, [childPlugin]);

    const switchPlugin: Plugin = {
      name: "switch",
      types: ["switch"],
      process(_request, ctx) {
        ctx.processChildren(
          asBuilder(function* () {
            yield { type: "mock", value: "check" };
          }),
          { scope: childScope },
        );
        return undefined;
      },
    };

    mount(
      asApp(function* () {
        yield { type: "switch" };
      }),
      { backend: parentBackend, plugins: [switchPlugin] },
    );

    // processChildren defaults parent to ctx.parent (parent scope's current parent)
    expect(childParent).toEqual({ __backend: "parent-be" });
  });

  it("can override both parent and scope simultaneously", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");
    const customParent = { custom: true };

    let childParent: unknown;

    const childPlugin: Plugin = {
      name: "child-plugin",
      types: ["mock"],
      process(_request, ctx) {
        childParent = ctx.parent;
        return undefined;
      },
    };
    const childScope = createExecutionScope(childBackend, [childPlugin]);

    const switchPlugin: Plugin = {
      name: "switch",
      types: ["switch"],
      process(_request, ctx) {
        ctx.processChildren(
          asBuilder(function* () {
            yield { type: "mock", value: "check" };
          }),
          { scope: childScope, parent: customParent },
        );
        return undefined;
      },
    };

    mount(
      asApp(function* () {
        yield { type: "switch" };
      }),
      { backend: parentBackend, plugins: [switchPlugin] },
    );

    expect(childParent).toBe(customParent);
  });
});
