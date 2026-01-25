import { describe, it, expect } from 'vitest';
import { reactive } from '../reactive';

describe('reactive', () => {
  it('yields a Reactive object', () => {
    const gen = reactive(() => []);
    const result = gen.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      type: 'reactive',
      childrenFn: expect.any(Function),
    });
  });

  it('stores the childrenFn', () => {
    const childrenFn = () => [];
    const gen = reactive(childrenFn);
    const result = gen.next();

    expect((result.value as { childrenFn: () => [] }).childrenFn).toBe(childrenFn);
  });

  it('completes after yielding', () => {
    const gen = reactive(() => []);
    gen.next(); // yield
    const result = gen.next();

    expect(result.done).toBe(true);
    expect(result.value).toBeUndefined();
  });
});
