/**
 * Type-level tests for the Capabilities system.
 *
 * Tests live in base (not core) because SpellSchema augmentations
 * that declare `capabilities` fields are defined here.
 */

import { describe, it, expectTypeOf } from "vitest";
import type {
  Plugin,
  Render,
  RequiredCapabilities,
  ProvidedCapabilities,
  CapabilityCheck,
} from "@ydant/core";
import { text, on, onMount } from "../primitives";
import { createHTMLElement } from "../elements/factory";

// ---------------------------------------------------------------------------
// ProvidedCapabilities
// ---------------------------------------------------------------------------

describe("ProvidedCapabilities", () => {
  it("extracts from a parameterized plugin", () => {
    expectTypeOf<ProvidedCapabilities<[Plugin<"tree" | "decorate">]>>().toEqualTypeOf<
      "tree" | "decorate"
    >();
  });

  it("merges capabilities from multiple plugins", () => {
    expectTypeOf<
      ProvidedCapabilities<[Plugin<"tree">, Plugin<"interact" | "schedule">]>
    >().toEqualTypeOf<"tree" | "interact" | "schedule">();
  });

  it("filters out wide string from unparameterized Plugin", () => {
    expectTypeOf<ProvidedCapabilities<[Plugin]>>().toEqualTypeOf<never>();
  });

  it("filters out wide string when mixed with specific capabilities", () => {
    expectTypeOf<ProvidedCapabilities<[Plugin, Plugin<"tree">]>>().toEqualTypeOf<"tree">();
  });

  it("returns never for empty plugin tuple", () => {
    expectTypeOf<ProvidedCapabilities<[]>>().toEqualTypeOf<never>();
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

  it("extracts union from generator yielding multiple spell types", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
      yield* on("click", () => {});
    }

    expectTypeOf<RequiredCapabilities<ReturnType<typeof app>>>().toEqualTypeOf<
      "tree" | "decorate" | "interact"
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

    type Result = CapabilityCheck<ReturnType<typeof app>, [Plugin<"tree" | "decorate">]>;
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it("produces error type when capabilities are missing", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
      yield* on("click", () => {});
    }

    // Only tree | decorate provided, but interact is also required
    type Result = CapabilityCheck<ReturnType<typeof app>, [Plugin<"tree" | "decorate">]>;
    expectTypeOf<Result>().toHaveProperty("__capabilityError");
  });

  it("produces {} for wide Render (Component annotation bypass)", () => {
    expectTypeOf<CapabilityCheck<Render, []>>().toEqualTypeOf<{}>();
  });

  it("produces {} for wide Render even with unparameterized plugins", () => {
    expectTypeOf<CapabilityCheck<Render, [Plugin]>>().toEqualTypeOf<{}>();
  });

  it("produces {} when superset of capabilities is provided", () => {
    function* app() {
      yield* text("hello");
    }

    // text requires only "tree", but all 4 are provided
    type Result = CapabilityCheck<
      ReturnType<typeof app>,
      [Plugin<"tree" | "decorate" | "interact" | "schedule">]
    >;
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it("produces {} with multiple plugins covering all requirements", () => {
    const el = createHTMLElement("div");
    function* app() {
      yield* el(() => []);
      yield* on("click", () => {});
    }

    // tree | decorate from first plugin, interact from second
    type Result = CapabilityCheck<
      ReturnType<typeof app>,
      [Plugin<"tree" | "decorate">, Plugin<"interact">]
    >;
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });
});
