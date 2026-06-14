import type { MusicConfig } from "../types/config";

/**
 * Music player configuration.
 *
 * Drives the sidebar music player (src/features/music/). Tweak these values
 * to enable/disable the player, edit the playlist, and set defaults.
 */
export const musicConfig: MusicConfig = {
	enable: true,
	mode: "local",
	songs: [
		{
			name: "25時の情熱",
			artist: "25時、ナイトコードで,KAITO",
			src: "/assets/music/25時の情熱.mp3",
			cover: "/assets/music/25時の情熱.jpg",
			lrc: "/assets/music/25時の情熱.lrc",
		},
	],
	meting: {
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		server: "netease",
		type: "playlist",
		id: "10046455237",
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},
	defaultVolume: 0.7,
	defaultPlayMode: "list",
	showLyrics: true,
};
