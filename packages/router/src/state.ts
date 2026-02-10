/**
 * Router state constants
 *
 * Route state is derived from window.location (no module-level state).
 * Route change notifications use DOM custom events.
 */

/** Custom event type dispatched on programmatic navigation (navigate/replaceState). */
export const ROUTE_CHANGE_EVENT = "ydant:route-change";
