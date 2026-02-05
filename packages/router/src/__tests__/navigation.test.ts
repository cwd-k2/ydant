import { describe, it, expect, vi, beforeEach } from "vitest";
import { navigate, goBack, goForward, getRoute } from "../navigation";
import { currentRoute, updateRoute } from "../state";

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

  it("updates route state", () => {
    navigate("/updated");

    expect(currentRoute.path).toBe("/updated");
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

describe("getRoute", () => {
  it("returns current route info", () => {
    updateRoute("/test-path?foo=bar#section");

    const route = getRoute();

    expect(route.path).toBe("/test-path");
    expect(route.query).toEqual({ foo: "bar" });
    expect(route.hash).toBe("#section");
  });
});
