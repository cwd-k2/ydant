import type { Component } from "@ydant/core";
import type { Notification, NotificationType } from "./types";
import { div, h1, h2, span, button, text, classes, on, createSlotRef } from "@ydant/base";
import { createTransitionGroupRefresher } from "@ydant/transition";

let nextId = 1;

const MESSAGES: Record<NotificationType, string[]> = {
  info: ["New user signed up", "System backup completed", "Report generated"],
  warning: ["Disk usage at 80%", "API rate limit approaching", "Certificate expires soon"],
  error: ["Database connection lost", "Payment processing failed", "Service unavailable"],
};

const TYPE_STYLES: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  info: { bg: "bg-blue-50", border: "border-blue-400", icon: "i" },
  warning: { bg: "bg-yellow-50", border: "border-yellow-400", icon: "!" },
  error: { bg: "bg-red-50", border: "border-red-400", icon: "x" },
};

function randomMessage(type: NotificationType): string {
  const msgs = MESSAGES[type];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function createNotification(type: NotificationType): Notification {
  return { id: nextId++, type, message: randomMessage(type), timestamp: Date.now() };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

/**
 * Notification Feed App
 *
 * createTransitionGroupRefresher で通知の追加・削除をアニメーション付きで管理する。
 * フィルタリング時にもアイテムの出入りに enter/leave が発動する。
 */
export const App: Component = () =>
  div(function* () {
    yield* classes("max-w-xl", "mx-auto", "p-6");
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-6"), text("Notification Feed")]);

    // --- State ---
    let notifications: Notification[] = [];
    let filter: NotificationType | "all" = "all";

    const listRef = createSlotRef();
    const countRef = createSlotRef();

    // --- Refresher ---
    const refresher = createTransitionGroupRefresher<Notification>({
      keyFn: (n) => n.id,
      enter: "notif-enter",
      enterFrom: "notif-enter-from",
      enterTo: "notif-enter-to",
      leave: "notif-leave",
      leaveFrom: "notif-leave-from",
      leaveTo: "notif-leave-to",
      content: (n) => NotificationItem(n, () => remove(n.id)),
    });

    function filteredItems(): Notification[] {
      if (filter === "all") return notifications;
      return notifications.filter((n) => n.type === filter);
    }

    function updateList(): void {
      const slot = listRef.current;
      if (slot) refresher(slot, filteredItems());
      countRef.refresh(() => [text(`${notifications.length} notifications`)]);
    }

    function add(type: NotificationType): void {
      notifications = [createNotification(type), ...notifications];
      updateList();
    }

    function remove(id: number): void {
      notifications = notifications.filter((n) => n.id !== id);
      updateList();
    }

    function clearAll(): void {
      notifications = [];
      updateList();
    }

    // --- Controls ---
    yield* div(function* () {
      yield* classes("flex", "flex-wrap", "gap-2", "mb-4");

      yield* h2(() => [
        classes("w-full", "text-sm", "font-semibold", "text-gray-500"),
        text("Add notification"),
      ]);

      for (const type of ["info", "warning", "error"] as const) {
        yield* button(function* () {
          const s = TYPE_STYLES[type];
          yield* classes(
            "px-3",
            "py-1",
            "rounded",
            "text-sm",
            "font-medium",
            "border",
            s.bg,
            s.border,
          );
          yield* on("click", () => add(type));
          yield* text(type.charAt(0).toUpperCase() + type.slice(1));
        });
      }

      yield* button(function* () {
        yield* classes("px-3", "py-1", "rounded", "text-sm", "bg-gray-200", "hover:bg-gray-300");
        yield* on("click", clearAll);
        yield* text("Clear All");
      });
    });

    // --- Filter ---
    yield* div(function* () {
      yield* classes("flex", "gap-2", "mb-4");

      for (const f of ["all", "info", "warning", "error"] as const) {
        yield* button(function* () {
          yield* classes(
            "px-3",
            "py-1",
            "rounded-full",
            "text-xs",
            "font-medium",
            f === filter ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700",
          );
          yield* on("click", () => {
            filter = f;
            updateList();
          });
          yield* text(f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1));
        });
      }

      yield* span(function* () {
        yield* classes("ml-auto", "text-sm", "text-gray-500", "self-center");
        countRef.bind(yield* span(() => [text(`${notifications.length} notifications`)]));
      });
    });

    // --- Notification List ---
    listRef.bind(
      yield* div(function* () {
        yield* classes("space-y-2");
      }),
    );
  });

/**
 * 個別の通知アイテム
 */
function NotificationItem(n: Notification, onDismiss: () => void) {
  const s = TYPE_STYLES[n.type];

  return div(function* () {
    yield* classes(
      "flex",
      "items-start",
      "gap-3",
      "p-3",
      "rounded-lg",
      "border-l-4",
      s.bg,
      s.border,
    );

    // Icon
    yield* span(() => [
      classes(
        "flex-shrink-0",
        "w-6",
        "h-6",
        "rounded-full",
        "flex",
        "items-center",
        "justify-center",
        "text-xs",
        "font-bold",
        "text-white",
        n.type === "info" ? "bg-blue-500" : n.type === "warning" ? "bg-yellow-500" : "bg-red-500",
      ),
      text(s.icon),
    ]);

    // Content
    yield* div(function* () {
      yield* classes("flex-1", "min-w-0");
      yield* span(() => [classes("text-sm", "font-medium"), text(n.message)]);
      yield* span(() => [
        classes("block", "text-xs", "text-gray-400", "mt-1"),
        text(formatTime(n.timestamp)),
      ]);
    });

    // Dismiss button
    yield* button(function* () {
      yield* classes(
        "flex-shrink-0",
        "text-gray-400",
        "hover:text-gray-600",
        "text-lg",
        "leading-none",
        "px-1",
      );
      yield* on("click", onDismiss);
      yield* text("\u00d7");
    });
  });
}
