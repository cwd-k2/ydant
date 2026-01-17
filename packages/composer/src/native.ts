import type { ChildrenFn, ElementGenerator } from "@ydant/interface";
import { toChildren } from "@ydant/interface";

function createHTMLElement(tag: string) {
  return function* (children: ChildrenFn): ElementGenerator {
    const holds = toChildren(children());
    const refresher = yield { type: "element", tag, holds };
    return refresher;
  };
}

export const div = createHTMLElement("div");
export const span = createHTMLElement("span");
export const p = createHTMLElement("p");
export const h1 = createHTMLElement("h1");
export const h2 = createHTMLElement("h2");
export const h3 = createHTMLElement("h3");
export const img = createHTMLElement("img");
export const button = createHTMLElement("button");
export const input = createHTMLElement("input");
export const ul = createHTMLElement("ul");
export const li = createHTMLElement("li");
export const a = createHTMLElement("a");
export const section = createHTMLElement("section");
export const header = createHTMLElement("header");
export const footer = createHTMLElement("footer");
export const nav = createHTMLElement("nav");
export const main = createHTMLElement("main");
export const article = createHTMLElement("article");
export const aside = createHTMLElement("aside");
export const form = createHTMLElement("form");
export const label = createHTMLElement("label");
export const textarea = createHTMLElement("textarea");
export const select = createHTMLElement("select");
export const option = createHTMLElement("option");
export const table = createHTMLElement("table");
export const thead = createHTMLElement("thead");
export const tbody = createHTMLElement("tbody");
export const tr = createHTMLElement("tr");
export const th = createHTMLElement("th");
export const td = createHTMLElement("td");
