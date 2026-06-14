# 音乐播放器(Music Player)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 fuwari 博客增加一个侧边栏音乐播放器(本地音频),Swup 切页时持续播放、控件持续有效。

**Architecture:** Manager(逻辑单例,唯一 `<audio>` 挂 `document.body`)+ MusicPlayer(UI 视图控制器,模块化 TS `<script>`)+ Music(侧栏薄壳)三层分离。view 通过 `subscribe` 回调订阅 manager 状态,点击转发给 manager 方法。

**Tech Stack:** Astro 5 / TypeScript / Tailwind 3 / vitest(manager 纯函数单元测试)

**Spec:** `docs/superpowers/specs/2026-06-14-music-player-design.md`
**Branch:** `feat/music-player`(已创建并切到)

**测试策略:** `manager.ts` 的纯函数用 vitest 做 TDD;UI/集成用 `pnpm check`(类型)+ `pnpm dev` 手动验证(见 Task 11 清单)。

---

## 文件结构

| 文件 | 责任 | 新建/改 |
|------|------|---------|
| `src/types/config.ts` | 加 `PlayMode` / `MusicSong` / `MusicConfig` 类型 | 改 |
| `src/config/music.ts` | `musicConfig`:歌单 + 默认参数 | 新建 |
| `src/config/index.ts` | re-export `musicConfig` | 改 |
| `src/features/music/manager.ts` | 逻辑单例:纯函数 + `MusicManager` 类 + `initMusicManager`/`getMusicManager` | 新建 |
| `src/features/music/manager.test.ts` | 纯函数单元测试 | 新建 |
| `src/features/music/MusicPlayer.astro` | UI 视图控制器 | 新建 |
| `src/features/music/README.md` | 说明 | 新建 |
| `src/components/widget/Music.astro` | 侧栏薄壳(WidgetLayout 包 MusicPlayer) | 新建 |
| `src/i18n/i18nKey.ts` | 加 18 个 `music*` key | 改 |
| `src/i18n/languages/*.ts`(×10) | 加 18 个 key 的翻译 | 改 |
| `src/components/widget/SideBar.astro` | sticky 区顶部引入 `<Music />` | 改 |
| `src/layouts/Layout.astro` | 全局 `<script>` init manager | 改 |
| `vitest.config.ts` | vitest 配置 | 新建 |

**任务依赖顺序**:1→2→3→4→5(manager),6(i18n),7→8(view),9(壳),10(集成),11(验证)。i18n(Task 6)和 view(Task 7-8)可在 manager 完成后并行。

---

## Task 1: vitest 测试基础设施

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`(加 devDep + test 脚本)

- [ ] **Step 1: 安装 vitest**

Run:
```bash
pnpm add -D vitest
```
Expected: `package.json` devDependencies 出现 `vitest`。

- [ ] **Step 2: 创建 vitest 配置**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: 加 test 脚本到 package.json**

Modify `package.json` 的 `scripts`,在 `"type-check"` 行后加:
```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: 验证 vitest 能跑(无测试时应报"no test files"而非崩溃)**

Run: `pnpm test`
Expected: 输出含 `No test files found` 或类似(说明 vitest 正常工作,只是没测试)。

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest for music manager unit tests"
```

---

## Task 2: 类型定义

**Files:**
- Modify: `src/types/config.ts`

- [ ] **Step 1: 读现有 types/config.ts 了解结构**

Run: `cat src/types/config.ts`
(确认文件末尾位置,把新类型加在合适处。)

- [ ] **Step 2: 加三个类型**

在 `src/types/config.ts` 末尾追加:
```ts
export type PlayMode = "list" | "one" | "random";

export interface MusicSong {
  name: string;
  artist: string;
  url: string;
  cover?: string;
  lrc?: string;
}

export interface MusicConfig {
  enable: boolean;
  songs: MusicSong[];
  defaultVolume?: number;
  defaultPlayMode?: PlayMode;
  showLyrics?: boolean;
}
```

- [ ] **Step 3: 类型检查通过**

Run: `pnpm check`
Expected: 无新增错误(可能有现有警告,忽略)。

- [ ] **Step 4: Commit**

```bash
git add src/types/config.ts
git commit -m "feat(music): add MusicConfig/PlayMode types"
```

---

## Task 3: 配置文件

**Files:**
- Create: `src/config/music.ts`
- Modify: `src/config/index.ts`

- [ ] **Step 1: 创建 config/music.ts**

Create `src/config/music.ts`:
```ts
import type { MusicConfig } from "../types/config";

export const musicConfig: MusicConfig = {
  enable: true,
  songs: [
    {
      name: "示例歌曲",
      artist: "示例歌手",
      url: "/assets/music/example.mp3",
    },
  ],
  defaultVolume: 0.7,
  defaultPlayMode: "list",
  showLyrics: true,
};
```

> 注:这首歌只是占位,用户后续替换成真实歌曲(见 Task 11 验证)。

- [ ] **Step 2: 在 config/index.ts re-export**

读 `src/config/index.ts`,在现有 re-export 行(如 `export { siteConfig } from "./site";`)后加一行:
```ts
export { musicConfig } from "./music";
```

- [ ] **Step 3: 类型检查**

Run: `pnpm check`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add src/config/music.ts src/config/index.ts
git commit -m "feat(music): add musicConfig and re-export"
```

---

## Task 4: manager 纯函数(TDD)

**Files:**
- Create: `src/features/music/manager.ts`(本任务只含纯函数 + LyricLine 类型)
- Test: `src/features/music/manager.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/features/music/manager.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { computeNextIndex, formatTime, parseLRC } from "./manager";

describe("parseLRC", () => {
  it("解析标准 LRC 行", () => {
    const lrc = "[00:01.23]第一行\n[00:05.67]第二行\n";
    expect(parseLRC(lrc)).toEqual([
      { time: 1.23, text: "第一行" },
      { time: 5.67, text: "第二行" },
    ]);
  });

  it("支持毫秒三位精度", () => {
    const lrc = "[01:02.345]test";
    expect(parseLRC(lrc)).toEqual([{ time: 62.345, text: "test" }]);
  });

  it("一行多时间戳都生成", () => {
    const lrc = "[00:01.00][00:03.00]重复";
    expect(parseLRC(lrc)).toEqual([
      { time: 1, text: "重复" },
      { time: 3, text: "重复" },
    ]);
  });

  it("空字符串返回空数组", () => {
    expect(parseLRC("")).toEqual([]);
  });

  it("跳过无文本行(纯元数据)", () => {
    const lrc = "[ti:标题]\n[00:01.00]实际歌词";
    expect(parseLRC(lrc)).toEqual([{ time: 1, text: "实际歌词" }]);
  });

  it("结果按时间排序", () => {
    const lrc = "[00:05.00]b\n[00:01.00]a";
    expect(parseLRC(lrc).map((l) => l.text)).toEqual(["a", "b"]);
  });
});

describe("formatTime", () => {
  it("正常格式化", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(599)).toBe("9:59");
  });

  it("NaN 或负数返回 0:00", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(-1)).toBe("0:00");
  });
});

describe("computeNextIndex", () => {
  it("list 模式循环", () => {
    expect(computeNextIndex(0, 3, "list")).toBe(1);
    expect(computeNextIndex(2, 3, "list")).toBe(0); // 末尾回到开头
  });

  it("one 模式保持当前", () => {
    expect(computeNextIndex(1, 3, "one")).toBe(1);
  });

  it("random 模式返回有效索引且不等于当前(len>1)", () => {
    const next = computeNextIndex(0, 3, "random");
    expect(next).toBeGreaterThanOrEqual(0);
    expect(next).toBeLessThan(3);
    expect(next).not.toBe(0);
  });

  it("空列表返回 -1", () => {
    expect(computeNextIndex(0, 0, "list")).toBe(-1);
  });

  it("random 单首列表返回 0", () => {
    expect(computeNextIndex(0, 1, "random")).toBe(0);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test`
