import { describe, it, expect, vi } from "vitest";
import { mount, createExecutionScope } from "../mount";
import { createEmbedPlugin, embed } from "../embed";
import { sync } from "../scheduler";
import type { Backend, Plugin, RenderContext } from "../plugin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockBackend(name: string): Backend {
  return {
    name,
    root: { __backend: name },
    initContext() {},
  };
}

// SpellSchema has embed registered, so we can use embed() spell directly.
// For custom test types, we still need asApp/asBuilder.
const asApp = (fn: () => Generator) => fn as any;
const asBuilder = (fn: () => Generator) => fn as any;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("embed spell + plugin", () => {
  it("embed spell yields an embed request", () => {
    const scope = createExecutionScope(createMockBackend("test"), []);
    const gen = embed(scope, function* () {});

    const result = gen.next();
    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "embed",
      scope,
      content: expect.any(Function),
      scheduler: undefined,
    });
  });

  it("embed spell passes scheduler in request", () => {
    const scope = createExecutionScope(createMockBackend("test"), []);
    const gen = embed(scope, function* () {}, { scheduler: sync });

    const result = gen.next();
    expect(result.done).toBe(false);
    expect((result.value as any).scheduler).toBe(sync);
  });

  it("createEmbedPlugin handles embed requests", () => {
    const plugin = createEmbedPlugin();

    expect(plugin.name).toBe("embed");
    expect(plugin.types).toEqual(["embed"]);
    expect(plugin.process).toBeDefined();
  });

  it("embed plugin switches scope via processChildren", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    let childScopeBackendName: string | undefined;

    const childPlugin: Plugin = {
      name: "child-recorder",
      types: ["record"],
      process(_request, ctx) {
        childScopeBackendName = ctx.scope.backend.name;
        return undefined;
      },
    };

    const childScope = createExecutionScope(childBackend, [childPlugin]);

    mount(
      asApp(function* () {
        yield* embed(
          childScope,
          asBuilder(function* () {
            yield { type: "record" };
          }),
        );
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    expect(childScopeBackendName).toBe("child-be");
  });

  it("embed plugin passes parent context to child scope", () => {
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

    mount(
      asApp(function* () {
        yield* embed(childScope, function* () {});
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    expect(receivedParentCtx).toBeDefined();
  });

  it("child scope backend.initContext is called", () => {
    const parentBackend = createMockBackend("parent-be");
    const childInit = vi.fn();
    const childBackend: Backend = {
      name: "child-be",
      root: {},
      initContext: childInit,
    };

    const childScope = createExecutionScope(childBackend, []);

    mount(
      asApp(function* () {
        yield* embed(childScope, function* () {});
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    expect(childInit).toHaveBeenCalled();
  });

  it("mergeChildContext propagates from child to parent", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const mergeCalls: string[] = [];

    const trackingPlugin: Plugin = {
      name: "tracking",
      types: [],
      mergeChildContext() {
        mergeCalls.push("merged");
      },
    };

    const childScope = createExecutionScope(childBackend, []);

    mount(
      asApp(function* () {
        yield* embed(childScope, function* () {});
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin(), trackingPlugin],
      },
    );

    // mergeChildContext is called by the parent's plugins
    expect(mergeCalls).toContain("merged");
  });

  it("cross-scope embed executes synchronously", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const order: string[] = [];

    const childPlugin: Plugin = {
      name: "child-recorder",
      types: ["record"],
      process() {
        order.push("child-processed");
        return undefined;
      },
    };

    const childScope = createExecutionScope(childBackend, [childPlugin]);

    mount(
      asApp(function* () {
        order.push("before-embed");
        yield* embed(
          childScope,
          asBuilder(function* () {
            yield { type: "record" };
          }),
        );
        order.push("after-embed");
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    // Embed executes synchronously — child processing happens between before and after
    expect(order).toEqual(["before-embed", "child-processed", "after-embed"]);
  });

  it("cross-scope embed uses target scope's backend root as parent", () => {
    const parentBackend = createMockBackend("parent-be");
    const childRoot = { __backend: "child-be" };
    const childBackend: Backend = {
      name: "child-be",
      root: childRoot,
      initContext() {},
    };

    let childParent: unknown;

    const childPlugin: Plugin = {
      name: "child-recorder",
      types: ["record"],
      process(_request, ctx) {
        childParent = ctx.parent;
        return undefined;
      },
    };

    const childScope = createExecutionScope(childBackend, [childPlugin]);

    mount(
      asApp(function* () {
        yield* embed(
          childScope,
          asBuilder(function* () {
            yield { type: "record" };
          }),
        );
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    // Cross-scope embed should use the child backend's root, not the parent's
    expect(childParent).toBe(childRoot);
  });

  it("cross-scope embed spawns an engine for the target scope", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const childScope = createExecutionScope(childBackend, []);

    const handle = mount(
      asApp(function* () {
        yield* embed(childScope, function* () {});
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    // An engine should have been spawned for the child scope
    expect(handle.hub.resolve(childScope)).toBeDefined();
  });

  it("cross-scope embed returns the spawned engine", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const childScope = createExecutionScope(childBackend, []);
    let returnedEngine: unknown;

    mount(
      asApp(function* () {
        const gen = embed(childScope, function* () {});
        gen.next();
        // Simulate runtime passing the engine as response
        const step2 = gen.next({ id: "mock-engine" } as any);
        returnedEngine = step2.value;
      }),
      {
        backend: parentBackend,
        plugins: [createEmbedPlugin()],
      },
    );

    expect(returnedEngine).toEqual({ id: "mock-engine" });
  });

  it("embed plugin returns engine as response for cross-scope", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const childScope = createExecutionScope(childBackend, []);
    const plugin = createEmbedPlugin();

    // Simulate ctx for cross-scope
    const mockHub = {
      resolve: () => undefined,
      spawn: (_id: string, _scope: any, _opts?: any) => ({ id: "spawned-engine" }),
    };
    const mockCtx = {
      scope: createExecutionScope(parentBackend, []),
      engine: { hub: mockHub },
      processChildren: () => {},
    } as unknown as RenderContext;

    const result = plugin.process!(
      { type: "embed", scope: childScope, content: function* () {} } as any,
      mockCtx,
    );

    expect(result).toEqual({ id: "spawned-engine" });
  });

  it("same-scope embed returns ctx.engine", () => {
    const backend = createMockBackend("be");
    const theScope = createExecutionScope(backend, []);
    const plugin = createEmbedPlugin();

    const mockEngine = { id: "current-engine", hub: {} };
    const mockCtx = {
      scope: theScope,
      engine: mockEngine,
      processChildren: () => {},
    } as unknown as RenderContext;

    const result = plugin.process!(
      { type: "embed", scope: theScope, content: function* () {} } as any,
      mockCtx,
    );

    expect(result).toBe(mockEngine);
  });

  it("embed plugin passes scheduler to hub.spawn", () => {
    const parentBackend = createMockBackend("parent-be");
    const childBackend = createMockBackend("child-be");

    const childScope = createExecutionScope(childBackend, []);
    const plugin = createEmbedPlugin();

    const spawnSpy = vi.fn((_id: string, _scope: any, _opts?: any) => ({ id: "engine" }));
    const mockHub = {
      resolve: () => undefined,
      spawn: spawnSpy,
    };
    const mockCtx = {
      scope: createExecutionScope(parentBackend, []),
      engine: { hub: mockHub },
      processChildren: () => {},
    } as unknown as RenderContext;

    plugin.process!(
      { type: "embed", scope: childScope, content: function* () {}, scheduler: sync } as any,
      mockCtx,
    );

    expect(spawnSpy).toHaveBeenCalledWith(expect.any(String), childScope, { scheduler: sync });
  });
});
