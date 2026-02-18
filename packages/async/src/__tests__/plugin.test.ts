import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scope, sync } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { signal, reactive } from "@ydant/reactive";
import { createAsyncPlugin } from "../plugin";
import { boundary } from "../boundary";

describe("createAsyncPlugin", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
  });

  it("creates a plugin with correct name, types, and dependencies", () => {
    const plugin = createAsyncPlugin();

    expect(plugin.name).toBe("async");
    expect(plugin.types).toEqual(["boundary"]);
    expect(plugin.dependencies).toEqual(["base"]);
  });

  it("inherits handleRenderError from parent context", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* boundary(() => true);
          // processChildren creates a child context — handler propagates via initContext
          yield* div(function* () {
            yield* boundary(() => true);
            yield* text("inner");
          });
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("inner");
  });

  it("chains handlers: inner first, then parent", () => {
    const callOrder: string[] = [];
    const count = signal(0);

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        div(function* () {
          yield* boundary(() => {
            callOrder.push("parent");
            return true;
          });
          yield* boundary(() => {
            callOrder.push("inner");
            return false; // Not handled — delegate to parent
          });
          yield* reactive(() => {
            const val = count();
            if (val > 0) throw new Error("chain test");
            return [text(`Count: ${val}`)];
          });
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Trigger error — inner handler runs first (returns false), then parent (returns true)
    count.set(1);

    expect(callOrder).toEqual(["inner", "parent"]);
  });
});
