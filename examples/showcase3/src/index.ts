import { text, div, h1, h2, p, span, button, clss, on, compose, type Refresher } from "@ydant/composer";
import { mount } from "@ydant/renderer";

// ============================================================================
// Types
// ============================================================================

type TimerMode = "work" | "break" | "long-break";

interface TimerState {
  mode: TimerMode;
  timeLeft: number; // seconds
  isRunning: boolean;
  sessionsCompleted: number;
}

// ============================================================================
// Constants
// ============================================================================

const DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60, // 25 minutes
  break: 5 * 60, // 5 minutes
  "long-break": 15 * 60, // 15 minutes
};

const MODE_LABELS: Record<TimerMode, string> = {
  work: "Work",
  break: "Short Break",
  "long-break": "Long Break",
};

const MODE_COLORS: Record<TimerMode, { bg: string; text: string; ring: string }> = {
  work: {
    bg: "bg-red-500",
    text: "text-red-600",
    ring: "#dc2626",
  },
  break: {
    bg: "bg-green-500",
    text: "text-green-600",
    ring: "#059669",
  },
  "long-break": {
    bg: "bg-blue-500",
    text: "text-blue-600",
    ring: "#2563eb",
  },
};

// ============================================================================
// Helper functions
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function calculateProgress(timeLeft: number, totalTime: number): number {
  return ((totalTime - timeLeft) / totalTime) * 100;
}

// ============================================================================
// ModeButton Component
// ============================================================================

interface ModeButtonProps {
  mode: TimerMode;
  isActive: boolean;
  onClick: () => void;
}

const ModeButton = compose<ModeButtonProps>(function* (inject) {
  const mode = yield* inject("mode");
  const isActive = yield* inject("isActive");
  const onClick = yield* inject("onClick");

  const colors = MODE_COLORS[mode];

  return button(() => [
    clss([
      "px-4",
      "py-2",
      "rounded-full",
      "text-sm",
      "font-medium",
      "transition-all",
      ...(isActive
        ? [colors.bg, "text-white", "shadow-lg"]
        : ["bg-gray-100", "text-gray-600", "hover:bg-gray-200"]),
    ]),
    on("click", onClick),
    text(MODE_LABELS[mode]),
  ]);
});

// ============================================================================
// ProgressRing Component (SVG)
// ============================================================================

function createProgressRingSVG(progress: number, color: string): string {
  const radius = 120;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return `
    <svg height="${radius * 2}" width="${radius * 2}" class="transform -rotate-90">
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        stroke-width="${stroke}"
        r="${normalizedRadius}"
        cx="${radius}"
        cy="${radius}"
      />
      <circle
        class="progress-ring"
        stroke="${color}"
        fill="transparent"
        stroke-width="${stroke}"
        stroke-linecap="round"
        stroke-dasharray="${circumference} ${circumference}"
        stroke-dashoffset="${strokeDashoffset}"
        r="${normalizedRadius}"
        cx="${radius}"
        cy="${radius}"
      />
    </svg>
  `;
}

// ============================================================================
// Main App Component
// ============================================================================

