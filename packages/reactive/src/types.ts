/**
 * @ydant/reactive - Core type definitions
 */

/** A callback invoked when a reactive dependency changes. Used internally by Signal, Computed, and Effect. */
export type Subscriber = () => void;

/**
 * A readable reactive value — the common interface shared by {@link Signal} and {@link Computed}.
 *
 * Call it as a function to read the value (with dependency tracking),
 * or use `peek()` to read without subscribing.
 */
export interface Readable<T> {
  /** Reads the current value, registering the caller as a dependency. */
  (): T;
  /** Reads the current value without tracking dependencies. */
  peek(): T;
}