Expected: FAIL,`parseLRC/computeNextIndex/formatTime is not exported`(manager.ts 还没创建或没导出这些)。

- [ ] **Step 3: 实现 manager.ts 的纯函数部分**

Create `src/features/music/manager.ts`(本任务只写这部分,类在 Task 5 加):
```ts
import type { MusicSong, PlayMode } from "../../types/config";
import { url } from "../../utils/url-utils";

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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm test`
Expected: 所有测试 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/features/music/manager.ts src/features/music/manager.test.ts
git commit -m "feat(music): add parseLRC/formatTime/computeNextIndex with tests"
```

---

## Task 5: manager 主类(单例 + state + audio + 公共方法)

**Files:**
- Modify: `src/features/music/manager.ts`(在 Task 4 基础上追加类)

- [ ] **Step 1: 往 manager.ts 追加类型 + 类 + 工厂函数**

在 `src/features/music/manager.ts` 末尾(`computeNextIndex` 之后)追加:
```ts
// ── 运行时类型 ──────────────────────────────────────────

import type { MusicConfig } from "../../types/config";

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
  error: string | null;
}

type Listener = (state: MusicState) => void;

const STORAGE_VOLUME = "music-player-volume";
const STORAGE_MODE = "music-player-mode";

function buildPlaylist(songs: MusicSong[]): MusicTrack[] {
  return songs.map((s) => ({
    name: s.name,
    artist: s.artist,
    url: url(s.url),
    pic: s.cover ? url(s.cover) : undefined,
    lrc: s.lrc ? url(s.lrc) : undefined,
  }));
}

class MusicManager {
  private audio: HTMLAudioElement;
  private state: MusicState;
  private listeners = new Set<Listener>();
  private loadVersion = 0;

  constructor(config: MusicConfig) {
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
      playlist: buildPlaylist(config.songs),
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
      this.state.error = "音频加载失败";
      this.state.isPlaying = false;
      this.notify();
    });
  }

  private notify(): void {
    for (const fn of this.listeners) fn(this.state);
  }

  // ── public API ──────────────────────────────────────
  init(): void {
    if (this.state.initialized) return;
    this.state.initialized = true;
    if (this.state.playlist.length > 0) this.loadTrack(0, false);
    this.notify();
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
        this.state.error = "播放失败";
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
    this.audio.currentTime = t;
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
        this.state.error = "播放失败";
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
  manager.init();
  return manager;
}

export function getMusicManager(): MusicManager | null {
  return manager;
}
```

> 注:`import type { MusicConfig }` 放在文件中间(TS 允许 import 声明在顶部;实际执行时把它合并到文件顶部已有的 import 区域)。执行时把所有 `import` 留在文件顶部。

- [ ] **Step 2: 把 import 整理到文件顶部**

确保 `src/features/music/manager.ts` 顶部所有 import 集中:
```ts
import type { MusicConfig, MusicSong, PlayMode } from "../../types/config";
import { url } from "../../utils/url-utils";
```
(Task 4 已有第二行;本任务加了 `MusicConfig`,合并到同一个 import 语句。)

- [ ] **Step 3: 类型检查**

Run: `pnpm check`
Expected: 通过(无类型错误)。若有 `crossOrigin`/`Math.random` 等告警,忽略(非错误)。

- [ ] **Step 4: 单元测试仍通过(没破坏纯函数)**

Run: `pnpm test`
Expected: Task 4 的测试全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/features/music/manager.ts
git commit -m "feat(music): implement MusicManager singleton with audio + state"
```

---

## Task 6: i18n(18 个 key + 10 语言)

**Files:**
- Modify: `src/i18n/i18nKey.ts`
- Modify: `src/i18n/languages/*.ts`(10 个文件)

- [ ] **Step 1: 读 i18nKey.ts 了解 enum 结构**

Run: `cat src/i18n/i18nKey.ts`
(确认是 enum 还是 const 对象,把新 key 加在合适位置。)

- [ ] **Step 2: 加 18 个 key 到 i18nKey.ts**

在 `src/i18n/i18nKey.ts` 的 key 定义里(最后一项前,保留原末项如 `},`)加:
```ts
  music = "music",
  musicNoPlaying = "musicNoPlaying",
  musicCover = "musicCover",
  musicLyrics = "musicLyrics",
  musicNoLyrics = "musicNoLyrics",
  musicLoadingLyrics = "musicLoadingLyrics",
  musicFailedLyrics = "musicFailedLyrics",
  musicNoSongs = "musicNoSongs",
  musicError = "musicError",
  musicPlay = "musicPlay",
  musicPause = "musicPause",
  musicVolume = "musicVolume",
  musicPlayMode = "musicPlayMode",
  musicPrev = "musicPrev",
  musicNext = "musicNext",
  musicPlaylist = "musicPlaylist",
  musicProgress = "musicProgress",
  musicNoCover = "musicNoCover",
```

- [ ] **Step 3: 加翻译到 zh_CN.ts 和 en.ts(认真翻译)**

读 `src/i18n/languages/zh_CN.ts`,在对象里加(键名对应 I18nKey 的 value 字符串):
```ts
  music: "音乐",
  musicNoPlaying: "未在播放",
  musicCover: "封面",
  musicLyrics: "歌词",
  musicNoLyrics: "暂无歌词",
  musicLoadingLyrics: "歌词加载中…",
  musicFailedLyrics: "歌词加载失败",
  musicNoSongs: "暂无歌曲",
  musicError: "播放出错",
  musicPlay: "播放",
  musicPause: "暂停",
  musicVolume: "音量",
  musicPlayMode: "播放模式",
  musicPrev: "上一首",
  musicNext: "下一首",
  musicPlaylist: "播放列表",
  musicProgress: "进度",
  musicNoCover: "无封面",
```

读 `src/i18n/languages/en.ts`,加:
```ts
  music: "Music",
  musicNoPlaying: "Not playing",
  musicCover: "Cover",
  musicLyrics: "Lyrics",
  musicNoLyrics: "No lyrics",
  musicLoadingLyrics: "Loading lyrics…",
  musicFailedLyrics: "Failed to load lyrics",
  musicNoSongs: "No songs",
  musicError: "Playback error",
  musicPlay: "Play",
  musicPause: "Pause",
  musicVolume: "Volume",
  musicPlayMode: "Play mode",
  musicPrev: "Previous",
  musicNext: "Next",
  musicPlaylist: "Playlist",
  musicProgress: "Progress",
  musicNoCover: "No cover",
```

