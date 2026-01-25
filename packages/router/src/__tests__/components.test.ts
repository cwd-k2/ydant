import { describe, it, expect, vi, beforeEach } from 'vitest';
import { div, p } from '@ydant/core';
import { text } from '@ydant/core';
import type { Component } from '@ydant/core';
import { mount } from '@ydant/dom';
import { RouterLink, RouterView } from '../components';
import { navigate } from '../navigation';
import { updateRoute, currentRoute } from '../state';

describe('RouterLink', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
  });

  it('renders an anchor element', () => {
    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: '/about',
            children: () => text('About'),
          });
        }),
      container,
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/about');
    expect(link?.textContent).toBe('About');
  });

  it('calls navigate on click', () => {
    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: '/clicked',
            children: () => text('Click me'),
          });
        }),
      container,
    );

    const link = container.querySelector('a') as HTMLAnchorElement;
    link.click();

    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      '',
      '/clicked',
    );
  });

  it('prevents default navigation', () => {
    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: '/test',
            children: () => text('Test'),
          });
        }),
      container,
    );

    const link = container.querySelector('a') as HTMLAnchorElement;
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(event);

    // The default was prevented (pushState called, not actual navigation)
    expect(window.history.pushState).toHaveBeenCalled();
  });

  it('applies activeClass when path matches', () => {
    updateRoute('/current');

    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: '/current',
            children: () => text('Current'),
            activeClass: 'active',
          });
        }),
      container,
    );

    const link = container.querySelector('a');
    expect(link?.getAttribute('class')).toBe('active');
  });

  it('does not apply activeClass when path does not match', () => {
    updateRoute('/other');

    mount(
      () =>
        div(function* () {
          yield* RouterLink({
            href: '/different',
            children: () => text('Link'),
            activeClass: 'active',
          });
        }),
      container,
    );

    const link = container.querySelector('a');
    expect(link?.getAttribute('class')).toBeNull();
  });
});

describe('RouterView', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
  });

  it('renders matched route component', () => {
    updateRoute('/');

    const HomePage: Component = () => p(() => [text('Home Page')]);
    const AboutPage: Component = () => p(() => [text('About Page')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              { path: '/', component: HomePage },
              { path: '/about', component: AboutPage },
            ],
          });
        }),
      container,
    );

    expect(container.textContent).toContain('Home Page');
  });

  it('renders correct route after navigate', () => {
    updateRoute('/');

    const HomePage: Component = () => p(() => [text('Home Page')]);
    const AboutPage: Component = () => p(() => [text('About Page')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              { path: '/', component: HomePage },
              { path: '/about', component: AboutPage },
            ],
          });
        }),
      container,
    );

    vi.advanceTimersToNextFrame();

    // Navigate to about
    navigate('/about');

    expect(container.textContent).toContain('About Page');
  });

  it('extracts route parameters', () => {
    updateRoute('/users/42');

    let capturedId = '';
    const UserPage: Component = () => {
      capturedId = currentRoute.params.id;
      return p(() => [text(`User: ${capturedId}`)]);
    };

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: '/users/:id', component: UserPage }],
          });
        }),
      container,
    );

    expect(capturedId).toBe('42');
    expect(container.textContent).toContain('User: 42');
  });

  it('renders nothing when no route matches', () => {
    updateRoute('/nonexistent');

    const HomePage: Component = () => p(() => [text('Home')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: '/', component: HomePage }],
          });
        }),
      container,
    );

    // Only the wrapper divs, no home page content
    expect(container.textContent).not.toContain('Home');
  });

  it('matches wildcard route', () => {
    updateRoute('/any/path/here');

    const NotFound: Component = () => p(() => [text('404 Not Found')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: '*', component: NotFound }],
          });
        }),
      container,
    );

    expect(container.textContent).toContain('404 Not Found');
  });

  it('handles base path correctly', () => {
    updateRoute('/app/users');

    const UsersPage: Component = () => p(() => [text('Users List')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: '/users', component: UsersPage }],
            base: '/app',
          });
        }),
      container,
    );

    expect(container.textContent).toContain('Users List');
  });

  it('handles base path with root route', () => {
    updateRoute('/app');

    const HomePage: Component = () => p(() => [text('App Home')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [{ path: '/', component: HomePage }],
            base: '/app',
          });
        }),
      container,
    );

    expect(container.textContent).toContain('App Home');
  });

  it('route guard allows access when returning true', () => {
    updateRoute('/protected');

    const ProtectedPage: Component = () => p(() => [text('Protected Content')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: '/protected',
                component: ProtectedPage,
                guard: () => true,
              },
            ],
          });
        }),
      container,
    );

    expect(container.textContent).toContain('Protected Content');
  });

  it('route guard blocks access when returning false', () => {
    updateRoute('/protected');

    const ProtectedPage: Component = () => p(() => [text('Protected Content')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: '/protected',
                component: ProtectedPage,
                guard: () => false,
              },
            ],
          });
        }),
      container,
    );

    expect(container.textContent).not.toContain('Protected Content');
  });

  it('async route guard logs warning', () => {
    updateRoute('/async-protected');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const ProtectedPage: Component = () => p(() => [text('Protected')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              {
                path: '/async-protected',
                component: ProtectedPage,
                guard: () => Promise.resolve(true),
              },
            ],
          });
        }),
      container,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      'Async route guards are not yet supported'
    );

    warnSpy.mockRestore();
  });

  it('responds to popstate event', () => {
    // Save original location
    const originalLocation = window.location;

    // Mock window.location with full URL properties
    const mockLocation = {
      pathname: '/',
      origin: 'http://localhost',
      href: 'http://localhost/',
      search: '',
      hash: '',
    };

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    updateRoute('/');

    const HomePage: Component = () => p(() => [text('Home')]);
    const AboutPage: Component = () => p(() => [text('About')]);

    mount(
      () =>
        div(function* () {
          yield* RouterView({
            routes: [
              { path: '/', component: HomePage },
              { path: '/about', component: AboutPage },
            ],
          });
        }),
      container,
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain('Home');

    // Simulate popstate (browser back/forward)
    mockLocation.pathname = '/about';
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(container.textContent).toContain('About');

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('cleans up popstate listener on unmount', () => {
    const HomePage: Component = () => p(() => [text('Home')]);

    // Create a parent slot to control unmounting
    let parentSlot: any;

    mount(
      () =>
        div(function* () {
          parentSlot = yield* div(function* () {
            yield* RouterView({
              routes: [{ path: '/', component: HomePage }],
            });
          });
        }),
      container,
    );

    vi.advanceTimersToNextFrame();

    // Refresh with different content (unmounts RouterView)
    parentSlot.refresh(() => [text('Replaced')]);

    // The cleanup should have run (no error thrown)
    expect(container.textContent).toContain('Replaced');
  });
});
