import { describe, it, expect, vi } from 'vitest';
import { attr, clss, on, text, style, key, onMount, onUnmount } from '../primitives';
import type { Lifecycle } from '../types';

describe('attr', () => {
  it('yields an Attribute with correct type, key, and value', () => {
    const gen = attr('href', 'https://example.com');
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'attribute',
      key: 'href',
      value: 'https://example.com',
    });

    expect(gen.next().done).toBe(true);
  });
});

describe('clss', () => {
  it('yields an Attribute with class key and joined class names', () => {
    const gen = clss(['container', 'flex', 'items-center']);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'attribute',
      key: 'class',
      value: 'container flex items-center',
    });
  });

  it('handles empty array', () => {
    const gen = clss([]);
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'attribute',
      key: 'class',
      value: '',
    });
  });

  it('handles single class', () => {
    const gen = clss(['single']);
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'attribute',
      key: 'class',
      value: 'single',
    });
  });
});

describe('on', () => {
  it('yields a Listener with correct type, key, and handler', () => {
    const handler = vi.fn();
    const gen = on('click', handler);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'listener',
      key: 'click',
      value: handler,
    });
  });

  it('supports various event types', () => {
    const events = ['input', 'change', 'submit', 'keydown'];

    for (const event of events) {
      const handler = vi.fn();
      const gen = on(event, handler);
      const result = gen.next();

      expect(result.value).toEqual({
        type: 'listener',
        key: event,
        value: handler,
      });
    }
  });
});

describe('text', () => {
  it('yields a Text with correct content', () => {
    const gen = text('Hello, World!');
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'text',
      content: 'Hello, World!',
    });
  });

  it('handles empty string', () => {
    const gen = text('');
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'text',
      content: '',
    });
  });

  it('handles special characters', () => {
    const gen = text('<script>alert("xss")</script>');
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'text',
      content: '<script>alert("xss")</script>',
    });
  });
});

describe('style', () => {
  it('yields a Style with CSS properties', () => {
    const gen = style({
      padding: '16px',
      display: 'flex',
      gap: '8px',
    });
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'style',
      properties: {
        padding: '16px',
        display: 'flex',
        gap: '8px',
      },
    });
  });

  it('handles CSS custom properties (variables)', () => {
    const gen = style({
      '--primary-color': '#3b82f6',
      backgroundColor: 'var(--primary-color)',
    });
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'style',
      properties: {
        '--primary-color': '#3b82f6',
        backgroundColor: 'var(--primary-color)',
      },
    });
  });

  it('handles empty style object', () => {
    const gen = style({});
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'style',
      properties: {},
    });
  });
});

describe('key', () => {
  it('yields a Key with string value', () => {
    const gen = key('item-123');
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'key',
      value: 'item-123',
    });
  });

  it('yields a Key with number value', () => {
    const gen = key(42);
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'key',
      value: 42,
    });
  });

  it('handles zero as key', () => {
    const gen = key(0);
    const result = gen.next();

    expect(result.value).toEqual({
      type: 'key',
      value: 0,
    });
  });
});

describe('onMount', () => {
  it('yields a Lifecycle with mount event', () => {
    const callback = vi.fn();
    const gen = onMount(callback);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'lifecycle',
      event: 'mount',
      callback,
    });
  });

  it('supports callback that returns cleanup function', () => {
    const cleanup = vi.fn();
    const callback = () => cleanup;
    const gen = onMount(callback);
    const result = gen.next();

    const lifecycle = result.value as Lifecycle;
    expect(lifecycle.callback).toBe(callback);
  });
});

describe('onUnmount', () => {
  it('yields a Lifecycle with unmount event', () => {
    const callback = vi.fn();
    const gen = onUnmount(callback);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'lifecycle',
      event: 'unmount',
      callback,
    });
  });
});
