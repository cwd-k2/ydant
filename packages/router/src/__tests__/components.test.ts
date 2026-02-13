import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, type Component } from "@ydant/core";
import { createBasePlugin, createDOMCapabilities, div, p, text } from "@ydant/base";
import type { RouteComponentProps } from "../types";
import { RouterLink } from "../RouterLink";
import { RouterView } from "../RouterView";
import { navigate } from "../navigation";

/**
 * Set window.location.pathname for testing.
 * jsdom does not allow direct assignment to window.location.pathname,
 * so we mock the whole location object.
 */
function setLocationPathname(pathname: string) {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      pathname,
      origin: "http://localhost",
      href: `http://localhost${pathname}`,
      search: "",
      hash: "",
    },
    writable: true,
    configurable: true,
  });
}

describe("RouterLink", () => {
  let container: HTMLElement;
  let savedLocation: Location;

  beforeEach(() => {
    savedLocation = window.location;
    setLocationPathname("/");
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  });

  afterEach(() => {
    container.remove();
    Object.defineProperty(window, "location", {
      value: savedLocation,
      writable: true,
      configurable: true,
    });
  });

  it("renders an anchor element", () => {
    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: "/about",
            children: () => text("About"),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/about");
    expect(link?.textContent).toBe("About");
  });

  it("calls navigate on click", () => {
    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: "/clicked",
            children: () => text("Click me"),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    const link = container.querySelector("a") as HTMLAnchorElement;
    link.click();

    expect(window.history.pushState).toHaveBeenCalledWith(null, "", "/clicked");
  });

  it("prevents default navigation", () => {
    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: "/test",
            children: () => text("Test"),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    const link = container.querySelector("a") as HTMLAnchorElement;
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(event);

    // The default was prevented (pushState called, not actual navigation)
    expect(window.history.pushState).toHaveBeenCalled();
  });

  it("applies activeClass when path matches", () => {
    setLocationPathname("/current");

    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: "/current",
            children: () => text("Current"),
            activeClass: "active",
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    const link = container.querySelector("a");
    expect(link?.getAttribute("class")).toBe("active");
  });

  it("does not apply activeClass when path does not match", () => {
    setLocationPathname("/other");

    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: "/different",
            children: () => text("Link"),
            activeClass: "active",
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    const link = container.querySelector("a");
    expect(link?.getAttribute("class")).toBeNull();
  });
});

