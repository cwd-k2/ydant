import { describe, it, expect, vi, beforeEach } from 'vitest';
import { div, text } from '@ydant/core';
import { mount } from '@ydant/dom';
import { signal } from '../signal';
import { reactive } from '../reactive';
import { createReactivePlugin } from '../plugin';

describe('createReactivePlugin', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  it('creates a plugin with correct name and types', () => {
    const plugin = createReactivePlugin();

    expect(plugin.name).toBe('reactive');
    expect(plugin.types).toEqual(['reactive']);
  });

  it('renders reactive content', () => {
    const count = signal(0);

    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`Count: ${count()}`)]);
        }),
      container,
      { plugins: [createReactivePlugin()] }
    );

    expect(container.textContent).toContain('Count: 0');
  });

  it('updates when signal changes', () => {
    const count = signal(0);

    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`Count: ${count()}`)]);
        }),
      container,
      { plugins: [createReactivePlugin()] }
    );

    expect(container.textContent).toContain('Count: 0');

    // Update signal
    count.set(5);

    expect(container.textContent).toContain('Count: 5');
  });

  it('creates a span container with data-reactive attribute', () => {
    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text('Content')]);
        }),
      container,
      { plugins: [createReactivePlugin()] }
    );

    const reactiveSpan = container.querySelector('[data-reactive]');
    expect(reactiveSpan).not.toBeNull();
    expect(reactiveSpan?.tagName).toBe('SPAN');
  });

  it('clears and rebuilds content on signal change', () => {
    const items = signal([1, 2, 3]);

    mount(
      () =>
        div(function* () {
          yield* reactive(() =>
            items().map((n) => text(`Item ${n} `))
          );
        }),
      container,
      { plugins: [createReactivePlugin()] }
    );

    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('Item 2');
    expect(container.textContent).toContain('Item 3');

    // Update to different items
    items.set([4, 5]);

    expect(container.textContent).not.toContain('Item 1');
    expect(container.textContent).toContain('Item 4');
    expect(container.textContent).toContain('Item 5');
  });

  it('handles multiple reactive blocks', () => {
    const count1 = signal(0);
    const count2 = signal(100);

    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`A: ${count1()} `)]);
          yield* reactive(() => [text(`B: ${count2()}`)]);
        }),
      container,
      { plugins: [createReactivePlugin()] }
    );

    expect(container.textContent).toContain('A: 0');
    expect(container.textContent).toContain('B: 100');

    count1.set(1);
    expect(container.textContent).toContain('A: 1');
    expect(container.textContent).toContain('B: 100');

    count2.set(200);
    expect(container.textContent).toContain('A: 1');
    expect(container.textContent).toContain('B: 200');
  });
});