- [ ] **Step 4: 其余 8 语言用 en 占位(es/id/ja/ko/th/tr/vi/zh_TW)**

对这 8 个文件,各加同样的 18 个键,**值用英文 + 行尾 `// TODO: translate`**。以 `ja.ts` 为例:
```ts
  music: "Music", // TODO: translate
  musicNoPlaying: "Not playing", // TODO: translate
  musicCover: "Cover", // TODO: translate
  musicLyrics: "Lyrics", // TODO: translate
  musicNoLyrics: "No lyrics", // TODO: translate
  musicLoadingLyrics: "Loading lyrics…", // TODO: translate
  musicFailedLyrics: "Failed to load lyrics", // TODO: translate
  musicNoSongs: "No songs", // TODO: translate
  musicError: "Playback error", // TODO: translate
  musicPlay: "Play", // TODO: translate
  musicPause: "Pause", // TODO: translate
  musicVolume: "Volume", // TODO: translate
  musicPlayMode: "Play mode", // TODO: translate
  musicPrev: "Previous", // TODO: translate
  musicNext: "Next", // TODO: translate
  musicPlaylist: "Playlist", // TODO: translate
  musicProgress: "Progress", // TODO: translate
  musicNoCover: "No cover", // TODO: translate
```
> `zh_TW.ts` 可以基于 zh_CN 改成繁体(可选),或同样用 en 占位。

- [ ] **Step 5: 类型检查(确认 10 语言都有全部 key)**

Run: `pnpm check`
Expected: 通过。若有 "Property 'music' is missing in type..." 报错,说明漏了某个语言文件,补上。

- [ ] **Step 6: Commit**

```bash
git add src/i18n/
git commit -m "feat(music): add 18 i18n keys (zh/en full, others placeholder)"
```

---

## Task 7: MusicPlayer.astro — UI 结构(HTML,Tailwind 3 转换后)

**Files:**
- Create: `src/features/music/MusicPlayer.astro`(本任务只写 frontmatter + HTML + `<template>` + `<style>`,script 在 Task 8)

- [ ] **Step 1: 创建 MusicPlayer.astro 的 frontmatter + HTML + template + style**

