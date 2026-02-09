/**
 * Resource
 *
 * Manages asynchronous data fetching with built-in loading and error states.
 *
 * @example
 * ```typescript
 * const userResource = createResource(() => fetch("/api/user").then(r => r.json()));
 *
 * // Use inside a component
 * yield* Suspense({
 *   fallback: () => div(() => [text("Loading...")]),
 *   children: function* () {
 *     const user = userResource();  // Suspends until data is ready
 *     yield* h1(() => [text(`Hello, ${user.name}`)]);
 *   },
 * });
 * ```
 */

/** Internal state representation of a Resource. */
type ResourceState<T> =
  | { status: "pending"; promise: Promise<T> }
  | { status: "resolved"; data: T }
  | { status: "rejected"; error: Error };

/** A callable resource that provides access to asynchronously fetched data. */
export interface Resource<T> {
  /** Reads the data. Suspends (throws a Promise) while pending. */
  (): T;
  /** Returns the current value without subscribing. Throws if pending or errored. */
  peek(): T;
  /** Whether the resource is currently loading. */
  readonly loading: boolean;
  /** The error if the fetch failed, or null otherwise. */
  readonly error: Error | null;
  /** Triggers a new fetch, replacing the current state. */
  refetch(): Promise<void>;
  /** Disposes the resource and stops any automatic refetching. */
  dispose(): void;
}

/**
 * Creates an asynchronous resource that manages fetch state.
 *
 * @param fetcher - Async function that fetches the data.
 * @param options - Configuration options such as initial value and refetch interval.
 */
export function createResource<T>(
  fetcher: () => Promise<T>,
  options?: {
    /** Initial value to use before the first fetch completes. */
    initialValue?: T;
    /** Automatic refetch interval in milliseconds. */
    refetchInterval?: number;
  },
): Resource<T> {
  let state: ResourceState<T>;

  // Start in resolved state if an initial value is provided
  if (options?.initialValue !== undefined) {
    state = { status: "resolved", data: options.initialValue };
  } else {
    // Start fetching immediately
    const promise = fetcher();
    state = { status: "pending", promise };

    promise
      .then((data) => {
        state = { status: "resolved", data };
      })
      .catch((error) => {
        state = { status: "rejected", error };
      });
  }

  const resource = (() => {
    switch (state.status) {
      case "pending":
        // Suspense pattern: throw the pending Promise
        throw state.promise;
      case "rejected":
        throw state.error;
      case "resolved":
        return state.data;
    }
  }) as Resource<T>;

  Object.defineProperty(resource, "loading", {
    get: () => state.status === "pending",
  });

  Object.defineProperty(resource, "error", {
    get: () => (state.status === "rejected" ? state.error : null),
  });

  resource.peek = () => {
    switch (state.status) {
      case "pending":
        throw new Error("Resource is still loading");
      case "rejected":
        throw state.error;
      case "resolved":
        return state.data;
    }
  };

  resource.refetch = async () => {
    const promise = fetcher();
    state = { status: "pending", promise };

    try {
      const data = await promise;
      state = { status: "resolved", data };
    } catch (error) {
      state = { status: "rejected", error: error as Error };
    }
  };

  // Set up automatic refetching if configured
  let intervalId: ReturnType<typeof setInterval> | null = null;
  if (options?.refetchInterval) {
    intervalId = setInterval(() => {
      resource.refetch();
    }, options.refetchInterval);
  }

  resource.dispose = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return resource;
}
