import { describe, it, expect } from "vitest";
import { scope } from "../scope";
import { createEmbedPlugin } from "../embed";
import { sync } from "../scheduler";
import type { Backend, Plugin } from "../plugin";

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

const asApp = (fn: () => Generator) => fn as any;
const asBuilder = (fn: () => Generator) => fn as any;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("scope()", () => {
  describe(".mount()", () => {
    it("mounts a component and returns a handle", () => {
      const backend = createMockBackend("dom");
      let rendered = false;

      const plugin: Plugin = {
        name: "test",
        types: ["record"],
        process() {
          rendered = true;
          return undefined;
        },
      };

      const handle = scope(backend, [plugin]).mount(
        asApp(function* () {
          yield { type: "record" };
        }),
      );

      expect(rendered).toBe(true);
      expect(handle.hub).toBeDefined();
      expect(handle.dispose).toBeInstanceOf(Function);
    });

    it("passes scheduler to the primary engine", () => {
      const backend = createMockBackend("dom");
      let engineSchedulerUsed = false;

      const plugin: Plugin = {
        name: "test",
        types: ["check"],
        process(_req, ctx) {
          // Enqueue a task to verify the engine uses the scheduler
          ctx.engine.enqueue(() => {
            engineSchedulerUsed = true;
          });
          return undefined;
        },
      };

      scope(backend, [plugin]).mount(
        asApp(function* () {
          yield { type: "check" };
        }),
        { scheduler: sync },
      );

      // With sync scheduler, tasks execute immediately
      expect(engineSchedulerUsed).toBe(true);
    });

    it("calls plugin setup and teardown", () => {
      const backend = createMockBackend("dom");
      const log: string[] = [];

      const plugin: Plugin = {
        name: "lifecycle",
        types: [],
        setup() {
          log.push("setup");
        },
        teardown() {
          log.push("teardown");
        },
      };

      const handle = scope(backend, [plugin]).mount(asApp(function* () {}));

      expect(log).toEqual(["setup"]);
      handle.dispose();
      expect(log).toEqual(["setup", "teardown"]);
    });
  });

  describe(".embed()", () => {
    it("yields an embed request with the scope", () => {
      const backend = createMockBackend("canvas");
      const builder = scope(backend, []);
      const content = function* () {};

      const gen = builder.embed(content);
      const step = gen.next();

      expect(step.done).toBe(false);
      expect(step.value).toMatchObject({
        type: "embed",
        content,
      });
    });

    it("passes scheduler in the embed request", () => {
      const backend = createMockBackend("canvas");
      const builder = scope(backend, []);

      const gen = builder.embed(function* () {}, { scheduler: sync });
      const step = gen.next();

      expect((step.value as any).scheduler).toBe(sync);
    });

    it("works with yield* inside a mount to perform cross-scope embed", () => {
      const domBackend = createMockBackend("dom");
      const canvasBackend = createMockBackend("canvas");

      let childScopeBackendName: string | undefined;

      const childPlugin: Plugin = {
        name: "child-recorder",
        types: ["record"],
        process(_request, ctx) {
          childScopeBackendName = ctx.scope.backend.name;
          return undefined;
        },
      };

      const canvasBuilder = scope(canvasBackend, [childPlugin]);

      scope(domBackend, []).mount(
        asApp(function* () {
          yield* canvasBuilder.embed(
            asBuilder(function* () {
              yield { type: "record" };
            }),
          );
        }),
      );

      expect(childScopeBackendName).toBe("canvas");
    });
  });

  describe("embed plugin auto-registration", () => {
    it("auto-registers embed plugin when not present", () => {
      const domBackend = createMockBackend("dom");
      const canvasBackend = createMockBackend("canvas");

      let embedded = false;

      const childPlugin: Plugin = {
        name: "child",
        types: ["record"],
        process() {
          embedded = true;
          return undefined;
        },
      };

      const canvasBuilder = scope(canvasBackend, [childPlugin]);

      // No explicit createEmbedPlugin() — scope() auto-registers it
      scope(domBackend, []).mount(
        asApp(function* () {
          yield* canvasBuilder.embed(
            asBuilder(function* () {
              yield { type: "record" };
            }),
          );
        }),
      );

      expect(embedded).toBe(true);
    });

    it("does not duplicate embed plugin if already present", () => {
      const backend = createMockBackend("dom");
      const builder = scope(backend, [createEmbedPlugin()]);

      // mount should work without errors (no duplicate plugin)
      const handle = builder.mount(asApp(function* () {}));
      expect(handle).toBeDefined();
    });
  });

  describe("same builder for multiple embeds", () => {
    it("shares the same execution scope across embeds", () => {
      const domBackend = createMockBackend("dom");
      const canvasBackend = createMockBackend("canvas");

      const scopes: string[] = [];

      const childPlugin: Plugin = {
        name: "scope-tracker",
        types: ["track"],
        process(_req, ctx) {
          scopes.push(ctx.scope.backend.name);
          return undefined;
        },
      };

      const canvasBuilder = scope(canvasBackend, [childPlugin]);

      scope(domBackend, []).mount(
        asApp(function* () {
          yield* canvasBuilder.embed(
            asBuilder(function* () {
              yield { type: "track" };
            }),
          );
          yield* canvasBuilder.embed(
            asBuilder(function* () {
              yield { type: "track" };
            }),
          );
        }),
      );

      expect(scopes).toEqual(["canvas", "canvas"]);
    });
  });
});
