/**
 * Resource
 *
 * 非同期データフェッチングを管理するリソース。
 *
 * @example
 * ```typescript
 * const userResource = createResource(() => fetch("/api/user").then(r => r.json()));
 *
 * // コンポーネント内で使用
 * yield* Suspense({
 *   fallback: () => div(() => [text("Loading...")]),
 *   children: function* () {
 *     const user = userResource();  // データが準備できるまで suspend
 *     yield* h1(() => [text(`Hello, ${user.name}`)]);
 *   },
 * });
 * ```
 */

/** Resource の状態 */
type ResourceState<T> =
  | { status: "pending"; promise: Promise<T> }
  | { status: "resolved"; data: T }
  | { status: "rejected"; error: Error };

/** Resource インターフェース */
export interface Resource<T> {
  /** データを読み取る（ペンディング中は suspend） */
  (): T;
  /** ローディング中かどうか */
  readonly loading: boolean;
  /** エラーがあれば Error、なければ null */
  readonly error: Error | null;
  /** 再フェッチ */
  refetch(): Promise<void>;
}

/**
 * 非同期リソースを作成
 *
 * @param fetcher - データをフェッチする非同期関数
 * @param options - オプション（初期値、再フェッチ間隔など）
 */
export function createResource<T>(
  fetcher: () => Promise<T>,
  options?: {
    /** 初期値 */
    initialValue?: T;
    /** 自動再フェッチ間隔（ミリ秒） */
    refetchInterval?: number;
  }
): Resource<T> {
  let state: ResourceState<T>;

  // 初期値がある場合は resolved 状態で開始
  if (options?.initialValue !== undefined) {
    state = { status: "resolved", data: options.initialValue };
  } else {
    // フェッチを開始
    const promise = fetcher();
    state = { status: "pending", promise };

    promise
      .then(data => {
        state = { status: "resolved", data };
      })
      .catch(error => {
        state = { status: "rejected", error };
      });
  }

  const resource = (() => {
    switch (state.status) {
      case "pending":
        // Suspense パターン: Promise を throw
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

  // 自動再フェッチの設定
  if (options?.refetchInterval) {
    setInterval(() => {
      resource.refetch();
    }, options.refetchInterval);
  }

  return resource;
}
