import { describe, it, expect, beforeEach, vi } from 'vitest';
import { persist, save, remove, createStorage } from '../persist';

// Create localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

// Set up localStorage mock before all tests
let mockStorage: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  mockStorage = createLocalStorageMock();
  vi.stubGlobal('localStorage', mockStorage);
});

describe('persist', () => {
  it('returns value from localStorage', () => {
    mockStorage.setItem('test-key', JSON.stringify('stored value'));

    const result = persist('test-key', 'default');
    expect(result).toBe('stored value');
  });

  it('returns default value when key does not exist', () => {
    const result = persist('nonexistent', 'default');
    expect(result).toBe('default');
  });

  it('returns default value on JSON parse error', () => {
    mockStorage.setItem('invalid', 'not valid json');

    const result = persist('invalid', 'default');
    expect(result).toBe('default');
  });

  it('handles complex objects', () => {
    const data = { users: [{ id: 1, name: 'Alice' }], count: 10 };
    mockStorage.setItem('complex', JSON.stringify(data));

    const result = persist<typeof data>('complex', { users: [], count: 0 });
    expect(result).toEqual(data);
  });
});

describe('save', () => {
  it('saves value to localStorage', () => {
    save('key', 'value');

    expect(mockStorage.setItem).toHaveBeenCalledWith('key', '"value"');
  });

  it('serializes objects to JSON', () => {
    save('obj', { name: 'test', value: 42 });

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'obj',
      '{"name":"test","value":42}',
    );
  });

  it('overwrites existing value', () => {
    save('key', 'first');
    save('key', 'second');

    const stored = mockStorage.getItem('key');
    expect(JSON.parse(stored!)).toBe('second');
  });
});

describe('remove', () => {
  it('removes key from localStorage', () => {
    mockStorage.setItem('key', '"value"');

    remove('key');

    expect(mockStorage.removeItem).toHaveBeenCalledWith('key');
  });

  it('does not throw for nonexistent key', () => {
    expect(() => remove('nonexistent')).not.toThrow();
  });
});

describe('persist without localStorage', () => {
  it('returns default value when localStorage is not available', () => {
    vi.stubGlobal('localStorage', undefined);

    const result = persist('key', 'default');
    expect(result).toBe('default');
  });

  it('save does nothing when localStorage is not available', () => {
    vi.stubGlobal('localStorage', undefined);

    // Should not throw
    expect(() => save('key', 'value')).not.toThrow();
  });

  it('remove does nothing when localStorage is not available', () => {
    vi.stubGlobal('localStorage', undefined);

    // Should not throw
    expect(() => remove('key')).not.toThrow();
  });
});

describe('createStorage', () => {
  it('get() returns value from localStorage', () => {
    mockStorage.setItem('storage-key', JSON.stringify('stored'));

    const storage = createStorage('storage-key', 'default');
    expect(storage.get()).toBe('stored');
  });

  it('get() returns default value when key does not exist', () => {
    const storage = createStorage('missing', 'default');
    expect(storage.get()).toBe('default');
  });

  it('set() saves value to localStorage', () => {
    const storage = createStorage<string>('storage-key', 'default');

    storage.set('new value');

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'storage-key',
      '"new value"',
    );
  });

  it('clear() removes key from localStorage', () => {
    mockStorage.setItem('storage-key', JSON.stringify('value'));

    const storage = createStorage('storage-key', 'default');
    storage.clear();

    expect(mockStorage.removeItem).toHaveBeenCalledWith('storage-key');
  });

  it('works with complex types', () => {
    interface Todo {
      id: number;
      text: string;
      done: boolean;
    }

    const storage = createStorage<Todo[]>('todos', []);

    const todos: Todo[] = [
      { id: 1, text: 'First', done: false },
      { id: 2, text: 'Second', done: true },
    ];

    storage.set(todos);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'todos',
      JSON.stringify(todos),
    );

    expect(storage.get()).toEqual(todos);
  });
});
