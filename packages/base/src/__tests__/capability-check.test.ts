/**
 * Type-level tests for the Capabilities system.
 *
 * Tests live in base (not core) because SpellSchema augmentations
 * that declare `capabilities` fields are defined here.
 */

import { describe, it, expectTypeOf } from "vitest";
import type {
  Backend,
  Render,
  RequiredCapabilities,
  ProvidedCapabilities,
  CapabilityCheck,
} from "@ydant/core";
import { text, onMount } from "../primitives";
import { createHTMLElement } from "../elements/factory";

// ---------------------------------------------------------------------------
// ProvidedCapabilities
// ---------------------------------------------------------------------------

describe("ProvidedCapabilities", () => {
  it("extracts from a parameterized backend", () => {
    expectTypeOf<ProvidedCapabilities<Backend<"tree" | "decorate">>>().toEqualTypeOf<
      "tree" | "decorate"
    >();
  });

  it("filters out wide string from unparameterized Backend", () => {
    expectTypeOf<ProvidedCapabilities<Backend>>().toEqualTypeOf<never>();
  });

  it("returns never for Backend<never>", () => {
    expectTypeOf<ProvidedCapabilities<Backend<never>>>().toEqualTypeOf<never>();
  });
});

// ---------------------------------------------------------------------------
// RequiredCapabilities
// ---------------------------------------------------------------------------

describe("RequiredCapabilities", () => {
  it("extracts tree | decorate from element-yielding generator", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
    }

    expectTypeOf<RequiredCapabilities<ReturnType<typeof app>>>().toEqualTypeOf<
      "tree" | "decorate"
    >();
  });

  it("extracts tree from text-yielding generator", () => {
    function* app() {
      yield* text("hello");
    }

    expectTypeOf<RequiredCapabilities<ReturnType<typeof app>>>().toEqualTypeOf<"tree">();
  });

  it("extracts union from generator yielding element and lifecycle", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
      yield* onMount(() => {});
    }

    expectTypeOf<RequiredCapabilities<ReturnType<typeof app>>>().toEqualTypeOf<
      "tree" | "decorate" | "schedule"
    >();
  });

  it("returns never for empty generator", () => {
    function* app() {
      // yields nothing
    }

    expectTypeOf<RequiredCapabilities<ReturnType<typeof app>>>().toEqualTypeOf<never>();
  });

  it("includes schedule from lifecycle spells", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
      yield* onMount(() => {});
    }

    expectTypeOf<RequiredCapabilities<ReturnType<typeof app>>>().toEqualTypeOf<
      "tree" | "decorate" | "schedule"
    >();
  });
});

// ---------------------------------------------------------------------------
// CapabilityCheck
// ---------------------------------------------------------------------------

describe("CapabilityCheck", () => {
  it("produces {} when capabilities are satisfied", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => [text("hello")]);
    }

    type Result = CapabilityCheck<ReturnType<typeof app>, Backend<"tree" | "decorate">>;
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it("produces error type when capabilities are missing", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
      yield* onMount(() => {});
    }

    // Only tree | decorate provided, but schedule is also required
    type Result = CapabilityCheck<ReturnType<typeof app>, Backend<"tree" | "decorate">>;
    expectTypeOf<Result>().toHaveProperty("__capabilityError");
  });

  it("produces {} for wide Render (Component annotation bypass)", () => {
    expectTypeOf<CapabilityCheck<Render, Backend>>().toEqualTypeOf<{}>();
  });

  it("produces {} for wide Render even with unparameterized Backend", () => {
    expectTypeOf<CapabilityCheck<Render, Backend>>().toEqualTypeOf<{}>();
  });

  it("produces {} when superset of capabilities is provided", () => {
    function* app() {
      yield* text("hello");
    }

    // text requires only "tree", but all 4 are provided
    type Result = CapabilityCheck<
      ReturnType<typeof app>,
      Backend<"tree" | "decorate" | "interact" | "schedule">
    >;
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });
});
