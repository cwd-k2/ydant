import { describe, it, expect, vi, beforeEach } from 'vitest';
import { div, p, span } from '@ydant/core';
import { text, attr, on, style, key, onMount, onUnmount } from '@ydant/core';
import { mount } from '../index';
import type { DomPlugin, PluginAPI } from '../plugin';

describe('processIterator', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('element type', () => {
    it('processes element and returns Slot', () => {
      let captured: { node: HTMLElement } | null = null;

      mount(
        () =>
          div(function* () {
            captured = yield* p(() => [text('Hello')]);
          }),
        container,
      );

      expect(captured).not.toBeNull();
      expect(captured!.node.tagName).toBe('P');
      expect(captured!.node.textContent).toBe('Hello');
    });
  });

  describe('attribute type', () => {
    it('applies attributes to current element', () => {
      mount(
        () =>
          div(function* () {
            yield* attr('id', 'my-id');
            yield* attr('data-test', 'value');
          }),
        container,
      );

      const element = container.children[0];
      expect(element.getAttribute('id')).toBe('my-id');
      expect(element.getAttribute('data-test')).toBe('value');
    });
  });

  describe('listener type', () => {
    it('attaches event listener to current element', () => {
      const handler = vi.fn();

      mount(
        () =>
          div(function* () {
            yield* on('click', handler);
          }),
        container,
      );

      (container.children[0] as HTMLElement).click();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('text type', () => {
    it('creates text node in parent', () => {
      mount(
        () =>
          div(() => [text('Hello'), text(' '), text('World')]),
        container,
      );

      expect(container.children[0].textContent).toBe('Hello World');
    });
  });

  describe('style type', () => {
    it('applies inline styles to current element', () => {
      mount(
        () =>
          div(function* () {
            yield* style({ color: 'red', padding: '16px' });
          }),
        container,
      );

      const element = container.children[0] as HTMLElement;
      expect(element.style.color).toBe('red');
      expect(element.style.padding).toBe('16px');
    });
  });

  describe('lifecycle type', () => {
    it('registers mount callback', () => {
      const mountFn = vi.fn();
      vi.useFakeTimers();

      mount(
        () =>
          div(function* () {
            yield* onMount(mountFn);
          }),
        container,
      );

      expect(mountFn).not.toHaveBeenCalled();
      vi.advanceTimersToNextFrame();
      expect(mountFn).toHaveBeenCalledTimes(1);
    });

    it('registers unmount callback', () => {
      const unmountFn = vi.fn();
      let slot: { refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* p(function* () {
              yield* onUnmount(unmountFn);
            });
          }),
        container,
      );

      expect(unmountFn).not.toHaveBeenCalled();
      slot!.refresh(() => []);
      expect(unmountFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('key type', () => {
    it('sets pending key for next element', () => {
      let slot1: { node: HTMLElement } | null = null;
      let slot2: { node: HTMLElement } | null = null;

      mount(
        () =>
          div(function* () {
            yield* key('item-1');
            slot1 = yield* p(() => [text('Item 1')]);
            yield* key('item-2');
            slot2 = yield* span(() => [text('Item 2')]);
          }),
        container,
      );

      expect(slot1!.node.tagName).toBe('P');
      expect(slot2!.node.tagName).toBe('SPAN');
    });
  });

  describe('plugin dispatch', () => {
    it('dispatches to plugin when type matches', () => {
      const processFn = vi.fn((_child, api: PluginAPI) => {
        const node = document.createTextNode('Plugin content');
        api.appendChild(node);
        return {};
      });

      const testPlugin: DomPlugin = {
        name: 'test-plugin',
        types: ['test-type'],
        process: processFn,
      };

      mount(
        () =>
          div(function* () {
            yield { type: 'test-type', data: 'hello' } as any;
          }),
        container,
        { plugins: [testPlugin] },
      );

      expect(processFn).toHaveBeenCalledTimes(1);
      expect(container.children[0].textContent).toBe('Plugin content');
    });

    it('skips unknown types', () => {
      mount(
        () =>
          div(function* () {
            yield { type: 'unknown-type' } as any;
            yield* text('After unknown');
          }),
        container,
      );

      expect(container.children[0].textContent).toBe('After unknown');
    });
  });
});