Create `src/features/music/MusicPlayer.astro`:
```astro
---
import { Icon } from "astro-icon/components";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";

interface Props {
	id?: string;
}
const { id } = Astro.props;
const widgetId = id || `music-widget-${Math.random().toString(36).substring(2, 9)}`;
---

<div
	id={widgetId}
	class="music-player-widget w-full relative transition-all duration-300"
	role="region"
	aria-label={i18n(I18nKey.music)}
>
	<!-- Top Row: Cover & Info -->
	<div class="flex items-center gap-2 mb-2 px-1">
		<!-- Circular Cover -->
		<div class="relative shrink-0 w-14 h-14 group">
			<div
				class="w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white dark:border-neutral-700 relative z-10 bg-[var(--primary)]/10 flex items-center justify-center"
			>
				<Icon
					name="material-symbols:music-note-rounded"
					class="text-2xl text-[var(--primary)] opacity-40 absolute"
					aria-hidden="true"
				/>
				<img
					class="music-cover w-full h-full object-cover animate-spin-slow relative z-10 opacity-0 transition-opacity duration-300"
					src=""
					alt={i18n(I18nKey.musicCover)}
					style="animation-play-state: paused;"
				/>
			</div>
		</div>

		<!-- Info Section -->
		<div class="flex-1 min-w-0 flex flex-col overflow-hidden">
			<div class="flex items-center justify-between overflow-hidden gap-2">
				<div class="flex-1 min-w-0 overflow-hidden relative">
					<h3
						class="music-title font-bold text-base text-neutral-800 dark:text-neutral-100 leading-tight truncate"
					>
						{i18n(I18nKey.music)}
					</h3>
				</div>
				<button
					class="btn-lrc-toggle hover:text-[var(--primary)] transition-all duration-300 p-0.5 pr-2 transform active:scale-95 text-neutral-400 shrink-0"
					title={i18n(I18nKey.musicLyrics)}
					aria-label={i18n(I18nKey.musicLyrics)}
				>
					<Icon
						name="material-symbols:subtitles-off-outline-rounded"
						class="icon-lrc-off text-xl"
						aria-hidden="true"
					/>
					<Icon
						name="material-symbols:subtitles-outline-rounded"
						class="icon-lrc-on text-xl hidden"
						aria-hidden="true"
					/>
				</button>
			</div>

			<div class="min-w-0 overflow-hidden">
				<p
					class="music-artist text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate"
				>
					{i18n(I18nKey.musicNoPlaying)}
				</p>
			</div>

			<!-- Time & Volume -->
			<div class="flex items-center gap-3 text-neutral-400 h-5">
				<div
					class="text-[10px] font-mono flex items-center gap-1 shrink-0 h-full"
					aria-live="polite"
				>
					<span class="current-time">0:00</span>
					<span class="opacity-50" aria-hidden="true">/</span>
					<span class="total-time">0:00</span>
				</div>
				<div class="flex items-center gap-1 bg-transparent h-full ml-auto">
					<button
						class="btn-mute hover:text-[var(--primary)] transition-colors p-0.5 rounded-md flex items-center"
						title={i18n(I18nKey.musicVolume)}
						aria-label={i18n(I18nKey.musicVolume)}
					>
						<Icon
							name="material-symbols:volume-up-rounded"
							class="icon-vol-high text-lg"
							aria-hidden="true"
						/>
						<Icon
							name="material-symbols:volume-off-rounded"
							class="icon-vol-mute text-lg hidden"
							aria-hidden="true"
						/>
					</button>
					<div class="w-16 transition-all duration-300 ease-out flex items-center">
						<div
							class="vol-container h-1 w-16 bg-neutral-300/50 dark:bg-neutral-500/40 rounded-full cursor-pointer relative ml-1"
							role="slider"
							aria-label={i18n(I18nKey.musicVolume)}
							aria-valuemin="0"
							aria-valuemax="100"
							aria-valuenow="70"
						>
							<div
								class="vol-bar absolute left-0 top-0 h-full bg-[var(--primary)] rounded-full w-[70%]"
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="px-1">
		<div
			class="progress-container relative w-full h-1 bg-neutral-300/60 dark:bg-neutral-500/40 rounded-full cursor-pointer touch-none mb-2 group mt-2"
			role="slider"
			aria-label={i18n(I18nKey.musicProgress)}
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow="0"
		>
			<div
				class="progress-bar absolute left-0 top-0 h-full bg-[var(--primary)] rounded-full w-0 transition-[width] duration-100"
			></div>
			<div
				class="progress-thumb absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-[var(--primary)] ring-2 ring-white dark:ring-neutral-800 rounded-full shadow-sm scale-0 group-hover:scale-100 transition-transform duration-200"
			></div>
		</div>
	</div>

	<!-- Controls -->
	<div class="flex items-center justify-between px-1 select-none">
		<button
			class="btn-repeat text-neutral-300 dark:text-neutral-600 hover:text-[var(--primary)] transition-colors p-2 active:scale-95"
			title={i18n(I18nKey.musicPlayMode)}
			aria-label={i18n(I18nKey.musicPlayMode)}
		>
			<Icon name="material-symbols:repeat-rounded" class="icon-repeat text-xl" aria-hidden="true" />
			<Icon name="material-symbols:repeat-one-rounded" class="icon-repeat-one text-xl hidden" aria-hidden="true" />
			<Icon name="material-symbols:shuffle-rounded" class="icon-shuffle text-xl hidden" aria-hidden="true" />
		</button>
		<button
			class="btn-prev text-neutral-600 dark:text-neutral-300 hover:text-[var(--primary)] transition-colors p-2 active:scale-95"
			title={i18n(I18nKey.musicPrev)}
			aria-label={i18n(I18nKey.musicPrev)}
		>
			<Icon name="material-symbols:skip-previous-rounded" class="text-3xl" aria-hidden="true" />
		</button>
		<button
			class="btn-play w-12 h-12 bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-regular-bg-hover)] active:bg-[var(--btn-regular-bg-active)] text-[var(--primary)] rounded-full flex items-center justify-center transition-all duration-300"
			title={i18n(I18nKey.musicPlay)}
			aria-label={i18n(I18nKey.musicPlay)}
		>
			<Icon name="material-symbols:play-arrow-rounded" class="icon-play text-3xl ml-0.5" aria-hidden="true" />
			<Icon name="material-symbols:pause-rounded" class="icon-pause text-3xl hidden" aria-hidden="true" />
		</button>
		<button
			class="btn-next text-neutral-600 dark:text-neutral-300 hover:text-[var(--primary)] transition-colors p-2 active:scale-95"
			title={i18n(I18nKey.musicNext)}
			aria-label={i18n(I18nKey.musicNext)}
		>
			<Icon name="material-symbols:skip-next-rounded" class="text-3xl" aria-hidden="true" />
		</button>
		<button
			class="btn-drawer-toggle text-neutral-400 hover:text-[var(--primary)] transition-all duration-300 p-2 transform active:scale-95"
			title={i18n(I18nKey.musicPlaylist)}
			aria-label={i18n(I18nKey.musicPlaylist)}
		>
			<Icon name="mdi:playlist-music" class="text-xl" aria-hidden="true" />
		</button>
	</div>

	<!-- Lyrics Drawer -->
	<div
		class="lrc-drawer grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] grid-rows-[0fr] opacity-0"
	>
		<div class="overflow-hidden min-h-0">
			<div class="mt-2 pt-2 border-t border-neutral-100 dark:border-white/5 mx-1">
				<div
					class="lrc-container h-48 overflow-y-auto custom-scrollbar flex flex-col items-center gap-2 p-4 py-24 text-center relative scroll-smooth"
					role="listbox"
					aria-label={i18n(I18nKey.musicLyrics)}
				>
					<div class="text-neutral-400 text-sm py-10" role="option">
						{i18n(I18nKey.musicNoLyrics)}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Playlist Drawer -->
	<div
		class="playlist-drawer grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] grid-rows-[0fr] opacity-0"
	>
		<div class="overflow-hidden min-h-0">
			<div class="mt-2 pt-2 border-t border-neutral-100 dark:border-white/5 mx-1">
				<div
					class="playlist-container max-h-48 overflow-y-auto custom-scrollbar pr-1 pb-1 relative"
					role="listbox"
					aria-label={i18n(I18nKey.musicPlaylist)}
				>
					<!-- items rendered by script -->
				</div>
			</div>
		</div>
	</div>

	<!-- Loading Overlay -->
	<div
		class="music-loading absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 dark:bg-[#1e1e1e]/60 backdrop-blur-[2px] transition-opacity duration-300 opacity-0 pointer-events-none rounded-xl"
		aria-busy="true"
		aria-hidden="true"
	>
		<div class="w-8 h-8 text-[var(--primary)] animate-spin">
			<Icon name="material-symbols:sync-rounded" class="text-3xl" aria-hidden="true" />
		</div>
	</div>
</div>

<template id={`playlist-item-template-${widgetId}`}>
	<div
		class="playlist-item flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
	>
		<div class="w-8 h-8 rounded-md overflow-hidden shrink-0 relative bg-neutral-200 dark:bg-neutral-700">
			<img src="" class="item-cover w-full h-full object-cover" loading="lazy" alt="" />
			<div
				class="item-active-overlay absolute inset-0 bg-[var(--primary)]/20 hidden items-center justify-center"
			>
				<div class="eq-bars flex items-end gap-[2px] h-3.5">
					<span class="eq-bar w-[3px] bg-[var(--primary)] rounded-sm"></span>
					<span class="eq-bar w-[3px] bg-[var(--primary)] rounded-sm"></span>
					<span class="eq-bar w-[3px] bg-[var(--primary)] rounded-sm"></span>
				</div>
				<svg class="eq-play-icon text-[var(--primary)] hidden" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z"></path>
				</svg>
			</div>
		</div>
		<div class="flex-1 min-w-0">
			<div class="item-title text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate group-hover:text-[var(--primary)] transition-colors"></div>
			<div class="item-artist text-[10px] text-neutral-400 truncate"></div>
		</div>
	</div>
</template>

<style>
	@keyframes spin-slow {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.animate-spin-slow {
		animation: spin-slow 10s linear infinite;
	}
	.eq-bars .eq-bar {
		animation: eq-bounce 1.2s ease-in-out infinite;
	}
	.eq-bars .eq-bar:nth-child(1) { animation-duration: 0.8s; }
	.eq-bars .eq-bar:nth-child(2) { animation-duration: 0.6s; animation-delay: 0.15s; }
	.eq-bars .eq-bar:nth-child(3) { animation-duration: 1.0s; animation-delay: 0.3s; }
	@keyframes eq-bounce {
		0%, 100% { height: 4px; }
		50% { height: 14px; }
	}
</style>
```

> 相对 Firefly 的转换:所有 `(--x)` → `[var(--x)]`、`(--x)/n` → `[var(--x)]/n`;删歌词切换按钮的 `!config.showLyrics ? 'hidden'` 条件(改由 script 根据 config 控制,简化模板);模板/playlist-item 去掉虚拟滚动的 absolute 定位(在 script 里用文档流渲染)。

- [ ] **Step 2: 类型检查(HTML 部分)**

Run: `pnpm check`
Expected: 通过(此时还没 script,组件不完整但 Astro 能编译)。

- [ ] **Step 3: Commit**

```bash
git add src/features/music/MusicPlayer.astro
git commit -m "feat(music): add MusicPlayer UI structure (Tailwind 3)"
```

---

## Task 8: MusicPlayer.astro — `<script>`(绑定 + subscribe + UI 更新)

**Files:**
- Modify: `src/features/music/MusicPlayer.astro`(在 `</style>` 后加 `<script>`)

