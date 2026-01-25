import { describe, it, expect } from 'vitest';
import {
  div, span, p, h1, h2, h3, button, input, ul, li, a,
  section, header, footer, nav, main, article, aside,
  form, label, textarea, select, option,
  table, thead, tbody, tr, th, td, img,
  svg, circle, ellipse, line, path, polygon, polyline,
  rect, g, defs, use, clipPath, mask,
  linearGradient, radialGradient, stop, svgText, tspan,
} from '../elements';
import { text, attr } from '../primitives';
import type { Element } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Helper to collect all items from an iterator */
function collectIterator<T>(iter: Iterator<T>): T[] {
  const items: T[] = [];
  let next = iter.next();
  while (!next.done) {
    items.push(next.value as T);
    next = iter.next();
  }
  return items;
}

describe('HTML element factories', () => {
  it('creates element with correct tag', () => {
    const gen = div(() => []);
    const result = gen.next();
    const element = result.value as Element;

    expect(result.done).toBe(false);
    expect(element).toMatchObject({
      type: 'element',
      tag: 'div',
    });
  });

  it('includes children from childrenFn', () => {
    const gen = div(() => [text('Hello')]);
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: 'text', content: 'Hello' });
  });

  it('handles generator function syntax', () => {
    const gen = div(function* () {
      yield* text('First');
      yield* text('Second');
    });
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(2);
    expect(children[0]).toEqual({ type: 'text', content: 'First' });
    expect(children[1]).toEqual({ type: 'text', content: 'Second' });
  });

  it('does not set ns property for HTML elements', () => {
    const gen = div(() => []);
    const result = gen.next();
    const element = result.value as Element;

    expect(element.ns).toBeUndefined();
  });

  it.each([
    ['div', div],
    ['span', span],
    ['p', p],
    ['h1', h1],
    ['h2', h2],
    ['h3', h3],
    ['button', button],
    ['input', input],
    ['ul', ul],
    ['li', li],
    ['a', a],
    ['section', section],
    ['header', header],
    ['footer', footer],
    ['nav', nav],
    ['main', main],
    ['article', article],
    ['aside', aside],
    ['form', form],
    ['label', label],
    ['textarea', textarea],
    ['select', select],
    ['option', option],
    ['table', table],
    ['thead', thead],
    ['tbody', tbody],
    ['tr', tr],
    ['th', th],
    ['td', td],
    ['img', img],
  ] as const)('creates %s element with correct tag', (tagName, factory) => {
    const gen = factory(() => []);
    const result = gen.next();
    const element = result.value as Element;

    expect(element).toMatchObject({
      type: 'element',
      tag: tagName,
    });
  });
});

describe('SVG element factories', () => {
  it('creates SVG element with namespace', () => {
    const gen = svg(() => []);
    const result = gen.next();
    const element = result.value as Element;

    expect(result.done).toBe(false);
    expect(element).toMatchObject({
      type: 'element',
      tag: 'svg',
      ns: SVG_NS,
    });
  });

  it('includes children from childrenFn', () => {
    const gen = svg(() => [
      circle(() => [
        attr('cx', '50'),
        attr('cy', '50'),
        attr('r', '40'),
      ]),
    ]);
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);

    const circleElement = children[0] as Element;
    expect(circleElement).toMatchObject({
      type: 'element',
      tag: 'circle',
      ns: SVG_NS,
    });
  });

  it.each([
    ['svg', svg],
    ['circle', circle],
    ['ellipse', ellipse],
    ['line', line],
    ['path', path],
    ['polygon', polygon],
    ['polyline', polyline],
    ['rect', rect],
    ['g', g],
    ['defs', defs],
    ['use', use],
    ['clipPath', clipPath],
    ['mask', mask],
    ['linearGradient', linearGradient],
    ['radialGradient', radialGradient],
    ['stop', stop],
    ['text', svgText],
    ['tspan', tspan],
  ] as const)('creates %s SVG element with namespace', (tagName, factory) => {
    const gen = factory(() => []);
    const result = gen.next();
    const element = result.value as Element;

    expect(element).toMatchObject({
      type: 'element',
      tag: tagName,
      ns: SVG_NS,
    });
  });
});

describe('nested elements', () => {
  it('creates nested structure correctly', () => {
    const gen = div(() => [
      h1(() => [text('Title')]),
      p(() => [text('Content')]),
    ]);
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(2);

    const h1Element = children[0] as Element;
    const pElement = children[1] as Element;

    expect(h1Element).toMatchObject({ type: 'element', tag: 'h1' });
    expect(pElement).toMatchObject({ type: 'element', tag: 'p' });
  });

  it('handles deeply nested elements', () => {
    const gen = div(() => [
      ul(() => [
        li(() => [
          a(() => [
            span(() => [text('Link text')]),
          ]),
        ]),
      ]),
    ]);
    const result = gen.next();
    const element = result.value as Element;

    const level1 = collectIterator(element.children);
    const ulElement = level1[0] as Element;
    expect(ulElement).toMatchObject({ type: 'element', tag: 'ul' });

    const level2 = collectIterator(ulElement.children);
    const liElement = level2[0] as Element;
    expect(liElement).toMatchObject({ type: 'element', tag: 'li' });

    const level3 = collectIterator(liElement.children);
    const aElement = level3[0] as Element;
    expect(aElement).toMatchObject({ type: 'element', tag: 'a' });

    const level4 = collectIterator(aElement.children);
    const spanElement = level4[0] as Element;
    expect(spanElement).toMatchObject({ type: 'element', tag: 'span' });
  });
});
