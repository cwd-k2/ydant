import { describe, it, expect, vi, beforeEach } from "vitest";
import { currentRoute, routeListeners, updateRoute, __resetForTesting__ } from "../state";

describe("updateRoute", () => {
  beforeEach(() => {
    __resetForTesting__();
  });

  it("updates currentRoute with new path", () => {
    updateRoute("/new-path");

    expect(currentRoute.path).toBe("/new-path");
  });

  it("parses query string", () => {
    updateRoute("/path?key=value&other=123");

    expect(currentRoute.query).toEqual({
      key: "value",
      other: "123",
    });
  });

  it("parses hash", () => {
    updateRoute("/path#section");

    expect(currentRoute.hash).toBe("#section");
  });

  it("resets params to empty object", () => {
    currentRoute.params = { id: "123" };

    updateRoute("/new-path");

    expect(currentRoute.params).toEqual({});
  });

  it("notifies all listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    routeListeners.add(listener1);
    routeListeners.add(listener2);

    updateRoute("/trigger-listeners");

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });
});

describe("routeListeners", () => {
  beforeEach(() => {
    __resetForTesting__();
  });

  it("can add and remove listeners", () => {
    const listener = vi.fn();

    routeListeners.add(listener);
    expect(routeListeners.size).toBe(1);

    routeListeners.delete(listener);
    expect(routeListeners.size).toBe(0);
  });

  it("removed listener is not called", () => {
    const listener = vi.fn();

    routeListeners.add(listener);
    routeListeners.delete(listener);

    updateRoute("/path");

    expect(listener).not.toHaveBeenCalled();
  });
});