- [ ] **Step 1: 在 MusicPlayer.astro 末尾加模块化 TS script**

在 `src/features/music/MusicPlayer.astro` 的 `</style>` 之后追加:
```astro
<script>
	import { initMusicManager } from "./manager";
	import { musicConfig } from "@/config";
	import I18nKey from "@/i18n/i18nKey";
	import { i18n } from "@/i18n/translation";

	type WidgetElements = {
		widget: HTMLElement;
		loading: HTMLElement;
		cover: HTMLImageElement;
		title: HTMLElement;
		artist: HTMLElement;
		progressBar: HTMLElement;
		progressThumb: HTMLElement;
		progressContainer: HTMLElement;
		currentTime: HTMLElement;
		totalTime: HTMLElement;
		btnPlay: HTMLButtonElement;
		iconPlay: HTMLElement;
		iconPause: HTMLElement;
		btnPrev: HTMLButtonElement;
		btnNext: HTMLButtonElement;
		btnRepeat: HTMLButtonElement;
		iconRepeat: HTMLElement;
		iconRepeatOne: HTMLElement;
		iconShuffle: HTMLElement;
		btnMute: HTMLButtonElement;
		iconVolHigh: HTMLElement;
		iconVolMute: HTMLElement;
		volContainer: HTMLElement;
		volBar: HTMLElement;
		btnLrc: HTMLButtonElement;
		iconLrcOn: HTMLElement;
		iconLrcOff: HTMLElement;
		lrcDrawer: HTMLElement;
		lrcContainer: HTMLElement;
		btnDrawer: HTMLButtonElement;
		playlistDrawer: HTMLElement;
		playlistContainer: HTMLElement;
		itemTemplate: HTMLTemplateElement;
	};

	function setupWidget(widget: HTMLElement): void {
		const widgetId = widget.id;
		const qs = <T extends Element>(sel: string): T => widget.querySelector(sel) as T;

		const ui: WidgetElements = {
			widget,
			loading: qs(".music-loading"),
			cover: qs(".music-cover"),
			title: qs(".music-title"),
			artist: qs(".music-artist"),
			progressBar: qs(".progress-bar"),
			progressThumb: qs(".progress-thumb"),
			progressContainer: qs(".progress-container"),
			currentTime: qs(".current-time"),
			totalTime: qs(".total-time"),
			btnPlay: qs(".btn-play"),
			iconPlay: qs(".icon-play"),
			iconPause: qs(".icon-pause"),
			btnPrev: qs(".btn-prev"),
			btnNext: qs(".btn-next"),
			btnRepeat: qs(".btn-repeat"),
			iconRepeat: qs(".icon-repeat"),
			iconRepeatOne: qs(".icon-repeat-one"),
			iconShuffle: qs(".icon-shuffle"),
			btnMute: qs(".btn-mute"),
			iconVolHigh: qs(".icon-vol-high"),
			iconVolMute: qs(".icon-vol-mute"),
			volContainer: qs(".vol-container"),
			volBar: qs(".vol-bar"),
			btnLrc: qs(".btn-lrc-toggle"),
			iconLrcOn: qs(".icon-lrc-on"),
			iconLrcOff: qs(".icon-lrc-off"),
			lrcDrawer: qs(".lrc-drawer"),
			lrcContainer: qs(".lrc-container"),
			btnDrawer: qs(".btn-drawer-toggle"),
			playlistDrawer: qs(".playlist-drawer"),
			playlistContainer: qs(".playlist-container"),
			itemTemplate: document.getElementById(`playlist-item-template-${widgetId}`) as HTMLTemplateElement,
		};

		// 关键元素缺失则放弃(SideBar 不在时)
		const critical: (Element | null)[] = [
			ui.btnPlay, ui.btnRepeat, ui.btnMute, ui.volContainer,
			ui.btnDrawer, ui.btnLrc, ui.lrcDrawer, ui.lrcContainer,
			ui.progressContainer, ui.btnNext, ui.btnPrev, ui.loading,
			ui.cover, ui.title, ui.artist, ui.playlistContainer, ui.itemTemplate,
		];
		if (critical.some((el) => !el)) return;

		// 隐藏歌词按钮(若配置关闭)
		if (!musicConfig.showLyrics) {
			ui.btnLrc.classList.add("hidden");
		}

		const mgr = initMusicManager(musicConfig); // 幂等,确保 manager 就绪
		const primaryColor =
			getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#6366f1";

		let isUserScrolling = false;
		let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
		let renderedPlaylistLen = -1;
		let renderedCurrentIndex = -1;

		// ── UI 更新函数 ──
		function setLoading(on: boolean): void {
			ui.loading.classList.toggle("opacity-0", !on);
			ui.loading.classList.toggle("pointer-events-none", !on);
		}

		function updatePlayState(isPlaying: boolean): void {
			if (isPlaying) {
				ui.btnPlay.classList.add("bg-[var(--primary)]", "text-white", "hover:brightness-110");
				ui.btnPlay.classList.remove(
					"bg-[var(--btn-regular-bg)]",
					"hover:bg-[var(--btn-regular-bg-hover)]",
					"active:bg-[var(--btn-regular-bg-active)]",
					"text-[var(--primary)]",
				);
				ui.iconPlay.classList.add("hidden");
				ui.iconPause.classList.remove("hidden");
				ui.cover.style.animationPlayState = "running";
				ui.btnPlay.setAttribute("aria-label", i18n(I18nKey.musicPause));
				ui.btnPlay.title = i18n(I18nKey.musicPause);
			} else {
				ui.btnPlay.classList.remove("bg-[var(--primary)]", "text-white", "hover:brightness-110");
				ui.btnPlay.classList.add(
					"bg-[var(--btn-regular-bg)]",
					"hover:bg-[var(--btn-regular-bg-hover)]",
					"active:bg-[var(--btn-regular-bg-active)]",
					"text-[var(--primary)]",
				);
				ui.iconPlay.classList.remove("hidden");
				ui.iconPause.classList.add("hidden");
				ui.cover.style.animationPlayState = "paused";
				ui.btnPlay.setAttribute("aria-label", i18n(I18nKey.musicPlay));
				ui.btnPlay.title = i18n(I18nKey.musicPlay);
			}
		}

		function updateModeUI(playMode: "list" | "one" | "random"): void {
			ui.iconRepeat.classList.toggle("hidden", playMode !== "list");
			ui.iconRepeatOne.classList.toggle("hidden", playMode !== "one");
			ui.iconShuffle.classList.toggle("hidden", playMode !== "random");
			const active = playMode !== "list";
			ui.btnRepeat.className = `btn-repeat p-2 active:scale-95 transition-colors ${active ? "text-[var(--primary)]" : "text-neutral-300 dark:text-neutral-600 hover:text-[var(--primary)]"}`;
		}

		function updateVolumeUI(volume: number, isMuted: boolean): void {
			const pct = isMuted ? 0 : volume * 100;
			ui.volBar.style.width = `${pct}%`;
			ui.volContainer.setAttribute("aria-valuenow", String(Math.round(pct)));
			const silent = isMuted || volume === 0;
			ui.iconVolHigh.classList.toggle("hidden", silent);
			ui.iconVolMute.classList.toggle("hidden", !silent);
		}

		function updateTrackUI(track: { name: string; artist: string; pic?: string } | null): void {
			if (!track) return;
			ui.title.textContent = track.name;
			ui.artist.textContent = track.artist;
			if (track.pic) {
				ui.cover.classList.add("opacity-0");
				ui.cover.src = track.pic;
				ui.cover.alt = `${track.name} - ${track.artist}`;
			} else {
				ui.cover.src = "";
				ui.cover.classList.add("opacity-0");
				ui.cover.alt = i18n(I18nKey.musicNoCover);
			}
			// 重启封面旋转动画
			ui.cover.classList.remove("animate-spin-slow");
			void ui.cover.offsetWidth;
			ui.cover.classList.add("animate-spin-slow");
			ui.cover.style.animationPlayState = "paused";
			// 重置进度
			ui.progressBar.style.width = "0%";
			ui.progressThumb.style.left = "0%";
			ui.progressContainer.setAttribute("aria-valuenow", "0");
			ui.currentTime.textContent = "0:00";
			ui.totalTime.textContent = "0:00";
		}

		function renderPlaylist(playlist: { name: string; artist: string; pic?: string }[], currentIndex: number): void {
			ui.playlistContainer.innerHTML = "";
			const frag = document.createDocumentFragment();
			playlist.forEach((track, idx) => {
				const clone = ui.itemTemplate.content.cloneNode(true) as DocumentFragment;
				const item = clone.querySelector(".playlist-item") as HTMLElement;
				const img = clone.querySelector(".item-cover") as HTMLImageElement;
				const title = clone.querySelector(".item-title") as HTMLElement;
				const artist = clone.querySelector(".item-artist") as HTMLElement;
				img.src = track.pic || "";
				img.alt = `${track.name} - ${track.artist}`;
				title.textContent = track.name;
				artist.textContent = track.artist;
				item.dataset.index = String(idx);
				item.setAttribute("role", "option");
				item.addEventListener("click", () => mgr.playTrackByIndex(idx));
				if (idx === currentIndex) applyActiveStyle(item, true);
				frag.appendChild(clone);
			});
			ui.playlistContainer.appendChild(frag);
			renderedPlaylistLen = playlist.length;
			renderedCurrentIndex = currentIndex;
		}

		function applyActiveStyle(item: HTMLElement, active: boolean): void {
			const overlay = item.querySelector(".item-active-overlay") as HTMLElement;
			const title = item.querySelector(".item-title") as HTMLElement;
			const isPlaying = mgr.getState().isPlaying;
			if (active) {
				item.classList.add("bg-neutral-100", "dark:bg-white/10");
				item.setAttribute("aria-current", "true");
				overlay.classList.remove("hidden");
				overlay.classList.add("flex");
				title.style.color = primaryColor;
				const eqBars = item.querySelector(".eq-bars") as HTMLElement;
				const playIcon = item.querySelector(".eq-play-icon") as HTMLElement;
				if (isPlaying) {
					eqBars.classList.remove("hidden");
					eqBars.classList.add("flex");
					playIcon.classList.add("hidden");
				} else {
					eqBars.classList.add("hidden");
					eqBars.classList.remove("flex");
					playIcon.classList.remove("hidden");
				}
			} else {
				item.classList.remove("bg-neutral-100", "dark:bg-white/10");
				item.removeAttribute("aria-current");
				overlay.classList.add("hidden");
				overlay.classList.remove("flex");
				title.style.color = "";
			}
		}

		function updatePlaylistActive(currentIndex: number): void {
			if (renderedPlaylistLen < 0) return;
			const old = renderedCurrentIndex;
			const oldEl = ui.playlistContainer.querySelector<HTMLElement>(`.playlist-item[data-index="${old}"]`);
			if (oldEl) applyActiveStyle(oldEl, false);
			const newEl = ui.playlistContainer.querySelector<HTMLElement>(`.playlist-item[data-index="${currentIndex}"]`);
			if (newEl) applyActiveStyle(newEl, true);
			renderedCurrentIndex = currentIndex;
		}

		function renderLyrics(lyrics: { time: number; text: string }[]): void {
			ui.lrcContainer.innerHTML = "";
			if (lyrics.length === 0) {
				ui.lrcContainer.innerHTML = `<div class="text-neutral-400 text-sm py-10" role="option">${i18n(I18nKey.musicNoLyrics)}</div>`;
				return;
			}
			lyrics.forEach((line, idx) => {
				const el = document.createElement("div");
				el.className = "lrc-line transition-all duration-300 text-sm text-neutral-400 py-1 cursor-pointer hover:text-[var(--primary)]";
				el.textContent = line.text;
				el.dataset.index = String(idx);
				el.setAttribute("role", "option");
				el.addEventListener("click", () => mgr.seekToTime(line.time));
				ui.lrcContainer.appendChild(el);
			});
		}

		function updateLrcHighlight(index: number): void {
			const lines = ui.lrcContainer.querySelectorAll(".lrc-line");
			lines.forEach((line, i) => {
				if (i === index) {
					line.classList.add("text-[var(--primary)]", "font-bold", "text-base");
					line.classList.remove("text-neutral-400", "text-sm");
				} else {
					line.classList.remove("text-[var(--primary)]", "font-bold", "text-base");
					line.classList.add("text-neutral-400", "text-sm");
				}
			});
			if (index !== -1 && !isUserScrolling) {
				const line = ui.lrcContainer.querySelector<HTMLElement>(`.lrc-line[data-index="${index}"]`);
				if (line) {
					const target = line.offsetTop - ui.lrcContainer.clientHeight / 2 + line.offsetHeight / 2;
					ui.lrcContainer.scrollTo({ top: target, behavior: "smooth" });
				}
			}
		}

		// ── 统一 state → UI 渲染(订阅回调)──
		function render(state: ReturnType<typeof mgr.getState>): void {
			if (!state.initialized) {
				setLoading(true);
				return;
			}
			setLoading(false);
			if (state.playlist.length === 0) {
				ui.title.textContent = state.error || i18n(I18nKey.musicNoSongs);
				return;
			}
			if (state.playlist.length !== renderedPlaylistLen || state.currentIndex !== renderedCurrentIndex) {
				if (state.currentIndex !== renderedCurrentIndex && renderedPlaylistLen === state.playlist.length) {
					// 只是切歌,不重渲列表
					updatePlaylistActive(state.currentIndex);
				} else {
					renderPlaylist(state.playlist, state.currentIndex);
				}
			}
			if (state.track && state.currentIndex !== renderedCurrentIndex) {
				updateTrackUI(state.track);
			}
			updatePlayState(state.isPlaying);
			updateModeUI(state.playMode);
			updateVolumeUI(state.volume, state.isMuted);
			ui.progressBar.style.width = `${state.progress}%`;
			ui.progressThumb.style.left = `${state.progress}%`;
			ui.progressContainer.setAttribute("aria-valuenow", String(Math.round(state.progress)));
			ui.currentTime.textContent = state.currentTimeStr;
			ui.totalTime.textContent = state.durationStr;
			if (state.error) {
				ui.title.textContent = state.error;
			}
		}

		// ── 按钮绑定 ──
		ui.btnPlay.addEventListener("click", () => mgr.togglePlay());
		ui.btnNext.addEventListener("click", () => mgr.playNext());
		ui.btnPrev.addEventListener("click", () => mgr.playPrev());
		ui.btnRepeat.addEventListener("click", () => mgr.cyclePlayMode());
		ui.btnMute.addEventListener("click", () => mgr.toggleMute());
		ui.volContainer.addEventListener("click", (e) => {
			const rect = ui.volContainer.getBoundingClientRect();
			mgr.setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
		});
		ui.progressContainer.addEventListener("click", (e) => {
			const rect = ui.progressContainer.getBoundingClientRect();
			mgr.seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
		});

		// ── 抽屉开关 ──
		ui.btnLrc.addEventListener("click", () => {
			const open = ui.lrcDrawer.style.gridTemplateRows === "1fr";
			if (open) {
				ui.lrcDrawer.style.gridTemplateRows = "0fr";
				ui.lrcDrawer.classList.replace("opacity-100", "opacity-0");
				ui.iconLrcOn.classList.add("hidden");
				ui.iconLrcOff.classList.remove("hidden");
			} else {
				ui.playlistDrawer.style.gridTemplateRows = "0fr";
				ui.playlistDrawer.classList.replace("opacity-100", "opacity-0");
				ui.lrcDrawer.style.gridTemplateRows = "1fr";
				ui.lrcDrawer.classList.replace("opacity-0", "opacity-100");
				ui.iconLrcOn.classList.remove("hidden");
				ui.iconLrcOff.classList.add("hidden");
			}
		});
		ui.btnDrawer.addEventListener("click", () => {
			const open = ui.playlistDrawer.style.gridTemplateRows === "1fr";
			if (open) {
				ui.playlistDrawer.style.gridTemplateRows = "0fr";
				ui.playlistDrawer.classList.replace("opacity-100", "opacity-0");
			} else {
				ui.lrcDrawer.style.gridTemplateRows = "0fr";
				ui.lrcDrawer.classList.replace("opacity-100", "opacity-0");
				ui.playlistDrawer.style.gridTemplateRows = "1fr";
				ui.playlistDrawer.classList.replace("opacity-0", "opacity-100");
			}
		});

		// ── 歌词用户滚动检测 ──
		function resetScrollTimeout(): void {
			if (scrollTimeout) clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				isUserScrolling = false;
				const idx = mgr.getState().currentLrcIndex;
				if (idx >= 0) {
					const line = ui.lrcContainer.querySelector<HTMLElement>(`.lrc-line[data-index="${idx}"]`);
					if (line) {
						const target = line.offsetTop - ui.lrcContainer.clientHeight / 2 + line.offsetHeight / 2;
						ui.lrcContainer.scrollTo({ top: target, behavior: "auto" });
					}
				}
			}, 3000);
		}
		ui.lrcContainer.addEventListener("wheel", () => {
			isUserScrolling = true;
			resetScrollTimeout();
		});
		ui.lrcContainer.addEventListener("touchstart", () => {
			isUserScrolling = true;
			resetScrollTimeout();
		});

		// ── 封面图事件 ──
		ui.cover.addEventListener("load", () => ui.cover.classList.remove("opacity-0"));
		ui.cover.addEventListener("error", () => ui.cover.classList.add("opacity-0"));

		// ── 订阅 manager + 首次渲染 ──
		const unsub = mgr.subscribe((state) => {
			render(state);
			// 歌词增量更新(track 变了才重渲歌词)
			if (state.lyrics.length !== ui.lrcContainer.querySelectorAll(".lrc-line").length && state.lyrics.length >= 0) {
				const hasPlaceholder = ui.lrcContainer.querySelector(".lrc-line") === null;
				if (hasPlaceholder || state.lyrics.length === 0) renderLyrics(state.lyrics);
			}
			updateLrcHighlight(state.currentLrcIndex);
		});
		render(mgr.getState());
		renderLyrics(mgr.getState().lyrics);
		updateLrcHighlight(mgr.getState().currentLrcIndex);

		// SideBar 不被 Swup 替换,无需 cleanup;但保留 unsub 引用以备将来
		(widget as unknown as { __musicUnsub?: () => void }).__musicUnsub = unsub;
	}

	// 初始化页面上所有 music-player-widget(SideBar 里一个)
	function initAll(): void {
		document.querySelectorAll<HTMLElement>(".music-player-widget").forEach((w) => {
			if (!(w as unknown as { __musicSetup?: boolean }).__musicSetup) {
				(w as unknown as { __musicSetup?: boolean }).__musicSetup = true;
				setupWidget(w);
			}
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initAll);
	} else {
		initAll();
	}
</script>
```

