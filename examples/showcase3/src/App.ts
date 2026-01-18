import {
  text,
  div,
  h1,
  h2,
  p,
  span,
  button,
  clss,
  on,
  attr,
  svg,
  circle,
  type Refresher,
  type Component,
} from "@ydant/core";
import type { TimerMode, TimerState } from "./types";
import { DURATIONS, MODE_LABELS, MODE_COLORS } from "./constants";
import { formatTime } from "./utils";
import { ModeButton } from "./components/ModeButton";

export const App: Component = () => {
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
    progressRing?: Refresher;
    controls?: Refresher;
    sessions?: Refresher;
  } = {};

  // Render functions
  const renderModeButtons = function* () {
    yield* clss(["flex", "gap-2", "mb-8"]);

    const modes: TimerMode[] = ["work", "break", "long-break"];
    for (const mode of modes) {
      yield* ModeButton({
        mode,
        isActive: state.mode === mode,
        onClick: () => switchMode(mode),
      });
    }
  };

  // SVG progress ring の定数
  const RING_RADIUS = 120;
  const RING_STROKE = 8;
  const RING_NORMALIZED_RADIUS = RING_RADIUS - RING_STROKE * 2;
  const RING_CIRCUMFERENCE = RING_NORMALIZED_RADIUS * 2 * Math.PI;

  const renderProgressRing = function* () {
    const totalTime = DURATIONS[state.mode];
    const progress = ((totalTime - state.timeLeft) / totalTime) * 100;
    const strokeDashoffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;
    const ringColor = MODE_COLORS[state.mode].ring;

    yield* clss(["transform", "-rotate-90"]);
    yield* attr("width", String(RING_RADIUS * 2));
    yield* attr("height", String(RING_RADIUS * 2));

    // 背景の円
    yield* circle(() => [
      attr("stroke", "#e5e7eb"),
      attr("fill", "transparent"),
      attr("stroke-width", String(RING_STROKE)),
      attr("r", String(RING_NORMALIZED_RADIUS)),
      attr("cx", String(RING_RADIUS)),
      attr("cy", String(RING_RADIUS)),
    ]);

    // プログレスの円
    yield* circle(() => [
      clss(["progress-ring"]),
      attr("stroke", ringColor),
      attr("fill", "transparent"),
      attr("stroke-width", String(RING_STROKE)),
      attr("stroke-linecap", "round"),
      attr("stroke-dasharray", `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`),
      attr("stroke-dashoffset", String(strokeDashoffset)),
      attr("r", String(RING_NORMALIZED_RADIUS)),
      attr("cx", String(RING_RADIUS)),
      attr("cy", String(RING_RADIUS)),
    ]);
  };

  const renderTimer = function* () {
    yield* clss(["relative", "mb-8"]);

    yield* div(function* () {
      yield* clss(["flex", "items-center", "justify-center"]);

      // SVG progress ring
      yield* div(function* () {
        yield* clss(["absolute", "inset-0", "flex", "items-center", "justify-center"]);
        refreshers.progressRing = yield* svg(renderProgressRing);
      });

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
};
