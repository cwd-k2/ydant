import { describe, it, expect, vi, beforeEach } from 'vitest';
import { div, p } from '@ydant/core';
import { text, onMount, onUnmount } from '@ydant/core';
import { mount } from '../index';

describe('lifecycle', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  describe('onMount', () => {
    it('executes mount callback after DOM is ready', async () => {
      const mountCallback = vi.fn();

      mount(
        () =>
          div(function* () {
            yield* onMount(mountCallback);
            yield* text('Content');
          }),
        container,
      );

      // Mount callback is scheduled via requestAnimationFrame
      expect(mountCallback).not.toHaveBeenCalled();

      // Advance to trigger rAF
      vi.advanceTimersToNextFrame();

      expect(mountCallback).toHaveBeenCalledTimes(1);
    });

    it('stores cleanup function from mount callback', async () => {
      const cleanup = vi.fn();
      let slot: { refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* p(function* () {
              yield* onMount(() => cleanup);
              yield* text('Content');
            });
          }),
        container,
      );

      vi.advanceTimersToNextFrame();
      expect(cleanup).not.toHaveBeenCalled();

      // Refresh triggers unmount of old content
      slot!.refresh(() => [text('New content')]);

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('onUnmount', () => {
    it('executes unmount callback on refresh', () => {
      const unmountCallback = vi.fn();
      let slot: { refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* p(function* () {
              yield* onUnmount(unmountCallback);
              yield* text('Content');
            });
          }),
        container,
      );

      expect(unmountCallback).not.toHaveBeenCalled();

      slot!.refresh(() => [text('New content')]);

      expect(unmountCallback).toHaveBeenCalledTimes(1);
    });

    it('executes multiple unmount callbacks', () => {
      const unmount1 = vi.fn();
      const unmount2 = vi.fn();
      let slot: { refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* p(function* () {
              yield* onUnmount(unmount1);
              yield* onUnmount(unmount2);
              yield* text('Content');
            });
          }),
        container,
      );

      slot!.refresh(() => [text('New')]);

      expect(unmount1).toHaveBeenCalledTimes(1);
      expect(unmount2).toHaveBeenCalledTimes(1);
    });
  });

  describe('mount callback with cleanup', () => {
    it('cleanup is called before re-mount on refresh', () => {
      const events: string[] = [];
      let slot: { refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* p(function* () {
              yield* onMount(() => {
                events.push('mount');
                return () => events.push('cleanup');
              });
              yield* text('Content');
            });
          }),
        container,
      );

      vi.advanceTimersToNextFrame();
      expect(events).toEqual(['mount']);

      slot!.refresh(function* () {
        yield* onMount(() => {
          events.push('remount');
          return () => events.push('recleanup');
        });
        yield* text('New');
      });

      // cleanup runs before refresh content is processed
      expect(events).toEqual(['mount', 'cleanup']);

      vi.advanceTimersToNextFrame();
      expect(events).toEqual(['mount', 'cleanup', 'remount']);
    });
  });
});