> 相对 Firefly 的转换:删 `window.__fireflyMusic` + `fm:*` CustomEvent → `import { initMusicManager }` + `mgr.subscribe`;删虚拟滚动(`vs*` 函数)→ `renderPlaylist` 直接 `forEach` + 文档流;删 `MutationObserver` cleanup(SideBar 不被 Swup 替换);i18n 直接 `import` 用,不经 `JSON.stringify`;`updateModeUI` 用 `className` 模板拼接(Tailwind 3 完整类名)。

- [ ] **Step 2: 类型检查**

Run: `pnpm check`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add src/features/music/MusicPlayer.astro
git commit -m "feat(music): wire MusicPlayer script to manager via subscribe"
```

---

## Task 9: Music.astro 薄壳 + features/music/README.md

**Files:**
- Create: `src/components/widget/Music.astro`
- Create: `src/features/music/README.md`

- [ ] **Step 1: 创建 Music.astro 薄壳**

Create `src/components/widget/Music.astro`:
```astro
---
import WidgetLayout from "@/components/common/WidgetLayout.astro";
import MusicPlayer from "@/features/music/MusicPlayer.astro";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";

interface Props {
	id?: string;
}
const { id } = Astro.props;
---

<WidgetLayout id={id ? `${id}-layout` : "music-layout"} name={i18n(I18nKey.music)}>
	<MusicPlayer id={id} />
