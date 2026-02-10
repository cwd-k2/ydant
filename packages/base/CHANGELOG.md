# @ydant/base

## 0.2.0

### Breaking Changes

- **`classes()` signature simplified**: `(...args: (string | string[])[])` → `(...classNames: string[])`

### Bug Fixes

- Fixed keyed element reuse on `Slot.refresh()`

### Improvements

- Eliminated circular dependencies with core
- Reduced type/API complexity
- All JSDoc and inline comments rewritten to English
