/**
 * Elastic Header (Stretchy Banner) Effect
 *
 * Wheel events: lerp smoothing (Windows discrete scrolling → smooth animation).
 * Touch events: absolute finger tracking with lerp for buttery-smooth feel.
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

  let targetPull = 0;
  let currentPull = 0;
  let rafId = 0;
  let isTouching = false;

  // Wheel: lerp smoothing for Windows discrete jumps
  // Touch: absolute tracking + lerp for smoothness
  const WHEEL_RESISTANCE = 0.4;
  const TOUCH_RESISTANCE = 0.8;
  const RETRACT_SPEED = 0.5;
  const LERP_FACTOR = 0.25;

  function getMaxPull(): number {
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
    const resisted = maxPull * (1 - Math.pow(1 - clamped / maxPull, 1.3));

    root.style.setProperty("--elastic-pull", `${resisted}px`);

    const progress = resisted / maxPull;
    const scale = 1.15 - 0.15 * progress;
    root.style.setProperty("--elastic-scale", `${scale}`);
  }

  // --- Animation loop ---
  function tick(): void {
    const diff = targetPull - currentPull;
    if (Math.abs(diff) < 0.5) {
      currentPull = targetPull;
      applyPull(currentPull);
      rafId = 0;
      return;
    }
    currentPull += diff * LERP_FACTOR;
    applyPull(currentPull);
    rafId = requestAnimationFrame(tick);
  }

  function startAnimation(): void {
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function stopAnimation(): void {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  // --- Wheel handler (desktop) — incremental + lerp ---
  function onWheel(e: WheelEvent): void {
    if (!document.body.classList.contains("is-home")) return;

    if (getScrollTop() > 0) {
      if (targetPull > 0) {
        targetPull = 0;
        startAnimation();
      }
      return;
    }

    if (e.deltaY < 0) {
      e.preventDefault();
      targetPull += Math.abs(e.deltaY) * WHEEL_RESISTANCE;
      targetPull = Math.min(targetPull, getMaxPull());
      startAnimation();
    } else if (e.deltaY > 0 && targetPull > 0) {
      e.preventDefault();
      targetPull -= e.deltaY * RETRACT_SPEED;
      if (targetPull < 0) targetPull = 0;
      startAnimation();
    }
  }

  // --- Touch handlers (mobile) ---
  // Absolute tracking: banner position directly maps to finger distance from touch start.
  // Lerp smooths out touch event jitter for a buttery feel.
  let touchStartY = 0;
  let pullAtTouchStart = 0;

  function onTouchStart(e: TouchEvent): void {
    if (!document.body.classList.contains("is-home")) return;
    if (getScrollTop() <= 0) {
      touchStartY = e.touches[0].clientY;
      pullAtTouchStart = targetPull; // remember where we were when touch started
      isTouching = true;
    }
  }

  function onTouchMove(e: TouchEvent): void {
    if (!isTouching) return;
    const fingerY = e.touches[0].clientY;
    const dragged = fingerY - touchStartY; // positive = finger moved down

    if (dragged >= 0 && getScrollTop() <= 0) {
      // Finger below start = expand
      e.preventDefault();
      targetPull = pullAtTouchStart + dragged * TOUCH_RESISTANCE;
      targetPull = Math.min(targetPull, getMaxPull());
      if (targetPull < 0) targetPull = 0;
      startAnimation();
    } else if (dragged < 0) {
      // Finger above start = retract
      e.preventDefault();
      targetPull = pullAtTouchStart + dragged * TOUCH_RESISTANCE;
      if (targetPull < 0) targetPull = 0;
      startAnimation();
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
    stopAnimation();
    wheelTarget.removeEventListener("wheel", onWheel as EventListener);
    touchTarget.removeEventListener("touchstart", onTouchStart as EventListener);
    touchTarget.removeEventListener("touchmove", onTouchMove as EventListener);
    touchTarget.removeEventListener("touchend", onTouchEnd as EventListener);
    targetPull = 0;
    currentPull = 0;
    applyPull(0);
  };
}
