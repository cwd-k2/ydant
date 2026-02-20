import type { Component } from "@ydant/core";
import { div, h1, p, span, text, createSlotRef, onUnmount, onMount } from "@ydant/base";
import { Suspense } from "@ydant/async";
import { createResource } from "@ydant/async";
import { fetchMetrics } from "../api";
import { getUser } from "../auth";
import { MetricCard } from "../components/MetricCard";

export const DashboardPage: Component = () =>
  div({ class: "p-6" }, function* () {
    const user = getUser();
    yield* h1({ class: "text-2xl font-bold mb-2" }, "Dashboard");
    yield* p(
      { class: "text-gray-400 mb-6" },
      `Welcome, ${user?.name ?? "User"} (${user?.role ?? "unknown"})`,
    );

    // Resource with auto-refetch every 5 seconds
    const metricsResource = createResource(fetchMetrics, { refetchInterval: 5000 });

    // SlotRef for polling UI updates
    const metricsRef = createSlotRef();
    const statusRef = createSlotRef();
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function renderMetrics(): void {
      try {
        const m = metricsResource.peek();
        metricsRef.refresh(function* () {
          yield* MetricCard({ label: "Active Users", value: String(m.activeUsers), color: "blue" });
          yield* MetricCard({
            label: "Requests/min",
            value: String(m.requestsPerMin),
            color: "green",
          });
          yield* MetricCard({
            label: "Error Rate",
            value: `${m.errorRate}`,
            unit: "%",
            color: "red",
          });
          yield* MetricCard({
            label: "CPU Usage",
            value: `${m.cpuUsage}`,
            unit: "%",
            color: "purple",
          });
          yield* MetricCard({
            label: "Memory",
            value: `${m.memoryUsage}`,
            unit: "%",
            color: "yellow",
          });
          yield* MetricCard({ label: "Uptime", value: m.uptime, color: "gray" });
        });
        statusRef.refresh(function* () {
          yield* text(`Last updated: ${new Date().toLocaleTimeString()}`);
        });
      } catch {
        // Still loading — skip this poll cycle
      }
    }

    // Initial render via Suspense, then poll for updates
    yield* Suspense({
      fallback: () =>
        div({ class: "flex items-center justify-center py-12" }, () => [
          span({ class: "text-gray-400" }, "Loading metrics..."),
        ]),
      content: function* () {
        const m = metricsResource();

        // Initial render
        metricsRef.bind(
          yield* div({ class: "grid grid-cols-2 md:grid-cols-3 gap-4" }, function* () {
            yield* MetricCard({
              label: "Active Users",
              value: String(m.activeUsers),
              color: "blue",
            });
            yield* MetricCard({
              label: "Requests/min",
              value: String(m.requestsPerMin),
              color: "green",
            });
            yield* MetricCard({
              label: "Error Rate",
              value: `${m.errorRate}`,
              unit: "%",
              color: "red",
            });
            yield* MetricCard({
              label: "CPU Usage",
              value: `${m.cpuUsage}`,
              unit: "%",
              color: "purple",
            });
            yield* MetricCard({
              label: "Memory",
              value: `${m.memoryUsage}`,
              unit: "%",
              color: "yellow",
            });
            yield* MetricCard({ label: "Uptime", value: m.uptime, color: "gray" });
          }),
        );

        statusRef.bind(
          yield* p(
            { class: "text-xs text-gray-400" },
            `Last updated: ${new Date().toLocaleTimeString()}`,
          ),
        );

        // Start polling for UI updates (resource auto-refetches data)
        yield* onMount(() => {
          pollTimer = setInterval(renderMetrics, 5000);
        });
      },
    });

    yield* p({ class: "mt-4 text-sm text-gray-400" }, "Metrics auto-refresh every 5 seconds");

    // Cleanup
    yield* onUnmount(() => {
      metricsResource.dispose();
      if (pollTimer) clearInterval(pollTimer);
    });
  });
