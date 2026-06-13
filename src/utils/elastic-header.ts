/**
 * Elastic Header (Stretchy Banner) Effect
 *
 * The banner state is directly tied to the scroll input — no springs, no lock, no bounce.
 * Scroll up at the top → banner expands. Scroll down → banner retracts.
 * Like the banner is part of the scrollable content itself.
 *
 * Wheel events use lerp smoothing (Windows discrete scrolling → smooth animation).
 * Touch events bypass lerp for direct 1:1 finger response.
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

  // targetPull = where we want to be (set instantly by input)
  // currentPull = where we are now (smoothed toward targetPull each frame, wheel only)
  let targetPull = 0;
  let currentPull = 0;
  let rafId = 0;
  let isTouching = false;

  const RESISTANCE = 0.4;       // wheel: input attenuation
  const TOUCH_RESISTANCE = 0.6; // touch: less attenuation for easier pulling on mobile
  const RETRACT_SPEED = 0.5;
  const LERP_FACTOR = 0.2;      // wheel smoothing factor

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

  // --- Animation loop: smooth lerp for wheel events only ---
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

  // --- Wheel handler (desktop) — uses lerp smoothing ---
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
      targetPull += Math.abs(e.deltaY) * RESISTANCE;
      targetPull = Math.min(targetPull, getMaxPull());
      startAnimation();
    } else if (e.deltaY > 0 && targetPull > 0) {
      e.preventDefault();
      targetPull -= e.deltaY * RETRACT_SPEED;
      if (targetPull < 0) targetPull = 0;
      startAnimation();
    }
  }

  // --- Touch handlers (mobile) — direct 1:1 response, no lerp ---
  let lastTouchY = 0;

  function onTouchStart(e: TouchEvent): void {
    if (!document.body.classList.contains("is-home")) return;
    if (getScrollTop() <= 0) {
      lastTouchY = e.touches[0].clientY;
      isTouching = true;
    }
  }

  function onTouchMove(e: TouchEvent): void {
    if (!isTouching) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - lastTouchY;
    lastTouchY = currentY;

    if (delta > 0 && getScrollTop() <= 0) {
      // Finger moving down = expand banner (direct, no lerp)
      e.preventDefault();
      targetPull += delta * TOUCH_RESISTANCE;
      targetPull = Math.min(targetPull, getMaxPull());
      currentPull = targetPull;
      stopAnimation();
      applyPull(currentPull);
    } else if (delta < 0 && targetPull > 0) {
      // Finger moving up = retract banner (direct, no lerp)
      e.preventDefault();
      targetPull += delta * RETRACT_SPEED;
      if (targetPull < 0) targetPull = 0;
      currentPull = targetPull;
      stopAnimation();
      applyPull(currentPull);
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