describe("RouterView", () => {
  let container: HTMLElement;
  let savedLocation: Location;

  beforeEach(() => {
    savedLocation = window.location;
    setLocationPathname("/");
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      value: savedLocation,
      writable: true,
      configurable: true,
    });
  });

  it("renders matched route component", () => {
    const HomePage: Component = () => p(() => [text("Home Page")]);
    const AboutPage: Component = () => p(() => [text("About Page")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              { path: "/", component: HomePage },
              { path: "/about", component: AboutPage },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("Home Page");
  });

  it("renders correct route after navigate", () => {
    const HomePage: Component = () => p(() => [text("Home Page")]);
    const AboutPage: Component = () => p(() => [text("About Page")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              { path: "/", component: HomePage },
              { path: "/about", component: AboutPage },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    // Navigate to about (pushState is mocked, so manually set pathname)
    setLocationPathname("/about");
    navigate("/about");

    expect(container.textContent).toContain("About Page");
  });

  it("passes route parameters as props to component", () => {
    setLocationPathname("/users/42");

    let capturedParams: Record<string, string> = {};
    const UserPage: Component<RouteComponentProps> = ({ params }) => {
      capturedParams = params;
      return p(() => [text(`User: ${params.id}`)]);
    };

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: "/users/:id", component: UserPage }],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(capturedParams.id).toBe("42");
    expect(container.textContent).toContain("User: 42");
  });

  it("renders nothing when no route matches", () => {
    setLocationPathname("/nonexistent");

    const HomePage: Component = () => p(() => [text("Home")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: "/", component: HomePage }],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    // Only the wrapper divs, no home page content
    expect(container.textContent).not.toContain("Home");
  });

  it("matches wildcard route", () => {
    setLocationPathname("/any/path/here");

    const NotFound: Component = () => p(() => [text("404 Not Found")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: "*", component: NotFound }],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("404 Not Found");
  });

  it("handles base path correctly", () => {
    setLocationPathname("/app/users");

    const UsersPage: Component = () => p(() => [text("Users List")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: "/users", component: UsersPage }],
            base: "/app",
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("Users List");
  });

  it("handles base path with root route", () => {
    setLocationPathname("/app");

    const HomePage: Component = () => p(() => [text("App Home")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: "/", component: HomePage }],
            base: "/app",
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("App Home");
  });

  it("route guard allows access when returning true", () => {
    setLocationPathname("/protected");

    const ProtectedPage: Component = () => p(() => [text("Protected Content")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: "/protected",
                component: ProtectedPage,
                guard: () => true,
              },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("Protected Content");
  });

  it("route guard blocks access when returning false", () => {
    setLocationPathname("/protected");

    const ProtectedPage: Component = () => p(() => [text("Protected Content")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: "/protected",
                component: ProtectedPage,
                guard: () => false,
              },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).not.toContain("Protected Content");
  });

  it("async route guard allows access when resolving true", async () => {
    setLocationPathname("/async-protected");

    const ProtectedPage: Component = () => p(() => [text("Async Protected Content")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: "/async-protected",
                component: ProtectedPage,
                guard: () => Promise.resolve(true),
              },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    // Initially, content may not be shown (waiting for async guard)
    // After promise resolves, content should be shown
    vi.advanceTimersToNextFrame();
    await Promise.resolve(); // Allow microtasks to flush

    expect(container.textContent).toContain("Async Protected Content");
  });

  it("async route guard blocks access when resolving false", async () => {
    setLocationPathname("/async-blocked");

    const BlockedPage: Component = () => p(() => [text("Should Not See This")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: "/async-blocked",
                component: BlockedPage,
                guard: () => Promise.resolve(false),
              },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();
    await Promise.resolve();

    expect(container.textContent).not.toContain("Should Not See This");
  });

  it("responds to popstate event", () => {
    const HomePage: Component = () => p(() => [text("Home")]);
    const AboutPage: Component = () => p(() => [text("About")]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              { path: "/", component: HomePage },
              { path: "/about", component: AboutPage },
            ],
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Home");

    // Simulate popstate (browser back/forward)
    setLocationPathname("/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(container.textContent).toContain("About");
  });

  it("passes params as props with base path", () => {
    setLocationPathname("/app/users/99");

    let capturedParams: Record<string, string> = {};
    const UserPage: Component<RouteComponentProps> = ({ params }) => {
      capturedParams = params;
      return p(() => [text(`User: ${params.id}`)]);
    };

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: "/users/:id", component: UserPage }],
            base: "/app",
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(capturedParams.id).toBe("99");
    expect(container.textContent).toContain("User: 99");
  });

  it("cleans up event listeners on unmount", () => {
    const HomePage: Component = () => p(() => [text("Home")]);
    const AboutPage: Component = () => p(() => [text("About")]);

    // Create a parent slot to control unmounting
    let parentSlot: any;

    mount(
      () =>
        div(function* () {
          parentSlot = yield* div(function* () {
            yield* RouterView({
              routes: [
                { path: "/", component: HomePage },
                { path: "/about", component: AboutPage },
              ],
            });
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();
    expect(container.textContent).toContain("Home");

    // Unmount RouterView by replacing with different content
    parentSlot.refresh(() => [text("Replaced")]);
    expect(container.textContent).toContain("Replaced");

    // After unmount, route change events should not re-render the old RouterView
    setLocationPathname("/about");
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.dispatchEvent(new Event("ydant:route-change"));

    // Content should remain "Replaced", not switch to "About"
    expect(container.textContent).toContain("Replaced");
    expect(container.textContent).not.toContain("About");
  });
});
