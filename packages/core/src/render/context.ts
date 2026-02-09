/**
 * @ydant/core - RenderContext 管理
 */

import type { Builder, Instructor } from "../types";
import { toChildren } from "../utils";
import type { Plugin, RenderAPI } from "../plugin";
import type { RenderContext } from "./types";

/**
 * 登録されたプラグインをユニークに反復処理する
 * （同じプラグインが複数の type で登録されている場合、1回だけ呼び出す）
 */
function forEachUniquePlugin(
  plugins: Map<string, Plugin>,
  callback: (plugin: Plugin) => void,
): void {
  const visited = new Set<string>();
  for (const plugin of plugins.values()) {
    if (visited.has(plugin.name)) continue;
    visited.add(plugin.name);
    callback(plugin);
  }
}

/** RenderContext のコアフィールドのみで初期オブジェクトを作成（拡張プロパティは各プラグインの initContext で設定） */
function createRenderContextBase(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
): RenderContext {
  return {
    parent,
    currentElement,
    plugins,
  } as RenderContext;
}

/**
 * RenderContext を作成し、各プラグインで初期化
 *
 * @param parent - 親ノード
 * @param currentElement - 現在の要素
 * @param plugins - 登録されたプラグイン
 * @param parentCtx - 親コンテキスト（子コンテキスト作成時）
 */
export function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
  parentCtx?: RenderContext,
): RenderContext {
  const ctx = createRenderContextBase(parent, currentElement, plugins);

  // 各プラグインの initContext を呼び出し
  forEachUniquePlugin(plugins, (plugin) => {
    plugin.initContext?.(ctx, parentCtx);
  });

  return ctx;
}

/**
 * RenderContext から RenderAPI を作成
 *
 * processIterator を循環参照で受け取る必要があるため、
 * ファクトリ関数として実装
 *
 * NOTE: core は基本的な API のみを提供し、プラグイン固有のメソッドは
 * 各プラグインの extendAPI で追加される。
 */
export function createRenderAPIFactory(
  processIterator: (iter: Instructor, ctx: RenderContext) => void,
) {
  return function createRenderAPI(ctx: RenderContext): RenderAPI {
    // キャッシュがあればそのまま返す
    if (ctx._cachedAPI) {
      return ctx._cachedAPI;
    }

    const api: Record<string, unknown> = {
      // ========================================================================
      // コア機能（プラグインが拡張する基盤）
      // ========================================================================
      get parent() {
        return ctx.parent;
      },
      get currentElement() {
        return ctx.currentElement;
      },
      processChildren(
        builder: Builder,
        options?: { parent?: Node; inheritContext?: boolean },
      ): void {
        const targetParent = options?.parent ?? ctx.parent;

        const childCtx = createRenderContext(
          targetParent,
          targetParent instanceof globalThis.Element ? targetParent : null,
          ctx.plugins,
          ctx,
        );

        const children = toChildren(builder());
        processIterator(children, childCtx);

        // 各プラグインの mergeChildContext を呼び出し
        forEachUniquePlugin(ctx.plugins, (plugin) => {
          plugin.mergeChildContext?.(ctx, childCtx);
        });
      },
      createChildAPI(parent: Node): RenderAPI {
        const childCtx = createRenderContext(
          parent,
          parent instanceof globalThis.Element ? parent : null,
          ctx.plugins,
          ctx,
        );
        return createRenderAPI(childCtx);
      },
    };

    // 各プラグインの extendAPI を呼び出して API を拡張
    forEachUniquePlugin(ctx.plugins, (plugin) => {
      plugin.extendAPI?.(api as Partial<RenderAPI>, ctx);
    });

    const renderAPI = api as unknown as RenderAPI;
    ctx._cachedAPI = renderAPI;
    return renderAPI;
  };
}
