# @ydant/core

## 0.3.0

### Breaking Changes

- **Backend/Plugin separation**: `RenderTarget` removed. Replaced by `Backend` (capabilities) + `Plugin` (processing) architecture
- **Capabilities system**: 5 capabilities (`tree`, `decorate`, `interact`, `schedule`, `resolve`) replace the monolithic target
- **scope() builder API**: `mount()` replaced by `scope(backend, plugins).mount(app)`
- **ExecutionScope**: New concept bundling backend + plugins. Now exported from public API

### New Features

- **Engine/Hub orchestration**: Independent engines with task queues, schedulers, inter-engine messaging
- **embed spell**: Switch execution scope within a render tree (`yield* embed(scope, content)`)
- **Schedulers**: Built-in `sync`, `microtask`, `animFrame` schedulers
- **ScopeBuilder**: Fluent API via `scope(backend, plugins)`
- **Compile-time capability checking**: `CapabilityCheck` type utility for `mount()`

### Improvements

- Subpath exports: `@ydant/core/internals` for plugin/backend authors
- Multi-entry ES+CJS build (UMD removed)
- Monotonic counter for embed engine IDs (replaces `Date.now()`)
- `ExecutionScope` exported from public API
- Built-in messages (`engine:pause`, `engine:resume`, `engine:error`) documented on `Engine.on()`
- Enhanced JSDoc for `Tagged`, `isTagged`, plugin authoring

## 0.2.0

### Breaking Changes

- **Type system redesign**: Consolidated from 7 types to 3 (Spell/Render/Builder)
  - `DSLSchema` → `SpellSchema`
  - `DSL<Key>` → `Spell<Key>`
  - `Instruction` → `Request`
  - `Feedback` → `Response`
  - `Child` → `Request` (merged)
  - `ProcessResult` → removed (use `Response` directly)
  - `children` parameter → `content`
- **RenderAPI removed**: Merged into `RenderContext` — use `ctx` directly instead of `api`
  - `extendAPI()` removed
  - `process()` second argument changed from `api` to `ctx`
- **Internal types hidden**: `ChildNext`, `ChildReturn`, `ChildOfType` no longer exported
- **Utility renamed**: `toChildren()` → `toRender()`

### Improvements

- Eliminated circular dependencies across core and base
- Reduced type/API complexity
- All JSDoc and inline comments rewritten to English
