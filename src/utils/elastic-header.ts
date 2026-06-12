/**
 * Elastic Header (Stretchy Banner) Effect
 *
 * The banner state is directly tied to the scroll input — no springs, no lock, no bounce.
 * Scroll up at the top → banner expands. Scroll down → banner retracts.
 * Like the banner is part of the scrollable content itself.
 */
export function initElasticHeader(): () => void {
  if (!document.body.classList.contains("is-home")) return () => {};
  if (!document.getElementById("banner-wrapper")) return () => {};

  const osViewport = document.querySelector(".os-viewport") as HTMLElement | null;
  const useNativeScroll = !osViewport;
  const scrollTarget = useNativeScroll ? window : osViewport!;

  function getScrollTop(): number {
    if (useNativeScroll) return window.scrollY;
    return (scrollTarget as HTMLElement).scrollTop;
  }

  let pullDistance = 0;
  let startY = 0;
  let isTouching = false;

  const RESISTANCE = 0.4;
  const RETRACT_SPEED = 0.5; // how fast scrolling down retracts the banner

  function getMaxPull(): number {
    // Pull enough to reach ~100vh total (fullscreen)
    // BANNER_HEIGHT_HOME is 45vh, so we need ~55vh more
    return window.innerHeight * 0.6;
  }

  function applyPull(px: number): void {
    const root = document.documentElement;
    const body = document.body;

    if (px > 0) {
      body.classList.add("elastic-active");
      root.classList.add("elastic-active");
    } else {
      body.classList.remove("elastic-active");
      root.classList.remove("elastic-active");
    }

    const maxPull = getMaxPull();
    const clamped = Math.min(Math.max(px, 0), maxPull);
    // Mild resistance (power 1.3) — softer curve so the last portion doesn't feel sluggish
    const resisted = maxPull * (1 - Math.pow(1 - clamped / maxPull, 1.3));

    root.style.setProperty("--elastic-pull", `${resisted}px`);

    // Scale: 1.1 → 1.0 as pull progresses
    const progress = resisted / maxPull;
    const scale = 1.1 - 0.1 * progress;
    root.style.setProperty("--elastic-scale", `${scale}`);
  }

  // --- Wheel handler (desktop) ---
  function onWheel(e: WheelEvent): void {
    if (!document.body.classList.contains("is-home")) return;

    // If scrolled into the page, reset banner
    if (getScrollTop() > 0) {
      if (pullDistance > 0) {
        pullDistance = 0;
        applyPull(0);
      }
      return;
    }

    if (e.deltaY < 0) {
      // Scroll up at top → expand banner
      e.preventDefault();
      pullDistance += Math.abs(e.deltaY) * RESISTANCE;
      pullDistance = Math.min(pullDistance, getMaxPull());
      applyPull(pullDistance);
    } else if (e.deltaY > 0 && pullDistance > 0) {
      // Scroll down while expanded → retract banner proportionally
      e.preventDefault();
      pullDistance -= e.deltaY * RETRACT_SPEED;
      if (pullDistance < 0) pullDistance = 0;
      applyPull(pullDistance);
    }
  }

  // --- Touch handlers (mobile) ---
  function onTouchStart(e: TouchEvent): void {
    if (!document.body.classList.contains("is-home")) return;
    if (getScrollTop() <= 0) {
      startY = e.touches[0].clientY;
      isTouching = true;
    }
  }

  function onTouchMove(e: TouchEvent): void {
    if (!isTouching) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0 && getScrollTop() <= 0) {
      e.preventDefault();
      pullDistance = deltaY * RESISTANCE;
      pullDistance = Math.min(pullDistance, getMaxPull());
      applyPull(pullDistance);
    } else if (deltaY < 0 && pullDistance > 0) {
      e.preventDefault();
      pullDistance = Math.abs(deltaY) * RESISTANCE;
      // Invert: pulling up from expanded = retract
      pullDistance = Math.max(0, pullDistance);
      applyPull(pullDistance);
    }
  }

  function onTouchEnd(): void {
    isTouching = false;
  }

  // --- Register listeners ---
  const wheelTarget: EventTarget = useNativeScroll ? window : scrollTarget;
  const touchTarget: EventTarget = scrollTarget;

  wheelTarget.addEventListener("wheel", onWheel as EventListener, { passive: false });
  touchTarget.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
  touchTarget.addEventListener("touchmove", onTouchMove as EventListener, { passive: false });
  touchTarget.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });

  // --- Cleanup ---
  return () => {
    wheelTarget.removeEventListener("wheel", onWheel as EventListener);
    touchTarget.removeEventListener("touchstart", onTouchStart as EventListener);
    touchTarget.removeEventListener("touchmove", onTouchMove as EventListener);
    touchTarget.removeEventListener("touchend", onTouchEnd as EventListener);
    pullDistance = 0;
    applyPull(0);
  };
}
