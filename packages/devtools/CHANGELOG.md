# @ydant/devtools

## 0.3.0

### New Package

Developer tools for Ydant — opt-in Engine lifecycle observation.

- `createDevtoolsPlugin()`: Monkey-patching based instrumentation
- `createDevtoolsOverlay()`: Visual overlay showing engine stats
- Engine flush hooks (`onBeforeFlush`/`onFlush`) for observation
- Active flag pattern for safe teardown
