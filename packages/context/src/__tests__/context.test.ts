import { describe, it, expect } from "vitest";
import { createContext, provide, inject } from "../context";

describe("createContext", () => {
  it("creates Context with unique Symbol ID", () => {
    const ctx1 = createContext<string>();
    const ctx2 = createContext<string>();

    expect(typeof ctx1.id).toBe("symbol");
    expect(typeof ctx2.id).toBe("symbol");
    expect(ctx1.id).not.toBe(ctx2.id);
  });

  it("stores default value", () => {
    const ctx = createContext<string>("default");
    expect(ctx.defaultValue).toBe("default");
  });

  it("handles undefined default value", () => {
    const ctx = createContext<string>();
    expect(ctx.defaultValue).toBeUndefined();
  });

  it("preserves type of default value", () => {
    const numCtx = createContext<number>(42);
    const objCtx = createContext<{ name: string }>({ name: "test" });
    const arrCtx = createContext<number[]>([1, 2, 3]);

    expect(numCtx.defaultValue).toBe(42);
    expect(objCtx.defaultValue).toEqual({ name: "test" });
    expect(arrCtx.defaultValue).toEqual([1, 2, 3]);
  });
});

describe("provide", () => {
  it("yields ContextProvide with correct type", () => {
    const ctx = createContext<string>("default");
    const gen = provide(ctx, "provided value");
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "context-provide",
      context: ctx,
      value: "provided value",
    });
  });

  it("completes after yielding", () => {
    const ctx = createContext<string>();
    const gen = provide(ctx, "value");

    gen.next();
    const result = gen.next();

    expect(result.done).toBe(true);
  });
});

describe("inject", () => {
  it("yields ContextInject with correct type", () => {
    const ctx = createContext<string>("default");
    const gen = inject(ctx);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: "context-inject",
      context: ctx,
    });
  });

  it("returns value passed to next()", () => {
    const ctx = createContext<string>();
    const gen = inject(ctx);

    gen.next();
    const result = gen.next("injected value");

    expect(result.done).toBe(true);
    expect(result.value).toBe("injected value");
  });
});
