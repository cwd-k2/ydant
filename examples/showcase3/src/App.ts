import type { Component } from "@ydant/core";
import {
  div,
  h1,
  h2,
  p,
  span,
  button,
  cn,
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

    // 背景の円
    yield* circle({
      stroke: "#334155",
      fill: "transparent",
      "stroke-width": String(RING_STROKE),
      r: String(RING_NORMALIZED_RADIUS),
      cx: String(RING_RADIUS),
      cy: String(RING_RADIUS),
    });

    // プログレスの円
    yield* circle({
      class: "progress-ring",
      stroke: ringColor,
      fill: "transparent",
      "stroke-width": String(RING_STROKE),
      "stroke-linecap": "round",
      "stroke-dasharray": `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`,
      "stroke-dashoffset": String(strokeDashoffset),
      r: String(RING_NORMALIZED_RADIUS),
      cx: String(RING_RADIUS),
      cy: String(RING_RADIUS),
    });
  };

  const renderTimer = function* () {
    yield* div({ class: "flex items-center justify-center" }, function* () {
      // SVG progress ring
      yield* div({ class: "absolute inset-0 flex items-center justify-center" }, function* () {
        progressRingRef.bind(
          yield* svg.svg(
            {
              class: "transform -rotate-90",
              width: String(RING_RADIUS * 2),
              height: String(RING_RADIUS * 2),
            },
            renderProgressRing,
          ),
        );
      });

      // Timer text overlay
      yield* div(
        { class: "relative z-10 w-60 h-60 flex flex-col items-center justify-center" },
        function* () {
          yield* span(
            {
              class: cn(
                "timer-display",
                MODE_COLORS[state.mode].text,
                state.isRunning && "timer-running",
              ),
            },
            formatTime(state.timeLeft),
          );

          yield* span({ class: "text-gray-400 text-lg mt-2" }, MODE_LABELS[state.mode]);
        },
      );
    });
  };

  const renderControls = function* () {
    if (!state.isRunning) {
      // Start button
      yield* button(
        {
          class: cn(
            "btn-control",
            "px-8",
            "py-3",
            MODE_COLORS[state.mode].bg,
            "text-white",
            "rounded-full",
            "font-semibold",
            "text-lg",
            "shadow-lg",
          ),
          onClick: startTimer,
        },
        "Start",
      );
    } else {
      // Pause button
      yield* button(
        {
          class:
            "btn-control px-8 py-3 bg-yellow-500 text-white rounded-full font-semibold text-lg shadow-lg",
          onClick: stopTimer,
        },
        "Pause",
      );
    }

    // Reset button
    yield* button(
      {
        class:
          "btn-control px-8 py-3 bg-slate-700 text-gray-300 rounded-full font-semibold text-lg hover:bg-slate-600",
        onClick: resetTimer,
      },
      "Reset",
    );
  };

  const renderSessions = function* () {
    yield* h2({ class: "text-sm font-medium text-gray-400 mb-2" }, "Sessions Completed");

    yield* div({ class: "flex gap-2" }, function* () {
      // Show pomodoro icons for completed sessions (max 8)
      const displayCount = Math.min(state.sessionsCompleted, 8);
      for (let i = 0; i < displayCount; i++) {
        yield* span({ class: "text-2xl" }, "🍅");
      }

      if (state.sessionsCompleted === 0) {
        yield* span({ class: "text-gray-400" }, "No sessions yet");
      } else if (state.sessionsCompleted > 8) {
        yield* span({ class: "text-gray-400 font-medium" }, `+${state.sessionsCompleted - 8} more`);
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

  return div({ class: "flex flex-col items-center" }, function* () {
    // ライフサイクルフック: アンマウント時にタイマーをクリア
    yield* onUnmount(() => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    });

    // Title
    yield* h1({ class: "text-3xl font-bold text-gray-100 mb-2" }, "Pomodoro Timer");

    yield* p({ class: "text-gray-400 mb-8 text-center" }, "Stay focused and productive!");

    // Mode selector
    modeRef.bind(yield* div({ class: "flex gap-2 mb-8" }, renderModeButtons));

    // Timer display with progress ring
    timerRef.bind(yield* div({ class: "relative mb-8" }, renderTimer));

    // Control buttons
    controlsRef.bind(yield* div({ class: "flex gap-4 mb-8" }, renderControls));

    // Sessions completed
    sessionsRef.bind(
      yield* div(
        { class: "flex flex-col items-center p-4 bg-slate-800 rounded-xl w-full" },
        renderSessions,
      ),
    );

    // Tips
    yield* div({ class: "mt-6 text-center text-xs text-gray-400" }, function* () {
      yield* p("25 min work → 5 min break → repeat");
      yield* p("Every 4 sessions, take a 15 min long break");
    });
  });
};
