# @ydant/transition

CSS transition components for Ydant.

## Installation

```bash
pnpm add @ydant/transition
```

## Usage

### Transition (Enter-only)

For simple show/hide with enter animation:

```typescript
import { type Component } from "@ydant/core";
import { div, button, text, on, type Slot } from "@ydant/base";
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
            enter: "transition-opacity duration-300",
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            content: () => div(() => [text("Fade me!")]),
          }),
        );
      }),
      text("Toggle"),
    ]);

    transitionSlot = yield* div(() =>
      Transition({
        show,
        enter: "transition-opacity duration-300",
        enterFrom: "opacity-0",
        enterTo: "opacity-100",
        content: () => div(() => [text("Fade me!")]),
      }),
    );
  });
};
```

### createTransition (Enter + Leave)

For full enter/leave animation support with programmatic control:

```typescript
import { type Component } from "@ydant/core";
import { div, button, text, on } from "@ydant/base";
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
      content: () => div(() => [text("Animated content")]),
    });
  });
};
```

### CSS Classes

Both `Transition` and `createTransition` use explicit class props:

| Prop        | When Applied               |
| ----------- | -------------------------- |
| `enter`     | During enter animation     |
| `enterFrom` | Initial state before enter |
| `enterTo`   | Final state after enter    |
| `leave`     | During leave animation     |
| `leaveFrom` | Initial state before leave |
| `leaveTo`   | Final state after leave    |

All props are optional. Classes are applied as space-separated strings (e.g. Tailwind CSS compatible).

### Example CSS

```css
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
import { type Component } from "@ydant/core";
import { div, text } from "@ydant/base";
import { TransitionGroup, createTransitionGroupRefresher } from "@ydant/transition";

const App: Component = () => {
  const items = [
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
  ];

  return div(function* () {
    const slot = yield* TransitionGroup({
      items,
      keyFn: (item) => item.id,
      enter: "transition-opacity duration-300",
      enterFrom: "opacity-0",
      enterTo: "opacity-100",
      leave: "transition-opacity duration-300",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
      content: (item) => div(() => [text(item.text)]),
    });

    // To update with transitions, use createTransitionGroupRefresher
  });
};
```

#### Updating with createTransitionGroupRefresher

`createTransitionGroupRefresher` creates a stateful refresh function that applies enter/leave transitions on list updates:

```typescript
const refresher = createTransitionGroupRefresher({
  keyFn: (item) => item.id,
  enter: "transition-opacity duration-300",
  enterFrom: "opacity-0",
  enterTo: "opacity-100",
  leave: "transition-opacity duration-300",
  leaveFrom: "opacity-100",
  leaveTo: "opacity-0",
  content: (item) => div(() => [text(item.text)]),
});

// Later, update items with transitions:
refresher(slot, newItems);
```

## API

### Transition

```typescript
function Transition(props: TransitionProps): Render;

interface TransitionProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  content: () => Render;
}
```

Enter-only transition component. For leave animations, use `createTransition`.

### createTransition

```typescript
function* createTransition(
  props: Omit<TransitionProps, "show">,
): TransitionInstruction;

type TransitionInstruction = Generator<Element, TransitionHandle, Slot>;

interface TransitionHandle {
  slot: Slot;
  setShow(show: boolean): Promise<void>;
}
```

Creates a transition with programmatic show/hide control including leave animations.

### TransitionGroup

```typescript
function* TransitionGroup<T>(props: TransitionGroupProps<T>): ElementRender;

interface TransitionGroupProps<T> {
  items: T[];
  keyFn: (item: T) => string | number;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  content: (item: T, index: number) => ElementRender;
}
```

### createTransitionGroupRefresher

```typescript
function createTransitionGroupRefresher<T>(
  props: Omit<TransitionGroupProps<T>, "items">,
): (slot: Slot, items: T[]) => void;
```

Creates a stateful refresher that applies enter/leave transitions when updating items.

### Low-level APIs

```typescript
function enterTransition(el: HTMLElement, props: TransitionProps): Promise<void>;
function leaveTransition(el: HTMLElement, props: TransitionProps): Promise<void>;
```

## Module Structure

- `Transition.ts` - Transition, createTransition, enterTransition, leaveTransition
- `TransitionGroup.ts` - TransitionGroup, createTransitionGroupRefresher
- `utils.ts` - CSS class helpers (addClasses, removeClasses, waitForTransition)
