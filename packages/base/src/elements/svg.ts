/**
 * @ydant/base - SVG 要素
 */

import type { Builder } from "@ydant/core";
import type { ElementRender } from "../types";
import { createSVGElement } from "./factory";

export const svg = createSVGElement("svg");
export const circle = createSVGElement("circle");
export const ellipse = createSVGElement("ellipse");
export const line = createSVGElement("line");
export const path = createSVGElement("path");
export const polygon = createSVGElement("polygon");
export const polyline = createSVGElement("polyline");
export const rect = createSVGElement("rect");
export const g = createSVGElement("g");
export const defs = createSVGElement("defs");
export const use = createSVGElement("use");
export const clipPath = createSVGElement("clipPath");
export const mask = createSVGElement("mask");
export const linearGradient = createSVGElement("linearGradient");
export const radialGradient = createSVGElement("radialGradient");
export const stop = createSVGElement("stop");
export const svgText = createSVGElement("text");
export const tspan = createSVGElement("tspan");
