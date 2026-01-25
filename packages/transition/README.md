# @ydant/transition

CSS transition components for Ydant.

## Installation

```bash
pnpm add @ydant/transition
```

## Usage

### Transition

```typescript
import { div, button, text, on, type Component } from "@ydant/core";
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
          })
        );
      }),
      text("Toggle"),
    ]);

    transitionSlot = yield* div(() =>
      Transition({
        show,
        name: "fade",
        children: () => div(() => [text("Fade me!")]),
      })
    );
  });
};
```

### CSS Classes

Transition applies these CSS classes during animations:

| Class | When Applied |
|-------|--------------|
| `{name}-enter` | Start of enter |
| `{name}-enter-active` | During enter |
| `{name}-enter-to` | End of enter |
| `{name}-leave` | Start of leave |
| `{name}-leave-active` | During leave |
| `{name}-leave-to` | End of leave |

### Example CSS

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
```

### TransitionGroup

For animating lists of items:

```typescript
import { TransitionGroup, createTransitionGroupRefresher } from "@ydant/transition";

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

### createTransitionGroupRefresher

```typescript
function createTransitionGroupRefresher<T>(
  slot: Slot,
  props: TransitionGroupProps<T>
): (newItems: T[]) => void;
```

Creates a refresh function for updating TransitionGroup items.

## Module Structure

- `Transition.ts` - Single element transitions
- `TransitionGroup.ts` - List transitions
