import type { Metrics } from "./types";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatUptime(): string {
  const hours = randomBetween(100, 999);
  const minutes = randomBetween(0, 59);
  return `${hours}h ${minutes}m`;
}

/**
 * Mock API: returns randomized metrics with a simulated network delay.
 */
export async function fetchMetrics(): Promise<Metrics> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    activeUsers: randomBetween(120, 350),
    requestsPerMin: randomBetween(1500, 4500),
    errorRate: +(Math.random() * 5).toFixed(2),
    cpuUsage: randomBetween(20, 85),
    memoryUsage: randomBetween(40, 90),
    uptime: formatUptime(),
  };
}
