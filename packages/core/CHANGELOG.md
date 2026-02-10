# @ydant/core

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
