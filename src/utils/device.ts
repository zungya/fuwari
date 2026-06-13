/**
 * Device / viewport detection helpers.
 *
 * Centralizes breakpoint logic so desktop-only features (under src/features/)
 * and layout scripts share one source of truth instead of hardcoding magic
 * pixel values everywhere.
 *
 * NOTE: these read `window`, so call them from client-side code only
 * (event handlers, requestAnimationFrame callbacks, init() functions) — never
 * at module top level during SSR.
 */

/** Viewport width (px) at/below which the layout switches to the mobile variant. Matches Tailwind's `md` breakpoint. */
export const MOBILE_BREAKPOINT = 768;

/** Viewport width (px) at/above which large desktop-only features (e.g. the elastic banner) activate. Matches Tailwind's `lg` breakpoint. */
export const DESKTOP_BREAKPOINT = 1024;

/** True when the viewport is in the mobile range (width < 768px). Mobile gets the simple static layout — desktop-only effects should bail out when this is true. */
export function isMobileViewport(): boolean {
	return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

/** True when the viewport is in the large-desktop range (width >= 1024px). */
export function isDesktopViewport(): boolean {
	return typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT;
}
