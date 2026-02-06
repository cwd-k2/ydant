# @ydant/transition

CSS transition components for Ydant.

## Installation

```bash
pnpm add @ydant/transition
```

## Usage

### Transition (Enter-only)

For simple show/hide with enter animation only:

```typescript
import { div, button, text, on, type Component, type Slot } from "@ydant/core";
import { Transition } from "@ydant/transition";

const App: Component = () => {
  let show = true;
  let transitionSlot: Slot;

  return div(function* () {
    yield* button(() => [
      on("click", () => {
        show = !show;
        transitionSlot.refresh(() =>
          Transition({
            show,
            name: "fade",
            children: () => div(() => [text("Fade me!")]),
          }),
        );
      }),
      text("Toggle"),
    ]);

    transitionSlot = yield* div(() =>
      Transition({
        show,
        name: "fade",
        children: () => div(() => [text("Fade me!")]),
      }),
    );
  });
};
```

### createTransition (Enter + Leave)

For full enter/leave animation support with programmatic control:

```typescript
import { div, button, text, on, classes, type Component } from "@ydant/core";
import { createTransition, type TransitionHandle } from "@ydant/transition";

const App: Component = () => {
  let fadeTransition: TransitionHandle;

  return div(function* () {
    yield* button(function* () {
      yield* on("click", async () => {
        const isVisible = fadeTransition.slot.node.firstElementChild !== null;
        await fadeTransition.setShow(!isVisible);
      });
      yield* text("Toggle");
    });

    fadeTransition = yield* createTransition({
      enter: "fade-enter",
      enterFrom: "fade-enter-from",
      enterTo: "fade-enter-to",
      leave: "fade-leave",
      leaveFrom: "fade-leave-from",
      leaveTo: "fade-leave-to",
      children: () => div(() => [text("Animated content")]),
    });
  });
};
```

### CSS Classes

#### For `Transition` (name-based)

| Class                 | When Applied   |
| --------------------- | -------------- |
| `{name}-enter`        | Start of enter |
| `{name}-enter-active` | During enter   |
| `{name}-enter-to`     | End of enter   |
| `{name}-leave`        | Start of leave |
| `{name}-leave-active` | During leave   |
| `{name}-leave-to`     | End of leave   |

#### For `createTransition` (explicit classes)

| Prop        | When Applied               |
| ----------- | -------------------------- |
| `enter`     | During enter animation     |
| `enterFrom` | Initial state before enter |
| `enterTo`   | Final state after enter    |
| `leave`     | During leave animation     |
| `leaveFrom` | Initial state before leave |
| `leaveTo`   | Final state after leave    |

### Example CSS

```css
/* For Transition (name="fade") */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* For createTransition */
.fade-enter {
  transition: opacity 300ms ease;
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}
.fade-leave {
  transition: opacity 300ms ease;
}
.fade-leave-from {
  opacity: 1;
}
.fade-leave-to {
  opacity: 0;
}
```

### TransitionGroup

For animating lists of items:

```typescript
import { TransitionGroup } from "@ydant/transition";

const App: Component = () => {
  const items = [{ id: 1, text: "Item 1" }];

  return div(function* () {
    const { slot, refresh } = yield* TransitionGroup({
      name: "list",
      items,
      keyFn: (item) => item.id,
      renderItem: (item) => div(() => [text(item.text)]),
    });

    // To update:
    // items.push({ id: 2, text: "Item 2" });
    // refresh(items);
  });
};
```

## API

### Transition

```typescript
function Transition(props: TransitionProps): ElementGenerator;

interface TransitionProps {
  show: boolean;
  name: string;
  children: () => Render;
  onEnter?: () => void;
  onLeave?: () => void;
  onAfterEnter?: () => void;
  onAfterLeave?: () => void;
}
```

### createTransition

```typescript
function* createTransition(
  props: CreateTransitionProps
): Generator<unknown, TransitionHandle, Slot>;

interface CreateTransitionProps {
  enter: string;
  enterFrom: string;
  enterTo: string;
  leave: string;
  leaveFrom: string;
  leaveTo: string;
  children: () => Render;
}

interface TransitionHandle {
  slot: Slot;
  setShow(show: boolean): Promise<void>;
}
```

### TransitionGroup

```typescript
function TransitionGroup<T>(props: TransitionGroupProps<T>): ElementGenerator;

interface TransitionGroupProps<T> {
  name: string;
  items: T[];
  keyFn: (item: T) => string | number;
  renderItem: (item: T) => Render;
}
```

### Low-level APIs

```typescript
function enterTransition(el: HTMLElement, props: EnterProps): Promise<void>;
function leaveTransition(el: HTMLElement, props: LeaveProps): Promise<void>;
```

## Module Structure

- `Transition.ts` - Single element transitions (Transition, createTransition)
- `TransitionGroup.ts` - List transitions
