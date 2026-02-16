import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@ydant/core";
import { createBasePlugin, div, text, createSlotRef } from "..";
import { createDOMBackend } from "../capabilities";

describe("createSlotRef", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("starts with null current and node", () => {
    const ref = createSlotRef();
    expect(ref.current).toBeNull();
    expect(ref.node).toBeNull();
  });

  it("can bind a slot and access its properties", () => {
    const ref = createSlotRef();

    mount(
      () =>
        div(function* () {
          const slot = yield* div(function* () {
            yield* text("initial");
          });
          ref.bind(slot);
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin()],
      },
    );

    expect(ref.current).not.toBeNull();
    expect(ref.node).toBeInstanceOf(HTMLElement);
    expect((ref.node as HTMLElement).textContent).toBe("initial");
  });

  it("can refresh content through the ref", () => {
    const ref = createSlotRef();

    mount(
      () =>
        div(function* () {
          const slot = yield* div(function* () {
            yield* text("before");
          });
          ref.bind(slot);
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin()],
      },
    );

    expect((ref.node as HTMLElement).textContent).toBe("before");

    ref.refresh(() => [text("after")]);
    expect((ref.node as HTMLElement).textContent).toBe("after");
  });

  it("refresh is a no-op when not bound", () => {
    const ref = createSlotRef();
    // Should not throw
    expect(() => ref.refresh(() => [text("test")])).not.toThrow();
  });
});
