import type { MusicConfig, MetingConfig, MusicSong, PlayMode } from "../../types/config";
import { url } from "../../utils/url-utils";
import I18nKey from "../../i18n/i18nKey";
import { i18n } from "../../i18n/translation";

// ── 纯函数(单元测试覆盖)──────────────────────────────────

export interface LyricLine {
  time: number;
  text: string;
}

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const result: LyricLine[] = [];
  const timeReg = /\[(\d{1,2}):(\d{2})\.(\d{2,3})\]/g;
  for (const line of lrc.split("\n")) {
    const matches = Array.from(line.matchAll(timeReg));
    if (matches.length === 0) continue;
    const text = line.replace(timeReg, "").trim();
    if (!text) continue;
    for (const m of matches) {
      const min = Number.parseInt(m[1], 10);
      const sec = Number.parseInt(m[2], 10);
      const ms = Number.parseInt(m[3], 10);
      const time = min * 60 + sec + ms / (m[3].length === 3 ? 1000 : 100);
      result.push({ time, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds) || seconds < 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

export function computeNextIndex(
  current: number,
  len: number,
  mode: PlayMode,
): number {
  if (len === 0) return -1;
  if (mode === "one") return current;
  if (mode === "random") {
    if (len === 1) return current;
    let next = current;
    while (next === current) next = Math.floor(Math.random() * len);
    return next;
  }
  return (current + 1) % len; // list
}

/**
 * 构建 Meting API 请求 URL,替换 :server/:type/:id/:r 占位符,
 * 并在配置了 auth 时追加鉴权参数。纯函数,可单元测试。
 */
export function buildMetingUrl(api: string, m: MetingConfig): string {
  let url = api
    .replace(":server", m.server)
    .replace(":type", m.type)
    .replace(":id", m.id)
    .replace(":r", String(Math.random()));
  if (m.auth) url += (url.includes("?") ? "&" : "?") + "auth=" + m.auth;
  return url;
}

// ── 运行时类型 ──────────────────────────────────────────

export interface MusicTrack {
  name: string;
  artist: string;
  url: string;
  pic?: string;
  lrc?: string;
}

export interface MusicState {
  playlist: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  playMode: PlayMode;
  volume: number;
  isMuted: boolean;
  lyrics: LyricLine[];
  currentLrcIndex: number;
  progress: number;
  currentTime: number;
  duration: number;
  currentTimeStr: string;
  durationStr: string;
  track: MusicTrack | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

type Listener = (state: MusicState) => void;

const STORAGE_VOLUME = "music-player-volume";
const STORAGE_MODE = "music-player-mode";

function buildPlaylist(songs: MusicSong[]): MusicTrack[] {
  return songs.map((s) => ({
    name: s.name,
    artist: s.artist,
    url: url(s.src),
    pic: s.cover ? url(s.cover) : undefined,
    lrc: s.lrc ? url(s.lrc) : undefined,
  }));
}

class MusicManager {
  private audio: HTMLAudioElement;
  private config: MusicConfig;
  private state: MusicState;
  private listeners = new Set<Listener>();
  private loadVersion = 0;

  constructor(config: MusicConfig) {
    this.config = config;
    this.audio = document.createElement("audio");
    this.audio.crossOrigin = "anonymous";
    this.audio.style.display = "none";
    document.body.appendChild(this.audio);

    const storedVol = localStorage.getItem(STORAGE_VOLUME);
    const volume =
      storedVol !== null ? Number.parseFloat(storedVol) : (config.defaultVolume ?? 0.7);
    const playMode =
      (localStorage.getItem(STORAGE_MODE) as PlayMode | null) ??
      config.defaultPlayMode ??
      "list";

    this.state = {
      playlist: config.mode === "local" ? buildPlaylist(config.songs) : [],
      currentIndex: 0,
      isPlaying: false,
      playMode,
      volume,
      isMuted: false,
      lyrics: [],
      currentLrcIndex: -1,
      progress: 0,
      currentTime: 0,
      duration: 0,
      currentTimeStr: "0:00",
      durationStr: "0:00",
      track: null,
      initialized: false,
      loading: config.mode === "meting",
      error: null,
    };

    this.audio.volume = volume;
    this.bindAudioEvents();
  }

  private bindAudioEvents(): void {
    this.audio.addEventListener("play", () => {
      this.state.isPlaying = true;
      this.notify();
    });
    this.audio.addEventListener("pause", () => {
      this.state.isPlaying = false;
      this.notify();
    });
    this.audio.addEventListener("ended", () => this.handleEnded());
    this.audio.addEventListener("timeupdate", () => this.updateTime());
    this.audio.addEventListener("loadedmetadata", () => {
      this.state.duration = this.audio.duration || 0;
      this.state.durationStr = formatTime(this.state.duration);
      this.notify();
    });
    this.audio.addEventListener("error", () => {
      this.state.error = i18n(I18nKey.musicError);
      this.state.isPlaying = false;
      this.notify();
    });
  }

  private notify(): void {
    for (const fn of this.listeners) fn(this.state);
  }

  // ── public API ──────────────────────────────────────
  async init(): Promise<void> {
    if (this.state.initialized) return;
    this.state.initialized = true;
    if (this.config.mode === "meting" && this.config.meting) {
      this.state.loading = true;
      this.notify();
      try {
        await this.fetchMetingData();
      } catch {
        this.state.error = i18n(I18nKey.musicError);
      } finally {
        this.state.loading = false;
      }
    } else {
      // mode=meting 但缺 meting 配置 → 视作无歌单,关闭 loading(避免永久转圈)
      this.state.loading = false;
    }
    if (this.state.playlist.length > 0) this.loadTrack(0, false);
    this.notify();
  }

  /**
   * 从 Meting API 拉取在线歌单。依次尝试主 API 与 fallbackApis,
   * 第一个返回非空数组的 API 即采用;全部失败则抛错(由 init 捕获)。
   */
  private async fetchMetingData(): Promise<void> {
    const m = this.config.meting;
    if (!m) return;
    const apis = [m.api, ...(m.fallbackApis ?? [])];
    for (const baseApi of apis) {
      if (!baseApi) continue;
      try {
        const fetchUrl = buildMetingUrl(baseApi, m);
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Array<{
          title?: string; name?: string; author?: string; artist?: string;
          url?: string; pic?: string; cover?: string; lrc?: string;
        }>;
        if (Array.isArray(data) && data.length > 0) {
          this.state.playlist = data.map((item) => ({
            name: item.title || item.name || "Unknown",
            artist: item.author || item.artist || "Unknown",
            url: item.url || "",
            pic: item.pic || item.cover || undefined,
            lrc: item.lrc || undefined,
          }));
          return;
        }
      } catch (e) {
        console.warn(`Meting API failed for ${baseApi}`, e);
      }
    }
    throw new Error("All Meting APIs failed");
  }

  getState(): MusicState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  togglePlay(): void {
    if (this.state.playlist.length === 0) return;
    if (!this.audio.src) {
      this.loadTrack(this.state.currentIndex, true);
      return;
    }
    if (this.audio.paused) {
      this.audio.play().catch(() => {
        this.state.error = i18n(I18nKey.musicError);
        this.notify();
      });
    } else {
      this.audio.pause();
    }
  }

  playNext(): void {
    const idx = computeNextIndex(
      this.state.currentIndex,
      this.state.playlist.length,
      this.state.playMode,
    );
    if (idx >= 0) this.loadTrack(idx, true);
  }

  playPrev(): void {
    if (this.state.playlist.length === 0) return;
    const prev =
      (this.state.currentIndex - 1 + this.state.playlist.length) %
      this.state.playlist.length;
    this.loadTrack(prev, true);
  }

  playTrackByIndex(idx: number): void {
    if (idx < 0 || idx >= this.state.playlist.length) return;
    this.loadTrack(idx, true);
  }

  cyclePlayMode(): void {
    const order: PlayMode[] = ["list", "one", "random"];
    const i = order.indexOf(this.state.playMode);
    this.state.playMode = order[(i + 1) % order.length]!;
    localStorage.setItem(STORAGE_MODE, this.state.playMode);
    this.notify();
  }

  setVolume(v: number): void {
    const vol = Math.max(0, Math.min(1, v));
    this.state.volume = vol;
    this.state.isMuted = vol === 0;
    this.audio.volume = vol;
    localStorage.setItem(STORAGE_VOLUME, String(vol));
    this.notify();
  }

  toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    this.audio.volume = this.state.isMuted ? 0 : this.state.volume;
    this.notify();
  }

  seek(pct: number): void {
    if (!this.audio.duration) return;
    this.audio.currentTime = Math.max(0, Math.min(1, pct)) * this.audio.duration;
    this.updateTime();
  }

  seekToTime(t: number): void {
    if (!this.audio.duration) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, t));
    this.updateTime();
  }

  // ── private ─────────────────────────────────────────
  private handleEnded(): void {
    if (this.state.playMode === "one") {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    } else {
      this.playNext();
    }
  }

  private loadTrack(idx: number, autoplay: boolean): void {
    const track = this.state.playlist[idx];
    if (!track) return;
    const version = ++this.loadVersion;
    this.state.currentIndex = idx;
    this.state.track = track;
    this.state.progress = 0;
    this.state.currentTime = 0;
    this.state.currentTimeStr = "0:00";
    this.state.durationStr = "0:00";
    this.state.lyrics = [];
    this.state.currentLrcIndex = -1;
    this.state.error = null;
    this.notify();

    this.audio.src = track.url;
    if (autoplay) {
      this.audio.play().catch(() => {
        if (version !== this.loadVersion) return; // 已切歌,丢弃旧 track 的 rejection
        this.state.error = i18n(I18nKey.musicError);
        this.notify();
      });
    }
    void this.loadLyrics(track, version);
  }

  private async loadLyrics(track: MusicTrack, version: number): Promise<void> {
    if (!track.lrc) {
      this.state.lyrics = [];
      return;
    }
    try {
      const res = await fetch(track.lrc);
      const text = await res.text();
      if (version !== this.loadVersion) return; // 已切到别的歌,丢弃
      this.state.lyrics = parseLRC(text);
      this.notify();
    } catch {
      if (version === this.loadVersion) this.state.lyrics = [];
    }
  }

  private updateTime(): void {
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    this.state.currentTime = cur;
    this.state.progress = dur > 0 ? (cur / dur) * 100 : 0;
    this.state.currentTimeStr = formatTime(cur);

    let lrcIdx = -1;
    for (let i = 0; i < this.state.lyrics.length; i++) {
      if (this.state.lyrics[i]!.time <= cur) lrcIdx = i;
      else break;
    }
    this.state.currentLrcIndex = lrcIdx;
    this.notify();
  }
}

// ── 单例工厂 ────────────────────────────────────────────
let manager: MusicManager | null = null;

export function initMusicManager(config: MusicConfig): MusicManager {
  if (manager) return manager;
  manager = new MusicManager(config);
  void manager.init();
  return manager;
}

export function getMusicManager(): MusicManager | null {
  return manager;
}
