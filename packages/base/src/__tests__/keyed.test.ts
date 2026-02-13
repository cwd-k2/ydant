import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@ydant/core";
import { createBasePlugin } from "../plugin";
import { createDOMCapabilities } from "../capabilities";
import { div, button } from "../elements/html";
import { on, text, keyed, onMount } from "../primitives";
import type { Slot } from "../types";

describe("keyed element reuse", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it("reuses DOM node on Slot.refresh()", () => {
    let slot: Slot | undefined;

    mount(
      () =>
        div(function* () {
          slot = yield* div(function* () {
            yield* keyed("stable", div)(() => [text("hello")]);
          });
        }),
      {
        root: container,
        plugins: [createDOMCapabilities(), createBasePlugin()],
      },
    );

    const nodeBefore = (slot!.node as HTMLElement).firstElementChild;
    expect(nodeBefore).not.toBeNull();

    slot!.refresh(function* () {
      yield* keyed("stable", div)(() => [text("updated")]);
    });

    const nodeAfter = (slot!.node as HTMLElement).firstElementChild;
    expect(nodeAfter).toBe(nodeBefore);
    expect(nodeAfter!.textContent).toBe("updated");
  });

  it("does not duplicate listeners on reused keyed element", () => {
    const handler = vi.fn();
    let slot: Slot | undefined;

    mount(
      () =>
        div(function* () {
          slot = yield* div(function* () {
            yield* keyed("btn", button)(() => [on("click", handler), text("Click")]);
          });
        }),
      {
        root: container,
        plugins: [createDOMCapabilities(), createBasePlugin()],
      },
    );

    slot!.refresh(function* () {
      yield* keyed("btn", button)(() => [on("click", handler), text("Click Again")]);
    });

    const btn = container.querySelector("button");
    btn?.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not re-fire onMount on reused keyed element", () => {
    const mountCallback = vi.fn();
    let slot: Slot | undefined;

    mount(
      () =>
        div(function* () {
          slot = yield* div(function* () {
            yield* keyed("item", div)(() => [onMount(mountCallback), text("content")]);
          });
        }),
      {
        root: container,
        plugins: [createDOMCapabilities(), createBasePlugin()],
      },
    );

    vi.advanceTimersToNextFrame();
    expect(mountCallback).toHaveBeenCalledTimes(1);

    slot!.refresh(function* () {
      yield* keyed("item", div)(() => [onMount(mountCallback), text("new content")]);
    });

    vi.advanceTimersToNextFrame();
    // onMount should NOT fire again on a reused element
    expect(mountCallback).toHaveBeenCalledTimes(1);
  });
});
