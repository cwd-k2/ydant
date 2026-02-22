# @ydant/transition

CSS transition components for Ydant.

## Installation

```bash
pnpm add @ydant/transition
```

## Usage

### Transition

Transition provides enter/leave animation with programmatic show/hide control:

```typescript
import { type Component } from "@ydant/core";
import { div, button, text } from "@ydant/base";
import { Transition, type TransitionHandle } from "@ydant/transition";

const App: Component = () => {
  let fade: TransitionHandle;

  return div(function* () {
    yield* button(
      {
        onClick: async () => {
          const isVisible = fade.slot.node.firstElementChild !== null;
          await fade.setShow(!isVisible);
        },
      },
      "Toggle",
    );

    fade = yield* Transition({
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

Use `show: true` to render content immediately (with enter animation):

```typescript
fade =
  yield *
  Transition({
    show: true,
    enter: "transition-opacity duration-300",
    enterFrom: "opacity-0",
    enterTo: "opacity-100",
    content: () => div(() => [text("Visible on mount")]),
  });
```

### CSS Classes

`Transition` uses explicit class props:

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
function* Transition(props: TransitionProps): TransitionInstruction;

interface TransitionProps {
  show?: boolean; // defaults to false
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  content: () => Render;
}

type TransitionInstruction = Generator<Element, TransitionHandle, Slot>;

interface TransitionHandle {
  slot: Slot<HTMLElement>;
  setShow(show: boolean): Promise<void>;
}
```

Transition with enter/leave animation support. Returns a `TransitionHandle` for programmatic show/hide control.

### TransitionGroup

```typescript
function* TransitionGroup<T>(props: TransitionGroupProps<T>): Spell<"element">;

interface TransitionGroupProps<T> {
  items: T[];
  keyFn: (item: T) => string | number;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  content: (item: T, index: number) => Spell<"element">;
}
```

### createTransitionGroupRefresher

```typescript
function createTransitionGroupRefresher<T>(
  props: Omit<TransitionGroupProps<T>, "items">,
): (slot: Slot, items: T[]) => void;
```

Creates a stateful refresher that applies enter/leave transitions when updating items.

## Module Structure

- `Transition.ts` - Transition component
- `TransitionGroup.ts` - TransitionGroup, createTransitionGroupRefresher
- `utils.ts` - CSS class helpers (addClasses, removeClasses, waitForTransition)