</WidgetLayout>
```

- [ ] **Step 2: 创建 features/music/README.md**

Create `src/features/music/README.md`:
```markdown
# 🎵 Music 音乐播放器

跨端全局音乐播放功能(桌面 + 移动都在侧栏)。

## 文件

- `manager.ts` — **逻辑单例**:`initMusicManager()` 创建唯一 `<audio>` 挂 `document.body`、持有播放 state、暴露控制方法。Swup 切页不销毁(audio 在 body、不在 swup-container 内)。纯函数 `parseLRC`/`formatTime`/`computeNextIndex` 有单元测试。
- `MusicPlayer.astro` — **UI 视图控制器**:纯 UI,通过 `mgr.subscribe()` 订阅状态刷新画面,点击转发给 manager。位置无关(目前由 `widget/Music.astro` 装进侧栏)。

## 架构要点

Manager / View 分离是 Swup 无刷新切页不断音的**硬要求**:
- audio 挂 `document.body`(Swup 不替换)
- manager 是 ES module 级单例
- view 在 SideBar(`<main>` 兄弟,Swup 不替换)

## 配置

歌单、默认音量/模式在 `src/config/music.ts`;音频文件放 `public/assets/music/`。
详见 `docs/superpowers/specs/2026-06-14-music-player-design.md`。
```

- [ ] **Step 3: 类型检查**

Run: `pnpm check`
Expected: 通过。

- [ ] **Step 4: Commit**

```bash
git add src/components/widget/Music.astro src/features/music/README.md
git commit -m "feat(music): add Music sidebar widget shell + feature README"
```

---

## Task 10: 集成(Layout init + SideBar 引入)

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/widget/SideBar.astro`

