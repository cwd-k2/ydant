import type { Component } from "@ydant/core";
import { div, h1, p, span, text, classes, createSlotRef, onUnmount, onMount } from "@ydant/base";
import { Suspense } from "@ydant/async";
import { createResource } from "@ydant/async";
import { fetchMetrics } from "../api";
import { getUser } from "../auth";
import { MetricCard } from "../components/MetricCard";

export const DashboardPage: Component = () =>
  div(function* () {
    yield* classes("p-6");

    const user = getUser();
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-2"), text(`Dashboard`)]);
    yield* p(() => [
      classes("text-gray-500", "mb-6"),
      text(`Welcome, ${user?.name ?? "User"} (${user?.role ?? "unknown"})`),
    ]);

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
          yield* classes("grid", "grid-cols-2", "md:grid-cols-3", "gap-4");
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
          yield* classes("text-xs", "text-gray-400");
          yield* text(`Last updated: ${new Date().toLocaleTimeString()}`);
        });
      } catch {
        // Still loading — skip this poll cycle
      }
    }

    // Initial render via Suspense, then poll for updates
    yield* Suspense({
      fallback: () =>
        div(() => [
          classes("flex", "items-center", "justify-center", "py-12"),
          span(() => [classes("text-gray-500"), text("Loading metrics...")]),
        ]),
      content: function* () {
        const m = metricsResource();

        // Initial render
        metricsRef.bind(
          yield* div(function* () {
            yield* classes("grid", "grid-cols-2", "md:grid-cols-3", "gap-4");
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
          yield* p(function* () {
            yield* classes("text-xs", "text-gray-400");
            yield* text(`Last updated: ${new Date().toLocaleTimeString()}`);
          }),
        );

        // Start polling for UI updates (resource auto-refetches data)
        yield* onMount(() => {
          pollTimer = setInterval(renderMetrics, 5000);
        });
      },
    });

    yield* p(() => [
      classes("mt-4", "text-sm", "text-gray-400"),
      text("Metrics auto-refresh every 5 seconds"),
    ]);

    // Cleanup
    yield* onUnmount(() => {
      metricsResource.dispose();
      if (pollTimer) clearInterval(pollTimer);
    });
  });
