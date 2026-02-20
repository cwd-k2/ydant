import { describe, it, expect, vi, beforeEach } from "vitest";
import { scope } from "@ydant/core";
import type { Slot } from "@ydant/base";
import {
  createBasePlugin,
  createDOMBackend,
  div,
  text,
  onMount,
  onUnmount,
  refresh,
} from "@ydant/base";
import { createPortalPlugin, portal } from "../index";

describe("Portal plugin", () => {
  it("renders children into a different target", () => {
    const root = document.createElement("div");
    const portalTarget = document.createElement("div");

    function* App() {
      yield* div(() => [text("Main content")]);
      yield* portal(portalTarget, () => [div({ class: "modal" }, () => [text("Portal content")])]);
    }

    scope(createDOMBackend(root), [createBasePlugin(), createPortalPlugin()]).mount(App);

    expect(root.textContent).toContain("Main content");
    expect(root.textContent).not.toContain("Portal content");
    expect(portalTarget.textContent).toContain("Portal content");
    expect(portalTarget.querySelector(".modal")).toBeTruthy();
  });

  it("renders multiple portals to different targets", () => {
    const root = document.createElement("div");
    const target1 = document.createElement("div");
    const target2 = document.createElement("div");

    function* App() {
      yield* portal(target1, () => [text("Portal 1")]);
      yield* portal(target2, () => [text("Portal 2")]);
    }

    scope(createDOMBackend(root), [createBasePlugin(), createPortalPlugin()]).mount(App);

    expect(target1.textContent).toBe("Portal 1");
    expect(target2.textContent).toBe("Portal 2");
  });

  it("renders nested elements inside a portal", () => {
    const root = document.createElement("div");
    const target = document.createElement("div");

    function* App() {
      yield* portal(target, () => [div(() => [div(() => [text("Deeply nested")])])]);
    }

    scope(createDOMBackend(root), [createBasePlugin(), createPortalPlugin()]).mount(App);

    expect(target.querySelector("div > div")?.textContent).toBe("Deeply nested");
  });

  it("cleans up portal target children on refresh()", () => {
    const root = document.createElement("div");
    const portalTarget = document.createElement("div");
    let parentSlot: Slot;

    function* App() {
      parentSlot = yield* div(function* () {
        yield* text("Main");
        yield* portal(portalTarget, () => [text("Portal content")]);
      });
    }

    scope(createDOMBackend(root), [createBasePlugin(), createPortalPlugin()]).mount(App);

    expect(portalTarget.textContent).toBe("Portal content");

    // Refresh the parent slot without portal
    refresh(parentSlot!, () => [text("Refreshed")]);

    expect(portalTarget.textContent).toBe("");
    expect(root.textContent).toBe("Refreshed");
  });

  it("multiple portals to same target: unmount of one clears all content", () => {
    const root = document.createElement("div");
    const sharedTarget = document.createElement("div");
    let parentSlot: Slot;

    function* App() {
      parentSlot = yield* div(function* () {
        yield* portal(sharedTarget, () => [text("Portal A")]);
      });
      yield* portal(sharedTarget, () => [text("Portal B")]);
    }

    scope(createDOMBackend(root), [createBasePlugin(), createPortalPlugin()]).mount(App);

    expect(sharedTarget.textContent).toContain("Portal A");
    expect(sharedTarget.textContent).toContain("Portal B");

    // Refresh the div containing Portal A — its unmount triggers clearChildren on sharedTarget
    refresh(parentSlot!, () => [text("No portal")]);

    // Portal B's content is also gone because clearChildren removed all children
    expect(sharedTarget.textContent).toBe("");
  });

  describe("lifecycle inside portal", () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      vi.useFakeTimers();
    });

    it("onMount fires inside portal content", () => {
      const portalTarget = document.createElement("div");
      const mountCallback = vi.fn();

      function* App() {
        yield* div(function* () {
          yield* portal(portalTarget, function* () {
            yield* div(() => [text("In portal")]);
            yield* onMount(mountCallback);
          });
        });
      }

      scope(createDOMBackend(container), [createBasePlugin(), createPortalPlugin()]).mount(App);

      expect(mountCallback).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(mountCallback).toHaveBeenCalledOnce();
    });

    it("onUnmount fires when portal parent is refreshed", () => {
      const portalTarget = document.createElement("div");
      const unmountCallback = vi.fn();
      let parentSlot: Slot;

      function* App() {
        parentSlot = yield* div(function* () {
          yield* portal(portalTarget, function* () {
            yield* div(() => [text("In portal")]);
            yield* onUnmount(unmountCallback);
          });
        });
      }

      scope(createDOMBackend(container), [createBasePlugin(), createPortalPlugin()]).mount(App);

      expect(unmountCallback).not.toHaveBeenCalled();

      // Refresh parent slot — portal content should be unmounted
      refresh(parentSlot!, () => [text("No portal")]);

      expect(unmountCallback).toHaveBeenCalledOnce();
      expect(portalTarget.textContent).toBe("");
    });
  });
});
