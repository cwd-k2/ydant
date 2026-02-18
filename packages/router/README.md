# @ydant/router

SPA routing for Ydant using History API.

## Installation

```bash
pnpm add @ydant/router
```

## Usage

```typescript
import { scope, type Component } from "@ydant/core";
import { createDOMBackend, createBasePlugin, div, nav, text } from "@ydant/base";
import { RouterView, RouterLink, getRoute, navigate } from "@ydant/router";

import type { RouteComponentProps } from "@ydant/router";

// Define pages
const HomePage: Component = () => div(() => [text("Home Page")]);

const UserPage: Component<RouteComponentProps> = ({ params }) =>
  div(function* () {
    yield* text(`User ID: ${params.id}`);
  });

const NotFoundPage: Component = () => div(() => [text("404 - Not Found")]);

// Main app with routing
const App: Component = () =>
  div(function* () {
    // Navigation
    yield* nav(() => [
      RouterLink({ href: "/", children: () => text("Home") }),
      RouterLink({ href: "/users/1", children: () => text("User 1") }),
    ]);

    // Route definitions
    yield* RouterView({
      routes: [
        { path: "/", component: HomePage },
        { path: "/users/:id", component: UserPage },
        { path: "*", component: NotFoundPage },
      ],
    });
  });

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(App);
```

## API

### RouterView

```typescript
function RouterView(props: RouterViewProps): Render;

interface RouterViewProps {
  routes: RouteDefinition[];
  base?: string;
}

interface RouteComponentProps {
  params: Record<string, string>;
}

interface RouteDefinition {
  path: string;
  component: Component<RouteComponentProps>;
  guard?: () => boolean | Promise<boolean>;
}
```

Renders the component matching the current path. The matched route's component receives `{ params }` as props, containing the extracted path parameters.

**Note:** Components that don't use params can still be assigned to `component` without change — TypeScript allows `() => Render` to be assigned to `(props: RouteComponentProps) => Render` (parameter arity compatibility).

#### Route Guards

Route guards control access to routes. They can be synchronous or asynchronous:

```typescript
// Synchronous guard
{
  path: "/admin",
  component: AdminPage,
  guard: () => isAuthenticated(),
}

// Async guard (e.g., checking server-side permissions)
{
  path: "/settings",
  component: SettingsPage,
  guard: async () => {
    const response = await fetch("/api/permissions");
    const { canAccess } = await response.json();
    return canAccess;
  },
}
```

When a guard returns or resolves to `false`, the route is blocked and an empty view is rendered.

### RouterLink

```typescript
function RouterLink(props: RouterLinkProps): Render;

interface RouterLinkProps {
  href: string;
  children: () => Render;
  activeClass?: string;
}
```

Creates a navigation link that updates the URL without page reload.

### getRoute

```typescript
function getRoute(): RouteInfo;

interface RouteInfo {
  path: string;
  query: Record<string, string>;
  hash: string;
}
```

Returns current route information derived from `window.location`. Path parameters are not included here — they are passed as props to route components via `RouteComponentProps`.

### navigate

```typescript
function navigate(path: string, replace?: boolean): void;
```

Programmatically navigate to a path. If `replace` is true, replaces the current history entry.

### goBack / goForward

```typescript
function goBack(): void;
function goForward(): void;
```

Navigate through browser history.

## Path Patterns

- `/users` - Exact match
- `/users/:id` - Path parameter (passed as `params.id` in component props)
- `/users/*` - Wildcard (matches any suffix)
- `*` - Catch-all (404 page)

## Architecture

Route state is **not cached** — `getRoute()` derives from `window.location` on each call. Route change notifications use DOM custom events (`ydant:route-change`) instead of module-level listener sets, enabling natural cleanup via `removeEventListener`.

## Module Structure

- `types.ts` - Type definitions (RouteInfo, RouteDefinition, RouteComponentProps)
- `matching.ts` - Path matching utilities
- `state.ts` - Event constants
- `navigation.ts` - Navigation functions (getRoute, navigate, goBack, goForward)
- `RouterView.ts` - RouterView component
- `RouterLink.ts` - RouterLink component
