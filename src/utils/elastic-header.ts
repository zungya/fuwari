/**
 * Elastic Header (Stretchy Banner) Effect
 *
 * Detects overscroll at the top of the homepage and drives a CSS-variable-based
 * elastic pull animation. The banner expands to reveal more of the image while
 * the content below slides down ("peeling away" feeling).
 *
 * Handles both OverlayScrollbars viewport (.os-viewport) and native scrolling
 * (macOS with overlay scrollbars where OverlayScrollbars doesn't initialize).
 */
export function initElasticHeader(): () => void {
  // Only activate on homepage with banner enabled
  if (!document.body.classList.contains("is-home")) return () => {};
  if (!document.getElementById("banner-wrapper")) return () => {};

  // Find the scrollable container — could be OverlayScrollbars viewport or window
  const osViewport = document.querySelector(".os-viewport") as HTMLElement | null;
  const useNativeScroll = !osViewport;

  const scrollTarget = useNativeScroll ? window : osViewport!;

  function getScrollTop(): number {
    if (useNativeScroll) return window.scrollY;
    return (scrollTarget as HTMLElement).scrollTop;
  }

  let pullDistance = 0;
  let isPulling = false;
  let startY = 0;
  let velocity = 0;
  let animationFrameId: number | null = null;
  let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

  const RESISTANCE = 0.4;
  const SPRING_STIFFNESS = 0.15;
  const SPRING_DAMPING = 0.65;

  function getMaxPull(): number {
    return window.innerHeight * 0.5;
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

    // Quadratic resistance: easy at first, harder as you pull further
    const maxPull = getMaxPull();
    const clamped = Math.min(Math.max(px, 0), maxPull);
    const resisted = maxPull * (1 - Math.pow(1 - clamped / maxPull, 2));

    root.style.setProperty("--elastic-pull", `${resisted}px`);

    // Scale: starts at 1.1 (slightly zoomed, edges cropped), returns to 1.0 (natural) at max pull
    // This creates a "cinematic zoom-out reveal" where pulling restores the full image
    const progress = resisted / maxPull;
    const scaleStart = 1.1;
    const scaleEnd = 1.0;
    const scale = scaleStart + (scaleEnd - scaleStart) * progress; // 1.1 → 1.0
    root.style.setProperty("--elastic-scale", `${scale}`);
  }

  function cancelSpringBack(): void {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function startSpringBack(): void {
    velocity = 0;

    function step(): void {
      const displacement = 0 - pullDistance;
      const springForce = displacement * SPRING_STIFFNESS;
      velocity = (velocity + springForce) * SPRING_DAMPING;
      pullDistance += velocity;

      if (Math.abs(pullDistance) < 0.5 && Math.abs(velocity) < 0.1) {
        pullDistance = 0;
        applyPull(0);
        animationFrameId = null;
        return;
      }

      applyPull(pullDistance);
      animationFrameId = requestAnimationFrame(step);
    }

    animationFrameId = requestAnimationFrame(step);
  }

  function resetPull(): void {
    cancelSpringBack();
    pullDistance = 0;
    applyPull(0);
    isPulling = false;
  }

  // --- Wheel handler (desktop) ---
  function onWheel(e: WheelEvent): void {
    if (!document.body.classList.contains("is-home")) return;

    if (getScrollTop() > 0) {
      if (pullDistance > 0) resetPull();
      return;
    }

    if (e.deltaY < 0) {
      // Scrolling up at the top
      e.preventDefault();
      isPulling = true;
      cancelSpringBack();

      pullDistance += Math.abs(e.deltaY) * RESISTANCE;
      pullDistance = Math.min(pullDistance, getMaxPull());
      applyPull(pullDistance);
    } else if (e.deltaY > 0 && pullDistance > 0) {
      // Scrolling down while pulled — partial release
      e.preventDefault();
      pullDistance -= e.deltaY * RESISTANCE * 0.5;
      if (pullDistance <= 0) {
        pullDistance = 0;
        isPulling = false;
      }
      applyPull(pullDistance);
    }
  }

  function onWheelDebounced(): void {
    if (wheelTimeout) clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      if (isPulling && pullDistance > 0) {
        isPulling = false;
        startSpringBack();
      }
    }, 150);
  }

  // --- Touch handlers (mobile) ---
  function onTouchStart(e: TouchEvent): void {
    if (!document.body.classList.contains("is-home")) return;
    if (getScrollTop() <= 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  }

  function onTouchMove(e: TouchEvent): void {
    if (!isPulling) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0 && getScrollTop() <= 0) {
      e.preventDefault();
      cancelSpringBack();
      pullDistance = deltaY * RESISTANCE;
      pullDistance = Math.min(pullDistance, getMaxPull());
      applyPull(pullDistance);
    } else if (deltaY < 0 && pullDistance > 0) {
      pullDistance += deltaY * RESISTANCE;
      if (pullDistance <= 0) {
        pullDistance = 0;
        isPulling = false;
      }
      applyPull(pullDistance);
    }
  }

  function onTouchEnd(): void {
    if (isPulling && pullDistance > 0) {
      isPulling = false;
      startSpringBack();
    }
  }

  // --- Register listeners ---
  // For native scroll, attach to window; for OverlayScrollbars, attach to its viewport
  const wheelTarget: EventTarget = useNativeScroll ? window : scrollTarget;
  const touchTarget: EventTarget = scrollTarget;

  wheelTarget.addEventListener("wheel", onWheel as EventListener, { passive: false });
  wheelTarget.addEventListener("wheel", onWheelDebounced);
  touchTarget.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
  touchTarget.addEventListener("touchmove", onTouchMove as EventListener, { passive: false });
  touchTarget.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });

  // --- Cleanup function ---
  return () => {
    wheelTarget.removeEventListener("wheel", onWheel as EventListener);
    wheelTarget.removeEventListener("wheel", onWheelDebounced);
    touchTarget.removeEventListener("touchstart", onTouchStart as EventListener);
    touchTarget.removeEventListener("touchmove", onTouchMove as EventListener);
    touchTarget.removeEventListener("touchend", onTouchEnd as EventListener);
    cancelSpringBack();
    resetPull();
    if (wheelTimeout) clearTimeout(wheelTimeout);
  };
}
