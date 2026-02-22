# @ydant/async

## 0.3.0

### New Features

- **Lazy component**: Deferred subtree evaluation with `visible` (IntersectionObserver) and `idle` (requestIdleCallback) triggers
- **chunked()**: Incremental list rendering spell + plugin
- **boundary spell**: Pluggable error/suspend handler registration
- **Async plugin**: `createAsyncPlugin()` for boundary processing

### Improvements

- `Lazy.content` accepts `Builder` (array syntax support)
- DOM-only assumption documented on Lazy
- Multi-entry ES+CJS build

## 0.2.0

### Improvements

- All JSDoc and inline comments rewritten to English
