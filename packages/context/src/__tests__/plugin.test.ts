import { describe, it, expect, beforeEach } from "vitest";
import type { Builder } from "@ydant/core";
import { mount } from "@ydant/core";
import { createBasePlugin, div, p, text } from "@ydant/base";
import { createContext, provide, inject } from "../context";
import { createContextPlugin } from "../plugin";

describe("createContextPlugin", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("has correct name and types", () => {
    const plugin = createContextPlugin();

    expect(plugin.name).toBe("context");
    expect(plugin.types).toEqual(["context-provide", "context-inject"]);
  });

  describe("context-provide processing", () => {
    it("sets context value for descendants", () => {
      const ThemeContext = createContext<string>("light");
      let capturedTheme: string = "";

      mount(
        () =>
          div(function* () {
            yield* provide(ThemeContext, "dark");
            // Cast to work around type mismatch with inject's return type
            yield* p(function* () {
              capturedTheme = yield* inject(ThemeContext);
              yield* text(capturedTheme);
            } as Builder);
          }),
        container,
        { plugins: [createBasePlugin(), createContextPlugin()] },
      );

      expect(capturedTheme).toBe("dark");
    });
  });

  describe("context-inject processing", () => {
    it("retrieves value from nearest provider", () => {
      const LevelContext = createContext<number>(0);
      const capturedLevels: number[] = [];

      mount(
        () =>
          div(function* () {
            yield* provide(LevelContext, 1);
            const level1 = yield* inject(LevelContext);
            capturedLevels.push(level1);

            yield* div(function* () {
              yield* provide(LevelContext, 2);
              const level2 = yield* inject(LevelContext);
              capturedLevels.push(level2);

              yield* div(function* () {
                const level3 = yield* inject(LevelContext);
                capturedLevels.push(level3);
              } as Builder);
            });
          }),
        container,
        { plugins: [createBasePlugin(), createContextPlugin()] },
      );

      expect(capturedLevels).toEqual([1, 2, 2]);
    });

    it("falls back to default value when no provider", () => {
      const MissingContext = createContext<string>("default-value");
      let capturedValue: string = "";

      mount(
        () =>
          div(function* () {
            capturedValue = yield* inject(MissingContext);
            yield* text(capturedValue);
          }),
        container,
        { plugins: [createBasePlugin(), createContextPlugin()] },
      );

      expect(capturedValue).toBe("default-value");
    });

    it("returns undefined when no provider and no default", () => {
      const NoDefaultContext = createContext<string>();
      let capturedValue: string | undefined = "initial";

      mount(
        () =>
          div(function* () {
            capturedValue = yield* inject(NoDefaultContext);
          } as Builder),
        container,
        { plugins: [createBasePlugin(), createContextPlugin()] },
      );

      expect(capturedValue).toBeUndefined();
    });
  });

  describe("multiple contexts", () => {
    it("handles multiple independent contexts", () => {
      const ThemeContext = createContext<string>("light");
      const UserContext = createContext<{ name: string } | null>(null);

      let theme: string = "";
      let user: { name: string } | null = null;

      mount(
        () =>
          div(function* () {
            yield* provide(ThemeContext, "dark");
            yield* provide(UserContext, { name: "Alice" });

            yield* p(function* () {
              theme = yield* inject(ThemeContext);
              user = yield* inject(UserContext);
            } as Builder);
          }),
        container,
        { plugins: [createBasePlugin(), createContextPlugin()] },
      );

      expect(theme).toBe("dark");
      expect(user).toEqual({ name: "Alice" });
    });
  });
});
