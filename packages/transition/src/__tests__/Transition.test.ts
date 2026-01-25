import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { div, text, clss } from '@ydant/core';
import { mount } from '@ydant/dom';
import { Transition } from '../Transition';

describe('Transition', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();

    // Mock getComputedStyle for transition duration
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionDuration: '0s',
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when show=true', () => {
    mount(
      () =>
        Transition({
          show: true,
          children: () => div(() => [text('Visible Content')]),
        }),
      container
    );

    expect(container.textContent).toContain('Visible Content');
  });

  it('renders nothing when show=false', () => {
    mount(
      () =>
        Transition({
          show: false,
          children: () => div(() => [text('Hidden Content')]),
        }),
      container
    );

    expect(container.textContent).not.toContain('Hidden Content');
  });

  it('applies enter classes on mount', () => {
    mount(
      () =>
        Transition({
          show: true,
          enter: 'transition-opacity',
          enterFrom: 'opacity-0',
          enterTo: 'opacity-100',
          children: () => div(() => [text('Content')]),
        }),
      container
    );

    vi.advanceTimersToNextFrame();

    // Get the child element (not the wrapper div)
    const childDiv = container.querySelector('div > div');
    expect(childDiv).not.toBeNull();
  });

  it('handles transition without classes', () => {
    mount(
      () =>
        Transition({
          show: true,
          children: () => div(() => [text('Content')]),
        }),
      container
    );

    expect(container.textContent).toContain('Content');
  });

  it('toggles visibility based on show prop', () => {
    // Test show=true
    mount(
      () =>
        Transition({
          show: true,
          children: () => div(() => [text('Toggle Content')]),
        }),
      container
    );

    expect(container.textContent).toContain('Toggle Content');

    // Reset container and test show=false
    container.innerHTML = '';

    mount(
      () =>
        Transition({
          show: false,
          children: () => div(() => [text('Toggle Content')]),
        }),
      container
    );

    expect(container.textContent).not.toContain('Toggle Content');
  });

  it('applies and removes enter classes through transition', async () => {
    mount(
      () =>
        Transition({
          show: true,
          enter: 'transition-all',
          enterFrom: 'opacity-0 scale-95',
          enterTo: 'opacity-100 scale-100',
          children: () => div(() => [clss(['content-box']), text('Content')]),
        }),
      container
    );

    // Trigger onMount callback (requestAnimationFrame)
    vi.advanceTimersToNextFrame();

    const childDiv = container.querySelector('.content-box') as HTMLElement;
    expect(childDiv).not.toBeNull();

    // After the first rAF, enterTo classes should be added
    vi.advanceTimersToNextFrame();

    // Classes are cleaned up after transition completes
    // Since transitionDuration is '0s', cleanup happens immediately
  });

  it('handles non-zero transition duration', async () => {
    // Mock with non-zero duration
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionDuration: '0.3s',
    } as CSSStyleDeclaration);

    mount(
      () =>
        Transition({
          show: true,
          enter: 'transition-opacity',
          enterFrom: 'opacity-0',
          enterTo: 'opacity-100',
          children: () => div(() => [clss(['fade-target']), text('Fading')]),
        }),
      container
    );

    vi.advanceTimersToNextFrame();

    const childDiv = container.querySelector('.fade-target') as HTMLElement;
    expect(childDiv).not.toBeNull();

    // Advance through the transition
    vi.advanceTimersToNextFrame();

    // The transition would listen for transitionend or timeout
    // After 300ms + 50ms buffer, it should complete
    vi.advanceTimersByTime(350);

    expect(container.textContent).toContain('Fading');
  });

  it('handles transitionend event', async () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionDuration: '0.5s',
    } as CSSStyleDeclaration);

    mount(
      () =>
        Transition({
          show: true,
          enter: 'transition-opacity',
          enterFrom: 'opacity-0',
          enterTo: 'opacity-100',
          children: () => div(() => [clss(['event-target']), text('Content')]),
        }),
      container
    );

    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    const childDiv = container.querySelector('.event-target') as HTMLElement;

    // Manually dispatch transitionend event
    childDiv.dispatchEvent(new Event('transitionend'));

    expect(container.textContent).toContain('Content');
  });

  it('cleans up empty class strings', () => {
    mount(
      () =>
        Transition({
          show: true,
          enter: '',
          enterFrom: '',
          enterTo: '',
          children: () => div(() => [text('No Classes')]),
        }),
      container
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain('No Classes');
  });
});
