export type TimerMode = "work" | "break" | "long-break";

export interface TimerState {
  mode: TimerMode;
  timeLeft: number; // seconds
  isRunning: boolean;
  sessionsCompleted: number;
}
