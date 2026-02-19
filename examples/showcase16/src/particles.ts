/**
 * Showcase 16 — Particle model + physics
 *
 * 高優先（少数・大）と低優先（多数・小）のパーティクルセット。
 * signal でリアクティブに Canvas シーンに反映される。
 */

import { signal } from "@ydant/reactive";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

const W = 430;
const H = 300;

function randomParticle(minR: number, maxR: number, colors: string[]): Particle {
  const r = minR + Math.random() * (maxR - minR);
  return {
    x: r + Math.random() * (W - 2 * r),
    y: r + Math.random() * (H - 2 * r),
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3,
    r,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

const HIGH_COLORS = ["#ef4444", "#f97316", "#eab308", "#f43f5e"];
const LOW_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#0ea5e9"];

export const highParticles = signal<Particle[]>(
  Array.from({ length: 8 }, () => randomParticle(15, 30, HIGH_COLORS)),
);

export const lowParticles = signal<Particle[]>(
  Array.from({ length: 40 }, () => randomParticle(3, 8, LOW_COLORS)),
);

function updateParticles(particles: Particle[]): Particle[] {
  return particles.map((p) => {
    let { x, y, vx, vy } = p;
    x += vx;
    y += vy;
    if (x - p.r < 0 || x + p.r > W) vx = -vx;
    if (y - p.r < 0 || y + p.r > H) vy = -vy;
    x = Math.max(p.r, Math.min(W - p.r, x));
    y = Math.max(p.r, Math.min(H - p.r, y));
    return { ...p, x, y, vx, vy };
  });
}

export function tickHigh() {
  highParticles.set(updateParticles(highParticles()));
}

export function tickLow() {
  lowParticles.set(updateParticles(lowParticles()));
}