- [ ] **Step 1: Layout.astro 全局 script 里 init manager**

读 `src/layouts/Layout.astro` 第 246-264 行附近的 `<script>`(含 `import { initElasticHeader }`)。

在该 script 顶部的 import 区(L263 `import { initElasticHeader } ...` 附近)加:
```ts
import { initMusicManager } from "../features/music/manager";
import { musicConfig } from "../config";
```

然后在 `init()` 函数体内(L417-424,`loadTheme()` 等之后、`initElastic()` 之前或之后)加:
```ts
	if (musicConfig.enable) {
		initMusicManager(musicConfig);
	}
```

- [ ] **Step 2: SideBar.astro 引入 Music(sticky 区顶部,Categories 之前)**

读 `src/components/widget/SideBar.astro`。在 `#sidebar-sticky` div 内、`<Categories>` 之前加 `<Music />`:

把这段:
```astro
    <div id="sidebar-sticky" class="transition-all duration-700 flex flex-col w-full gap-4 top-4 sticky top-4">
        <Categories class="onload-animation" style="animation-delay: 150ms"></Categories>
        <Tag class="onload-animation" style="animation-delay: 200ms"></Tag>
    </div>
```
改为:
```astro
    <div id="sidebar-sticky" class="transition-all duration-700 flex flex-col w-full gap-4 top-4 sticky top-4">
        <Music class="onload-animation" style="animation-delay: 100ms"></Music>
        <Categories class="onload-animation" style="animation-delay: 150ms"></Categories>
        <Tag class="onload-animation" style="animation-delay: 200ms"></Tag>
    </div>
```

并在 SideBar.astro 的 frontmatter import 区(顶部 `---` 内)加:
```astro
import Music from "./Music.astro";
import { musicConfig } from "@/config";
```
并用 enable 守卫包裹(只有 enable 时渲染):
```astro
        {musicConfig.enable && <Music class="onload-animation" style="animation-delay: 100ms"></Music>}
```

- [ ] **Step 3: 类型检查 + 构建**

Run: `pnpm check`
Expected: 通过。

Run: `pnpm build`
Expected: 构建成功(可能 pagefind 警告,忽略)。若构建失败,看错误修复。

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro src/components/widget/SideBar.astro
git commit -m "feat(music): integrate player into Layout (init) and SideBar"
```

---

## Task 11: 端到端验证

**Files:** 无(验证 + 必要修复)

- [ ] **Step 1: 准备一首真实测试歌曲**

把一首 mp3 放到 `public/assets/music/example.mp3`(对应 Task 3 的占位 url)。
若有封面 jpg 和歌词 lrc,也放同目录,并在 `src/config/music.ts` 更新该歌的 `cover`/`lrc` 字段。

- [ ] **Step 2: 启动 dev 服务器**

Run: `pnpm dev`
Expected: 启动成功(默认 http://localhost:4321)。

- [ ] **Step 3: 逐项验证(对照 spec 第 9 节)**

打开浏览器,验证:
1. 侧栏第二个栏位出现"音乐"卡片(Profile 正下方、Categories 上方)
2. 点播放 → 有声 / 进度走 / 封面旋转 / 均衡器动
3. **播放中点导航切到另一页 → 音乐继续、播放器仍在、控件有效**(最关键)
4. 点进度条跳转、点音量条调音量
5. 循环模式按钮三态切换(列表/单曲/随机图标变化)
6. 歌词抽屉:点歌词图标展开,当前行高亮、自动滚动;手动滚歌词暂停自动滚 3s 后恢复
7. 播放列表抽屉:点列表图标展开,点歌切歌,当前项高亮 + 均衡器
8. 窄屏(<1024px,DevTools 切移动端)布局正常、可操作
9. 刷新页面 → 音量/模式保留(localStorage)
10. 临时把 `config/music.ts` 的某首 `url` 改错 → 显示错误,不崩;改回
11. 临时把 `enable: false` → 侧栏无播放器;改回 `true`

- [ ] **Step 4: 跑 format + lint + check 收尾**

Run: `pnpm format && pnpm lint && pnpm check && pnpm test`
Expected: 全部通过。

- [ ] **Step 5: 修复发现的问题(如有),commit**

若验证中发现 bug,修复后:
```bash
git add -A
git commit -m "fix(music): <具体问题>"
```
若一切正常,无需额外 commit。

- [ ] **Step 6: 最终构建确认**

Run: `pnpm build`
Expected: 构建成功,dist/ 生成。

---

## Self-Review 记录

执行完计划前,实施者应对照 spec 自查:

1. **Spec 覆盖**:
   - 本地音频 ✓(Task 3 + 11)
   - 侧栏第 2 栏位 ✓(Task 10)
   - 接近完整功能 ✓(Task 7-8:封面/进度/控制/循环/歌词/音量/列表/均衡器)
   - 方案 A TS ✓(Task 4-5 manager.ts + Task 8 模块化 script)
   - subscribe 通信 ✓(Task 5 subscribe + Task 8 mgr.subscribe)
   - 砍虚拟滚动 ✓(Task 8 renderPlaylist 用 forEach)
   - i18n 18 key ✓(Task 6)
   - Swup 不断音 ✓(Task 5 audio 挂 body + Task 10 Layout init;SideBar 不被替换)
   - enable 守卫 ✓(Task 10)

2. **类型一致性**:`MusicManager` 方法名(`togglePlay`/`playNext`/`playPrev`/`playTrackByIndex`/`cyclePlayMode`/`setVolume`/`toggleMute`/`seek`/`seekToTime`/`subscribe`/`getState`)在 Task 5 定义,Task 8 调用,名称一致 ✓。`MusicState` 字段(`playlist`/`currentIndex`/`isPlaying`/`playMode`/`volume`/`isMuted`/`lyrics`/`currentLrcIndex`/`progress`/`currentTimeStr`/`durationStr`/`track`/`initialized`/`error`)Task 5 定义,Task 8 读取,一致 ✓。

3. **已知简化点**(实施者注意):
   - Task 8 的 `render` 里歌词增量更新逻辑较粗(用 lrc-line 数量判断),若歌词行内容相同但重新解析会少更新。验证时确认歌词显示正常即可,必要时细化。
   - `updateModeUI` 用 `className` 全量替换(含 `btn-repeat` 前缀),确保 Tailwind 3 能识别完整类名。
