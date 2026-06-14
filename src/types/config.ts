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

/** 播放模式:list = 列表循环 / one = 单曲循环 / random = 随机 */
export type PlayMode = "list" | "one" | "random";

/** 音乐来源模式:local = 本地音频 / meting = Meting 在线歌单 */
export type MusicMode = "local" | "meting";

/** Meting 支持的音乐服务商 */
export type MetingServer = "netease" | "tencent" | "kugou" | "xiami" | "baidu";

/** Meting 查询类型 */
export type MetingType = "song" | "playlist" | "album" | "search" | "artist";

/** Meting 在线歌单配置 */
export interface MetingConfig {
	/** API 地址,支持 :server/:type/:id/:r 占位符 */
	api: string;
	/** 音乐服务商 */
	server: MetingServer;
	/** 查询类型 */
	type: MetingType;
	/** 歌单/歌曲/专辑 ID 或搜索关键词 */
	id: string;
	/** 鉴权参数(可选) */
	auth?: string;
	/** 备用 API 列表(主 API 失败时依次尝试) */
	fallbackApis?: string[];
}

/** 歌单里的一首歌(本地音频) */
export interface MusicSong {
	/** 歌曲名 */
	name: string;
	/** 歌手 */
	artist: string;
	/** 音频文件路径,放 public/assets/music/ 下 */
	src: string;
	/** 封面图(可选,无则显示默认音符图标) */
	cover?: string;
	/** .lrc 歌词文件路径(可选) */
	lrc?: string;
}

/** 音乐播放器配置 */
export interface MusicConfig {
	/** 总开关,false 时侧栏不渲染播放器、manager 不初始化 */
	enable: boolean;
	/** 音频来源模式:local = 本地音频 / meting = Meting 在线歌单,默认 local */
	mode: MusicMode;
	/** 本地歌单(local 模式使用,meting 失败时亦可作回退) */
	songs: MusicSong[];
	/** Meting 在线歌单配置(meting 模式必填) */
	meting?: MetingConfig;
	/** 默认音量 0–1,默认 0.7 */
	defaultVolume?: number;
	/** 默认播放模式,默认 list */
	defaultPlayMode?: PlayMode;
	/** 是否显示歌词切换按钮,默认 true */
	showLyrics?: boolean;
}

