# @ydant/base

## 0.3.0

### Breaking Changes

- **DOM Backend**: `createDOMBackend(root)` replaces previous target-based approach
- **Element factories**: Now accept Props overloads — `div(props, builder)`, `div(props, text)`, `div(text)`
- **html/svg namespaces**: Element factories re-exported as `html.*` and `svg.*`
- **slotRef removed**: Replaced by direct `Slot` usage from `yield*`

### New Features

- **Props syntax**: Element factories accept `ElementProps` as first argument
- **Convenience mount()**: `mount("#root", App, { plugins })` for 1-line DOM mounting
- **keyed()**: Factory wrapper for efficient element reuse with keys
- **DOMCapabilityNames**: Type-level DOM capability tracking

### Improvements

- Subpath exports: `@ydant/base/internals` for plugin authors
- Multi-entry ES+CJS build
- `KeyedNode` type documented for plugin authors

## 0.2.0

### Breaking Changes

- **`classes()` signature simplified**: `(...args: (string | string[])[])` → `(...classNames: string[])`

### Bug Fixes

- Fixed keyed element reuse on `Slot.refresh()`

### Improvements

- Eliminated circular dependencies with core
- Reduced type/API complexity
- All JSDoc and inline comments rewritten to English