const Main = compose<{}>(function* () {
  // State
  const state: TimerState = {
    mode: "work",
    timeLeft: DURATIONS.work,
    isRunning: false,
    sessionsCompleted: 0,
  };

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  // Refresher references
  const refreshers: {
    mode?: Refresher;
    timer?: Refresher;
    controls?: Refresher;
    sessions?: Refresher;
  } = {};

  // Render functions
  const renderModeButtons = function* () {
    yield* clss(["flex", "gap-2", "mb-8"]);

    const modes: TimerMode[] = ["work", "break", "long-break"];
    for (const mode of modes) {
      yield* ModeButton(function* (provide) {
        yield* provide("mode", mode);
        yield* provide("isActive", state.mode === mode);
        yield* provide("onClick", () => switchMode(mode));
      });
    }
  };

  const renderTimer = function* () {
    yield* clss(["relative", "mb-8"]);

    const progress = calculateProgress(state.timeLeft, DURATIONS[state.mode]);
    const ringColor = MODE_COLORS[state.mode].ring;

    yield* div(function* () {
      yield* clss(["flex", "items-center", "justify-center"]);

      // SVG container (will be updated via requestAnimationFrame)
      yield* div(() => [
        clss(["absolute", "inset-0", "flex", "items-center", "justify-center"]),
      ]);

      // Timer text overlay
      yield* div(function* () {
        yield* clss([
          "relative",
          "z-10",
          "w-60",
          "h-60",
          "flex",
          "flex-col",
          "items-center",
          "justify-center",
        ]);

        yield* span(function* () {
          yield* clss([
            "timer-display",
            MODE_COLORS[state.mode].text,
            ...(state.isRunning ? ["timer-running"] : []),
          ]);
          yield* text(formatTime(state.timeLeft));
        });

        yield* span(() => [
          clss(["text-gray-500", "text-lg", "mt-2"]),
          text(MODE_LABELS[state.mode]),
        ]);
      });
    });

    // Update SVG after render
    requestAnimationFrame(() => {
      const container = document.querySelector(".relative.mb-8 .absolute.inset-0");
      if (container) {
        container.innerHTML = createProgressRingSVG(progress, ringColor);
      }
    });
  };

  const renderControls = function* () {
    yield* clss(["flex", "gap-4", "mb-8"]);

    if (!state.isRunning) {
      // Start button
      yield* button(function* () {
        yield* clss([
          "btn-control",
          "px-8",
          "py-3",
          MODE_COLORS[state.mode].bg,
          "text-white",
          "rounded-full",
          "font-semibold",
          "text-lg",
          "shadow-lg",
        ]);
        yield* on("click", startTimer);
        yield* text("Start");
      });
    } else {
      // Pause button
      yield* button(function* () {
        yield* clss([
          "btn-control",
          "px-8",
          "py-3",
          "bg-yellow-500",
          "text-white",
          "rounded-full",
          "font-semibold",
          "text-lg",
          "shadow-lg",
        ]);
        yield* on("click", stopTimer);
        yield* text("Pause");
      });
    }

    // Reset button
    yield* button(function* () {
      yield* clss([
        "btn-control",
        "px-8",
        "py-3",
        "bg-gray-200",
        "text-gray-700",
        "rounded-full",
        "font-semibold",
        "text-lg",
        "hover:bg-gray-300",
      ]);
      yield* on("click", resetTimer);
      yield* text("Reset");
    });
  };

  const renderSessions = function* () {
    yield* clss([
      "flex",
      "flex-col",
      "items-center",
      "p-4",
      "bg-gray-50",
      "rounded-xl",
      "w-full",
    ]);

    yield* h2(() => [
      clss(["text-sm", "font-medium", "text-gray-500", "mb-2"]),
      text("Sessions Completed"),
    ]);

    yield* div(function* () {
      yield* clss(["flex", "gap-2"]);

      // Show pomodoro icons for completed sessions (max 8)
      const displayCount = Math.min(state.sessionsCompleted, 8);
      for (let i = 0; i < displayCount; i++) {
        yield* span(() => [
          clss(["text-2xl"]),
          text("🍅"),
        ]);
      }

      if (state.sessionsCompleted === 0) {
        yield* span(() => [
          clss(["text-gray-400"]),
          text("No sessions yet"),
        ]);
      } else if (state.sessionsCompleted > 8) {
        yield* span(() => [
          clss(["text-gray-600", "font-medium"]),
          text(`+${state.sessionsCompleted - 8} more`),
        ]);
      }
    });
  };

  // Timer control functions
  const startTimer = () => {
    if (timerInterval) return;

    state.isRunning = true;
    refreshers.timer?.(renderTimer);
    refreshers.controls?.(renderControls);

    timerInterval = setInterval(() => {
      state.timeLeft--;

      if (state.timeLeft <= 0) {
        // Timer completed
        stopTimer();

        if (state.mode === "work") {
          state.sessionsCompleted++;
          // Every 4 work sessions, take a long break
          if (state.sessionsCompleted % 4 === 0) {
            switchMode("long-break");
          } else {
            switchMode("break");
          }
        } else {
          switchMode("work");
        }

        // Play notification sound (if supported)
        try {
          const audio = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleogNX3WkuKh4Rz1Xj6y0oXlGPVePrLSheUY9V4+stKF5Rj1Xj6y0oXlGPVePrLShd0RAV46stJ95REBYjqy0n3lEQFiOrLSfeURAWI6stJ95REBYjqy0n3lEQFiOrLSfeURAWI6stJ95REBYjqy0n3lEQFiOrLSfeUQ="
          );
          audio.play().catch(() => {});
        } catch {
          // Ignore audio errors
        }

        refreshers.sessions?.(renderSessions);
      }

      refreshers.timer?.(renderTimer);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    state.isRunning = false;
    refreshers.controls?.(renderControls);
  };

  const resetTimer = () => {
    stopTimer();
    state.timeLeft = DURATIONS[state.mode];
    refreshers.timer?.(renderTimer);
  };

  const switchMode = (mode: TimerMode) => {
    stopTimer();
    state.mode = mode;
    state.timeLeft = DURATIONS[mode];
    refreshers.mode?.(renderModeButtons);
    refreshers.timer?.(renderTimer);
  };

  return div(function* () {
    yield* clss(["flex", "flex-col", "items-center"]);

    // Title
    yield* h1(() => [
      clss(["text-3xl", "font-bold", "text-gray-800", "mb-2"]),
      text("Pomodoro Timer"),
    ]);

    yield* p(() => [
      clss(["text-gray-500", "mb-8", "text-center"]),
      text("Stay focused and productive!"),
    ]);

    // Mode selector
    refreshers.mode = yield* div(renderModeButtons);

    // Timer display with progress ring
    refreshers.timer = yield* div(renderTimer);

    // Control buttons
    refreshers.controls = yield* div(renderControls);

    // Sessions completed
    refreshers.sessions = yield* div(renderSessions);

    // Tips
    yield* div(() => [
      clss(["mt-6", "text-center", "text-xs", "text-gray-400"]),
      p(() => [text("25 min work → 5 min break → repeat")]),
      p(() => [text("Every 4 sessions, take a 15 min long break")]),
    ]);
  });
});

// ============================================================================
// Mount App
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(Main, appRoot);
  }
});
