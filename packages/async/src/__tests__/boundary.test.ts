import { describe, it, expect } from "vitest";
import { boundary } from "../boundary";

describe("boundary", () => {
  it("yields a boundary request with handler", () => {
    const handler = () => true;
    const gen = boundary(handler);

    const result = gen.next();
    expect(result.value).toEqual({ type: "boundary", handler });
    expect(result.done).toBe(false);
  });

  it("completes after yielding", () => {
    const gen = boundary(() => true);
    gen.next();
    const result = gen.next();
    expect(result.done).toBe(true);
  });
});
