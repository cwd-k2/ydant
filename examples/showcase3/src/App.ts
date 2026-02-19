import type { Component } from "@ydant/core";
import {
  text,
  div,
  h1,
  h2,
  p,
  span,
  button,
  classes,
  on,
  attr,
  circle,
  onUnmount,
  createSlotRef,
  svg,
} from "@ydant/base";
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

  // SlotRef references
  const modeRef = createSlotRef();
  const timerRef = createSlotRef();
  const progressRingRef = createSlotRef();
  const controlsRef = createSlotRef();
  const sessionsRef = createSlotRef();

  // Render functions
  const renderModeButtons = function* () {
    yield* classes("flex", "gap-2", "mb-8");

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

    yield* classes("transform", "-rotate-90");
    yield* attr("width", String(RING_RADIUS * 2));
    yield* attr("height", String(RING_RADIUS * 2));

    // 背景の円
    yield* circle(() => [
      attr("stroke", "#334155"),
      attr("fill", "transparent"),
      attr("stroke-width", String(RING_STROKE)),
      attr("r", String(RING_NORMALIZED_RADIUS)),
      attr("cx", String(RING_RADIUS)),
      attr("cy", String(RING_RADIUS)),
    ]);

    // プログレスの円
    yield* circle(() => [
      classes("progress-ring"),
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
    yield* classes("relative", "mb-8");

    yield* div(function* () {
      yield* classes("flex", "items-center", "justify-center");

      // SVG progress ring
      yield* div(function* () {
        yield* classes("absolute", "inset-0", "flex", "items-center", "justify-center");
        progressRingRef.bind(yield* svg.svg(renderProgressRing));
      });

      // Timer text overlay
      yield* div(function* () {
        yield* classes(
          "relative",
          "z-10",
          "w-60",
          "h-60",
          "flex",
          "flex-col",
          "items-center",
          "justify-center",
        );

        yield* span(function* () {
          yield* classes(
            "timer-display",
            MODE_COLORS[state.mode].text,
            ...(state.isRunning ? ["timer-running"] : []),
          );
          yield* text(formatTime(state.timeLeft));
        });

        yield* span(() => [
          classes("text-gray-400", "text-lg", "mt-2"),
          text(MODE_LABELS[state.mode]),
        ]);
      });
    });
  };

  const renderControls = function* () {
    yield* classes("flex", "gap-4", "mb-8");

    if (!state.isRunning) {
      // Start button
      yield* button(function* () {
        yield* classes(
          "btn-control",
          "px-8",
          "py-3",
          MODE_COLORS[state.mode].bg,
          "text-white",
          "rounded-full",
          "font-semibold",
          "text-lg",
          "shadow-lg",
        );
        yield* on("click", startTimer);
        yield* text("Start");
      });
    } else {
      // Pause button
      yield* button(function* () {
        yield* classes(
          "btn-control",
          "px-8",
          "py-3",
          "bg-yellow-500",
          "text-white",
          "rounded-full",
          "font-semibold",
          "text-lg",
          "shadow-lg",
        );
        yield* on("click", stopTimer);
        yield* text("Pause");
      });
    }

    // Reset button
    yield* button(function* () {
      yield* classes(
        "btn-control",
        "px-8",
        "py-3",
        "bg-slate-700",
        "text-gray-300",
        "rounded-full",
        "font-semibold",
        "text-lg",
        "hover:bg-slate-600",
      );
      yield* on("click", resetTimer);
      yield* text("Reset");
    });
  };

  const renderSessions = function* () {
    yield* classes(
      "flex",
      "flex-col",
      "items-center",
      "p-4",
      "bg-slate-800",
      "rounded-xl",
      "w-full",
    );

    yield* h2(() => [
      classes("text-sm", "font-medium", "text-gray-400", "mb-2"),
      text("Sessions Completed"),
    ]);

    yield* div(function* () {
      yield* classes("flex", "gap-2");

      // Show pomodoro icons for completed sessions (max 8)
      const displayCount = Math.min(state.sessionsCompleted, 8);
      for (let i = 0; i < displayCount; i++) {
        yield* span(() => [classes("text-2xl"), text("🍅")]);
      }

      if (state.sessionsCompleted === 0) {
        yield* span(() => [classes("text-gray-400"), text("No sessions yet")]);
      } else if (state.sessionsCompleted > 8) {
        yield* span(() => [
          classes("text-gray-400", "font-medium"),
          text(`+${state.sessionsCompleted - 8} more`),
        ]);
      }
    });
  };

  // Timer control functions
  const startTimer = () => {
    if (timerInterval) return;

    state.isRunning = true;
    timerRef.refresh(renderTimer);
    controlsRef.refresh(renderControls);

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
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleogNX3WkuKh4Rz1Xj6y0oXlGPVePrLSheUY9V4+stKF5Rj1Xj6y0oXlGPVePrLShd0RAV46stJ95REBYjqy0n3lEQFiOrLSfeURAWI6stJ95REBYjqy0n3lEQFiOrLSfeURAWI6stJ95REBYjqy0n3lEQFiOrLSfeUQ=",
          );
          audio.play().catch(() => {});
        } catch {
          // Ignore audio errors
        }

        sessionsRef.refresh(renderSessions);
      }

      timerRef.refresh(renderTimer);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    state.isRunning = false;
    controlsRef.refresh(renderControls);
  };

  const resetTimer = () => {
    stopTimer();
    state.timeLeft = DURATIONS[state.mode];
    timerRef.refresh(renderTimer);
  };

  const switchMode = (mode: TimerMode) => {
    stopTimer();
    state.mode = mode;
    state.timeLeft = DURATIONS[mode];
    modeRef.refresh(renderModeButtons);
    timerRef.refresh(renderTimer);
  };

  return div(function* () {
    yield* classes("flex", "flex-col", "items-center");

    // ライフサイクルフック: アンマウント時にタイマーをクリア
    yield* onUnmount(() => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    });

    // Title
    yield* h1(() => [
      classes("text-3xl", "font-bold", "text-gray-100", "mb-2"),
      text("Pomodoro Timer"),
    ]);

    yield* p(() => [
      classes("text-gray-400", "mb-8", "text-center"),
      text("Stay focused and productive!"),
    ]);

    // Mode selector
    modeRef.bind(yield* div(renderModeButtons));

    // Timer display with progress ring
    timerRef.bind(yield* div(renderTimer));

    // Control buttons
    controlsRef.bind(yield* div(renderControls));

    // Sessions completed
    sessionsRef.bind(yield* div(renderSessions));

    // Tips
    yield* div(() => [
      classes("mt-6", "text-center", "text-xs", "text-gray-400"),
      p(() => [text("25 min work → 5 min break → repeat")]),
      p(() => [text("Every 4 sessions, take a 15 min long break")]),
    ]);
  });
};
