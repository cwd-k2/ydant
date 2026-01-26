import { describe, it, expect } from "vitest";
import { reactive } from "../reactive";

describe("reactive", () => {
  it("yields a Reactive object", () => {
    const gen = reactive(() => []);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "reactive",
      builder: expect.any(Function),
    });
  });

  it("stores the builder", () => {
    const builder = () => [];
    const gen = reactive(builder);
    const result = gen.next();

    expect((result.value as unknown as { builder: () => [] }).builder).toBe(builder);
  });

  it("completes after yielding", () => {
    const gen = reactive(() => []);
    gen.next(); // yield
    const result = gen.next();

    expect(result.done).toBe(true);
    expect(result.value).toBeUndefined();
  });
});
