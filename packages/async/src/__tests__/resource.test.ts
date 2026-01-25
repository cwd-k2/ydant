import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createResource } from '../resource';

describe('createResource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in pending state', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    const resource = createResource(fetcher);

    expect(resource.loading).toBe(true);
    expect(resource.error).toBeNull();
  });

  it('throws promise when reading in pending state', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    const resource = createResource(fetcher);

    expect(() => resource()).toThrow();

    try {
      resource();
    } catch (e) {
      expect(e).toBeInstanceOf(Promise);
    }
  });

  it('transitions to resolved state on success', async () => {
    let resolvePromise: (value: string) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const resource = createResource(fetcher);

    expect(resource.loading).toBe(true);

    // Resolve the promise
    resolvePromise!('data');
    await vi.runAllTimersAsync();

    expect(resource.loading).toBe(false);
    expect(resource.error).toBeNull();
    expect(resource()).toBe('data');
  });

  it('transitions to rejected state on error', async () => {
    let rejectPromise: (error: Error) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<string>((_, reject) => {
          rejectPromise = reject;
        })
    );

    const resource = createResource(fetcher);

    expect(resource.loading).toBe(true);

    // Reject the promise
    const error = new Error('Fetch failed');
    rejectPromise!(error);
    await vi.runAllTimersAsync();

    expect(resource.loading).toBe(false);
    expect(resource.error).toBe(error);

    // Throws error when reading
    expect(() => resource()).toThrow(error);
  });

  it('refetch() re-fetches data', async () => {
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      return Promise.resolve(`data-${callCount}`);
    });

    const resource = createResource(fetcher);
    await vi.runAllTimersAsync();

    expect(resource()).toBe('data-1');

    // Refetch
    await resource.refetch();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(resource()).toBe('data-2');
  });

  it('refetch() handles errors', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('Second failed'));

    const resource = createResource(fetcher);
    await vi.runAllTimersAsync();

    expect(resource()).toBe('first');

    // Refetch with error
    await resource.refetch();

    expect(resource.loading).toBe(false);
    expect(resource.error).toBeInstanceOf(Error);
    expect(resource.error?.message).toBe('Second failed');
  });

  it('uses initialValue and skips fetching', () => {
    const fetcher = vi.fn(() => Promise.resolve('fetched'));
    const resource = createResource(fetcher, { initialValue: 'initial' });

    expect(fetcher).not.toHaveBeenCalled();
    expect(resource.loading).toBe(false);
    expect(resource.error).toBeNull();
    expect(resource()).toBe('initial');
  });

  it('handles complex data types', async () => {
    interface User {
      id: number;
      name: string;
    }

    const userData: User = { id: 1, name: 'Alice' };
    const fetcher = vi.fn(() => Promise.resolve(userData));

    const resource = createResource(fetcher);
    await vi.runAllTimersAsync();

    expect(resource()).toEqual(userData);
  });

  it('refetchInterval triggers periodic refetch', async () => {
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      return Promise.resolve(`data-${callCount}`);
    });

    createResource(fetcher, { refetchInterval: 1000 });

    // Wait for initial fetch
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Advance time by refetch interval
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
