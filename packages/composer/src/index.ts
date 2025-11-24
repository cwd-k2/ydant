import type { Definition } from "@ydant/interface";

export * from "./composer";
export * from "./native";
export * from "./text";

export type DefineSlots<S extends string[]> = {
  [K in S[number]]: Definition;
};
