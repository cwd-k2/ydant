/// <reference path="./global.d.ts" />
/**
 * @ydant/async - Async plugin
 *
 * Processes `boundary` and `chunked` spell requests.
 *
 * - `boundary`: manages the handleRenderError chain on RenderContext,
 *   enabling ErrorBoundary and Suspense to catch errors from async
 *   render updates (e.g., reactive re-renders).
 * - `chunked`: renders a list in chunks, deferring later chunks to
 *   avoid blocking the main thread.
 *
 * @example
 * ```typescript
 * import { scope } from "@ydant/core";
 * import { createDOMBackend, createBasePlugin } from "@ydant/base";
 * import { createAsyncPlugin } from "@ydant/async";
 *
 * scope(createDOMBackend(document.getElementById("app")!), [
 *   createBasePlugin(),
 *   createAsyncPlugin(),
 * ]).mount(App);
 * ```
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { ChunkedRequest } from "./chunked";

/** Default scheduler: requestIdleCallback with setTimeout fallback. */
const defaultSchedule =
  typeof requestIdleCallback !== "undefined"
    ? (cb: () => void): (() => void) => {
        const id = requestIdleCallback(cb);
        return () => cancelIdleCallback(id);
      }
    : (cb: () => void): (() => void) => {
        const id = setTimeout(cb, 0);
        return () => clearTimeout(id);
      };

function processChunked(request: ChunkedRequest, ctx: RenderContext): void {
  const { items, chunkSize, each, schedule = defaultSchedule } = request;

  if (items.length === 0) return;

  // All items fit in a single chunk — render synchronously
  if (chunkSize >= items.length) {
    ctx.processChildren(function* () {
      for (let i = 0; i < items.length; i++) {
        yield* each(items[i], i);
      }
    });
    return;
  }

  let cancelled = false;
  const deferredCleanups: Array<() => void> = [];
  let cancelPending: (() => void) | undefined;

  // Register master cleanup (sync phase — captured by parent element)
  ctx.unmountCallbacks.push(() => {
    cancelled = true;
    cancelPending?.();
    for (const cb of deferredCleanups) cb();
  });

  // Render first chunk synchronously
  let offset = chunkSize;
  ctx.processChildren(function* () {
    for (let i = 0; i < chunkSize; i++) {
      yield* each(items[i], i);
    }
  });

  // Schedule remaining chunks
  const loadNext = () => {
    if (cancelled || offset >= items.length) return;

    const start = offset;
    const end = Math.min(start + chunkSize, items.length);
    offset = end;

    // Splice pattern: capture child unmount callbacks
    const beforeLen = ctx.unmountCallbacks.length;
    ctx.processChildren(function* () {
      for (let i = start; i < end; i++) {
        yield* each(items[i], i);
      }
    });
    const newCallbacks = ctx.unmountCallbacks.splice(beforeLen);
    deferredCleanups.push(...newCallbacks);

    // Continue if more items remain
    if (offset < items.length) {
      cancelPending = schedule(loadNext);
    }
  };

  cancelPending = schedule(loadNext);
}

/** Creates the async plugin. Depends on the base plugin. */
export function createAsyncPlugin(): Plugin {
  return {
    name: "async",
    types: ["boundary", "chunked"],
    dependencies: ["base"],

    initContext(ctx: RenderContext, parentCtx?: RenderContext) {
      // Inherit parent's error handler — enables nested boundaries
      ctx.handleRenderError = parentCtx?.handleRenderError;
    },

    process(request: Request, ctx: RenderContext): Response {
      if (isTagged(request, "boundary")) {
        const parentHandler = ctx.handleRenderError;
        // Chain: inner handler runs first, falls back to parent if not handled
        ctx.handleRenderError = (error: unknown): boolean => {
          try {
            if (request.handler(error)) return true;
          } catch {
            // Inner handler threw — fall through to parent
          }
          return parentHandler?.(error) ?? false;
        };
        return;
      }

      if (isTagged(request, "chunked")) {
        processChunked(request, ctx);
        return;
      }
    },
  };
}
