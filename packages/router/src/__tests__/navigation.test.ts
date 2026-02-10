import { describe, it, expect, vi, beforeEach } from "vitest";
import { navigate, goBack, goForward, getRoute } from "../navigation";
import { ROUTE_CHANGE_EVENT } from "../state";

describe("getRoute", () => {
  it("returns route info derived from window.location", () => {
    const route = getRoute();

    expect(route.path).toBe(window.location.pathname);
    expect(route.hash).toBe(window.location.hash);
    expect(typeof route.query).toBe("object");
  });

  it("does not include params property", () => {
    const route = getRoute();

    expect(route).not.toHaveProperty("params");
  });
});

describe("navigate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  it("calls pushState by default", () => {
    navigate("/new-path");

    expect(window.history.pushState).toHaveBeenCalledWith(null, "", "/new-path");
  });

  it("calls replaceState when replace=true", () => {
    navigate("/new-path", true);

    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/new-path");
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("dispatches ydant:route-change event", () => {
    const listener = vi.fn();
    window.addEventListener(ROUTE_CHANGE_EVENT, listener);

    navigate("/trigger-event");

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(ROUTE_CHANGE_EVENT, listener);
  });
});

describe("goBack", () => {
  it("calls history.back()", () => {
    vi.spyOn(window.history, "back").mockImplementation(() => {});

    goBack();

    expect(window.history.back).toHaveBeenCalled();
  });
});

describe("goForward", () => {
  it("calls history.forward()", () => {
    vi.spyOn(window.history, "forward").mockImplementation(() => {});

    goForward();

    expect(window.history.forward).toHaveBeenCalled();
  });
});
