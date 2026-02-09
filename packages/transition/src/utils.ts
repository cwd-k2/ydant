/**
 * Transition utility functions
 *
 * Shared helper functions for CSS class manipulation and transition awaiting,
 * used by both Transition and TransitionGroup components.
 */

/**
 * Add CSS classes to an element
 *
 * Splits a space-separated class string and adds each class individually.
 * Empty strings and undefined values are silently ignored.
 *
 * @param el - Target HTML element
 * @param classes - Space-separated class string
 */
export function addClasses(el: HTMLElement, classes: string | undefined): void {
  if (classes) {
    el.classList.add(...classes.split(" ").filter(Boolean));
  }
}

/**
 * Remove CSS classes from an element
 *
 * Splits a space-separated class string and removes each class individually.
 * Empty strings and undefined values are silently ignored.
 *
 * @param el - Target HTML element
 * @param classes - Space-separated class string
 */
export function removeClasses(el: HTMLElement, classes: string | undefined): void {
  if (classes) {
    el.classList.remove(...classes.split(" ").filter(Boolean));
  }
}

/**
 * Wait for a CSS transition to complete on an element
 *
 * Reads the element's computed transitionDuration and listens for the
 * transitionend event. Resolves immediately if the duration is 0.
 * A safety timeout of duration + 50ms is set to prevent indefinite hanging.
 *
 * @param el - Target HTML element
 * @returns A Promise that resolves when the transition ends
 */
export function waitForTransition(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const computed = getComputedStyle(el);
    const duration = parseFloat(computed.transitionDuration) * 1000;

    if (duration === 0) {
      resolve();
      return;
    }

    const handler = () => {
      el.removeEventListener("transitionend", handler);
      resolve();
    };
    el.addEventListener("transitionend", handler);

    // Safety timeout in case transitionend never fires
    setTimeout(resolve, duration + 50);
  });
}
