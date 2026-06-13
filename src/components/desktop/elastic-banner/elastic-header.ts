/**
 * Elastic Banner — desktop-only stretchy header effect.
 *
 * Desktop-only component (see src/components/desktop/). On mobile the banner is
 * a simple static image — this whole module bails out early when the viewport
 * is mobile (see isMobileViewport()). Future "banner fully revealed" canvas
 * content should live alongside this file in src/components/desktop/elastic-banner/.
 */
import { isMobileViewport } from "../../../utils/device";
import { desktopConfig } from "../../../config";

const cfg = desktopConfig.elasticBanner;

export function initElasticHeader(): () => void {
  if (!cfg.enable) return () => {};
  if (!document.body.classList.contains("is-home")) return () => {};
  if (!document.getElementById("banner-wrapper")) return () => {};
  // Mobile: no elastic effect, static banner only
  if (isMobileViewport()) return () => {};

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

  const WHEEL_RESISTANCE = cfg.wheelResistance;
  const RETRACT_SPEED = cfg.retractSpeed;
  const LERP_FACTOR = cfg.lerpFactor;

  function getMaxPull(): number {
    return window.innerHeight * cfg.maxPullRatio;
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
    const resisted = maxPull * (1 - Math.pow(1 - clamped / maxPull, cfg.resistancePower));

    root.style.setProperty("--elastic-pull", `${resisted}px`);
    // Content peels away faster than banner for depth effect.
    const contentMultiplier = cfg.contentMultiplier;
    root.style.setProperty("--elastic-pull-content", `${resisted * contentMultiplier}px`);

    const progress = resisted / maxPull;
    const scale = cfg.initialScale - cfg.scaleRange * progress;
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

  // --- Register listeners ---
  const wheelTarget: EventTarget = useNativeScroll ? window : scrollTarget;

  wheelTarget.addEventListener("wheel", onWheel as EventListener, { passive: false });

  // --- Cleanup ---
  return () => {
    stopAnimation();
    wheelTarget.removeEventListener("wheel", onWheel as EventListener);
    targetPull = 0;
    currentPull = 0;
    applyPull(0);
  };
}
