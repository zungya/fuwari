import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

export type SiteConfig = {
	title: string;
	subtitle: string;

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	themeColor: {
		hue: number;
		fixed: boolean;
	};
	banner: {
		enable: boolean;
		src: string;
		mobileSrc?: string;
		position?: "top" | "center" | "bottom";
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	favicon: Favicon[];
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
	About = 2,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
};

export type NavBarConfig = {
	links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
};

/** Parameters for the desktop-only elastic (stretchy) banner effect. */
export interface ElasticBannerConfig {
	enable: boolean;
	/** Max pull distance = viewport height × this ratio. */
	maxPullRatio: number;
	/** Wheel-down pull resistance (higher = harder to pull). */
	wheelResistance: number;
	/** Retract speed when releasing / scrolling back up. */
	retractSpeed: number;
	/** Lerp smoothing factor (lower = smoother/slower). */
	lerpFactor: number;
	/** Resistance curve power (higher = increasingly harder near max pull). */
	resistancePower: number;
	/** Initial banner image scale before pulling. */
	initialScale: number;
	/** How much the scale eases back toward 1.0 as pull progresses. */
	scaleRange: number;
	/** Content "peel-off" multiplier (>1 = content moves faster than banner for depth). */
	contentMultiplier: number;
}

/** Desktop-only configuration (components under src/components/desktop/). */
export interface DesktopConfig {
	elasticBanner: ElasticBannerConfig;
}

/** Mobile-only configuration (components under src/components/mobile/). Reserved for future use. */
export interface MobileConfig {
	// Add mobile-specific options here as they are introduced.
}

