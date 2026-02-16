/**
 * @ydant/core - Built-in schedulers
 *
 * A Scheduler decides *when* to flush an Engine's task queue.
 * The flush function itself is always synchronous — the scheduler
 * only controls the timing of the invocation.
 */

import type { Scheduler } from "./plugin";

/** Flushes immediately and synchronously. Useful for testing and SSR. */
export const sync: Scheduler = (flush) => flush();

/** Flushes on the next microtask. Default for DOM rendering. */
export const microtask: Scheduler = (flush) => queueMicrotask(flush);

/** Flushes on the next animation frame. Suitable for Canvas rendering. */
export const animFrame: Scheduler = (flush) => requestAnimationFrame(flush);
