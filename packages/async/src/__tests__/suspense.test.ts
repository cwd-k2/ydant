import { describe, it, expect, vi, beforeEach } from 'vitest';
import { div, text } from '@ydant/core';
import { mount } from '@ydant/dom';
import { Suspense } from '../suspense';

describe('Suspense', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  it('renders children when no promise is thrown', () => {
    mount(
      () =>
        Suspense({
          fallback: () => div(() => [text('Loading...')]),
          children: function* () {
            yield* div(() => [text('Content')]);
          },
        }),
      container
    );

    expect(container.textContent).toContain('Content');
    expect(container.textContent).not.toContain('Loading');
  });

  it('renders fallback when promise is thrown', () => {
    const pendingPromise = new Promise(() => {});

    mount(
      () =>
        Suspense({
          fallback: () => div(() => [text('Loading...')]),
          children: function* () {
            throw pendingPromise;
          },
        }),
      container
    );

    expect(container.textContent).toContain('Loading...');
    expect(container.textContent).not.toContain('Content');
  });

  it('renders children after promise resolves', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    let hasResolved = false;

    mount(
      () =>
        Suspense({
          fallback: () => div(() => [text('Loading...')]),
          children: function* () {
            if (!hasResolved) {
              throw promise;
            }
            yield* div(() => [text('Loaded Content')]);
          },
        }),
      container
    );

    expect(container.textContent).toContain('Loading...');

    // Resolve the promise
    hasResolved = true;
    resolvePromise!();
    await vi.runAllTimersAsync();

    // After promise resolves, children should re-render
    expect(container.textContent).toContain('Loaded Content');
  });

  it('re-throws non-promise errors', () => {
    const error = new Error('Component error');

    expect(() => {
      mount(
        () =>
          Suspense({
            fallback: () => div(() => [text('Loading...')]),
            children: function* () {
              throw error;
            },
          }),
        container
      );
    }).toThrow(error);
  });
});
