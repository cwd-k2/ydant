# @ydant/router

SPA routing for Ydant using History API.

## Installation

```bash
pnpm add @ydant/router
```

## Usage

```typescript
import { div, nav, text, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";
import { RouterView, RouterLink, useRoute, navigate } from "@ydant/router";

// Define pages
const HomePage: Component = () => div(() => [text("Home Page")]);

const UserPage: Component = () =>
  div(function* () {
    const route = useRoute();
    yield* text(`User ID: ${route.params.id}`);
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

mount(App, document.getElementById("app")!);
```

## API

### RouterView

```typescript
function RouterView(props: RouterViewProps): ElementGenerator;

interface RouterViewProps {
  routes: RouteDefinition[];
  base?: string;
}

interface RouteDefinition {
  path: string;
  component: Component;
  guard?: () => boolean | Promise<boolean>;
}
```

Renders the component matching the current path.

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
function RouterLink(props: RouterLinkProps): ElementGenerator;

interface RouterLinkProps {
  href: string;
  children: () => Render;
  activeClass?: string;
}
```

Creates a navigation link that updates the URL without page reload.

### useRoute

```typescript
function useRoute(): RouteInfo;

interface RouteInfo {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
}
```

Returns current route information including path parameters.

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
- `/users/:id` - Path parameter (captured as `params.id`)
- `/users/*` - Wildcard (matches any suffix)
- `*` - Catch-all (404 page)

## Module Structure

- `types.ts` - Type definitions
- `matching.ts` - Path matching utilities
- `state.ts` - Route state management
- `navigation.ts` - Navigation functions
- `components.ts` - RouterView, RouterLink
