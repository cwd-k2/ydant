import { describe, it, expect } from "vitest";
import { createRouterPlugin } from "../plugin";

describe("createRouterPlugin", () => {
  it("creates a plugin with correct name", () => {
    const plugin = createRouterPlugin();

    expect(plugin.name).toBe("router");
  });

  it("declares no types (does not handle any request types)", () => {
    const plugin = createRouterPlugin();

    expect(plugin.types).toEqual([]);
  });

  it("depends on the base plugin", () => {
    const plugin = createRouterPlugin();

    expect(plugin.dependencies).toContain("base");
  });

  it("process returns undefined for any request", () => {
    const plugin = createRouterPlugin();
    const result = plugin.process({} as any, {} as any);

    expect(result).toBeUndefined();
  });
});
