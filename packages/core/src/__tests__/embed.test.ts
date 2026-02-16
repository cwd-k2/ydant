import { describe, it, expect, vi } from "vitest";
import { mount, createExecutionScope, createEmbedPlugin, embed } from "../index";
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
    });
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
});
