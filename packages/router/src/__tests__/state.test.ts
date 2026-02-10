import { describe, it, expect } from "vitest";
import { ROUTE_CHANGE_EVENT } from "../state";

describe("ROUTE_CHANGE_EVENT", () => {
  it("is a string constant", () => {
    expect(typeof ROUTE_CHANGE_EVENT).toBe("string");
    expect(ROUTE_CHANGE_EVENT).toBe("ydant:route-change");
  });
});
