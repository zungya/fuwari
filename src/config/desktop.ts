import type { DesktopConfig } from "../types/config";

/**
 * Desktop-only configuration.
 *
 * Drives components under src/components/desktop/ (features that mobile never
 * loads). Tweak these values to adjust desktop behavior without editing source.
 */
export const desktopConfig: DesktopConfig = {
	elasticBanner: {
		enable: true,
		maxPullRatio: 0.6, // max pull = viewport height × 0.6
		wheelResistance: 0.4,
		retractSpeed: 0.5,
		lerpFactor: 0.35,
		resistancePower: 1.1,
		initialScale: 1.15,
		scaleRange: 0.15,
		contentMultiplier: 1.3,
	},
};
