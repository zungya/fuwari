# 音乐播放器(Music Player)设计文档

- 日期:2026-06-14
- 状态:设计已确认,待编写实现计划
- 参考:Firefly 项目的 Manager + UI 视图控制器分离架构

## 1. 背景与目标

为 fuwari 博客(Astro 5 + Svelte 5 + Tailwind 3 + Swup)增加一个**侧边栏音乐播放器**。参考 Firefly 项目的"Manager 单例 + UI 视图控制器"分离架构,但用 fuwari 原生的 **TypeScript 模块化**风格实现(而非 Firefly 的 inline 脚本)。

**核心约束**:Swup 无刷新切页时,音乐必须**持续播放**、控件**持续有效**。这一约束决定了 Manager / View 必须分离——它不是可选的架构美化,而是技术上的硬要求。

## 2. 决策摘要

| 维度 | 决策 |
|------|------|
| 音乐来源 | **本地音频文件**(自托管 mp3,放 `public/assets/music/`) |
| 放置位置 | **侧边栏第 2 个栏位**:Profile 正下方、Categories 上方(SideBar sticky 区顶部) |
| 功能范围 | **接近完整**:封面 / 标题歌手 / 进度+时间 / 播放暂停 / 上下首 / 循环模式(列表·单曲·随机)/ 歌词抽屉 / 音量滑条+静音 / 播放列表抽屉 / 均衡器动画 |
| 代码组织 | **方案 A**:manager 进 `.ts` 模块、view 用模块化 TS `<script>`(对齐 fuwari 现有 `elastic-header.ts` 模式) |
| view↔manager 通信 | **直接 import + `subscribe`/`unsubscribe` 回调**(不用 `window` 全局、不用 `CustomEvent`) |
| 虚拟滚动 | **砍掉**(本地几十首无收益) |
| i18n | 18 个 key,**先 zh_CN + en 完整翻译,其余 8 语言用 en 占位 + TODO** |

**范围外(本期不做)**:
- Meting 在线歌单(架构上不冲突,以后可加;`MusicConfig` 预留扩展空间)
- 浮动播放器 / 文章页内嵌(位置无关的 view 设计已为此预留)
- 虚拟滚动(歌单长到几百首时再独立加回)

## 3. 架构

### 三层结构(与 Firefly 对齐,实现风格不同)

| 文件 | 职责 | 新建/改 |
|------|------|---------|
| `src/features/music/manager.ts` | **逻辑单例**:`initMusicManager()` 创建唯一 `<audio>` 挂 `document.body`、持有全部 state、暴露方法。ES module 级单例 | 新建 |
| `src/features/music/MusicPlayer.astro` | **UI 视图控制器**:渲染播放器 UI(模块化 TS `<script>`)、转发点击、订阅 state 刷新画面。位置无关 | 新建 |
| `src/features/music/README.md` | 说明(对齐 components/README 风格) | 新建 |
| `src/components/widget/Music.astro` | **侧边栏薄壳**:用 fuwari 的 `WidgetLayout` 包 `<MusicPlayer />` | 新建 |
| `src/config/music.ts` | `musicConfig`:歌单 + 默认参数 | 新建 |
| `src/types/config.ts` | 加 `MusicConfig` / `MusicSong` / `PlayMode` 类型 | 改 |
| `src/config/index.ts` | re-export `musicConfig` | 改 |
| `src/i18n/i18nKey.ts` + `languages/*.ts` | 加 18 个 `music*` key | 改 |
| `src/components/widget/SideBar.astro` | Profile 正下方、Categories 上方引入 `<Music />` | 改 |
| `src/layouts/Layout.astro` | 全局 `<script>` 里 init manager | 改 |

### 职责边界(回应"视图控制器是干嘛的")

- **`manager.ts`**:不渲染任何 UI、不依赖任何 DOM 节点存在。只管 audio 元素 + 播放逻辑(加载歌单、解析 LRC、播/暂停/上下首/循环/音量/进度)。被 Layout 全局 init 一次。
- **`MusicPlayer.astro`**:纯 UI + 转发。点播放 → `mgr.togglePlay()`;manager 状态变 → 通过 `subscribe` 回调刷新画面(进度条、歌词高亮、封面旋转、均衡器)。
- **`Music.astro`**:`<WidgetLayout name={i18n(I18nKey.music)}><MusicPlayer /></WidgetLayout>`,十几行的侧栏适配壳。

### 目录归属依据
- manager + view 放 `features/music/`:architecture.md 明确 `features/` 预留"音乐栏";manager 和它的专属 view 是天生一对,放一起概念统一。
- `Music.astro`(壳)放 `widget/`:符合 fuwari "侧边栏小部件"约定,保持 widget 目录纯粹。

## 4. 数据流与 Swup 不断音

### 4.1 三层独立保证(为什么切页一定不断音)

Swup 配置(`astro.config.mjs`):`containers: ["main", "#toc"]` —— 切页只替换 `<main id="swup-container">` 和 `#toc` 的内容。

| 层 | 存活原因 |
|----|---------|
| **audio 元素** | 挂 `document.body`,不在任何 Swup container 内 → 永不替换 |
| **manager 逻辑** | ES module 级单例:模块只加载一次,模块级变量天然单例;`initMusicManager()` 内 `if (manager) return` 双重保险 |
| **view DOM** | SideBar 是 `<main>` 的兄弟节点(MainGridLayout 结构),Swup 不替换 → view 挂一次、永久有效,**无需重挂载/cleanup** |

→ 三层**互相独立**:audio 不靠 view 存活,逻辑不靠 UI 存活,UI 不靠 audio 存活。这是 Manager/View 分离的根本原因。

### 4.2 启动时序

1. 首次加载 → Layout body 渲染(SideBar 含 MusicPlayer view)
2. Layout 全局 `<script>` → `initMusicManager(musicConfig)` → audio 挂 body + 加载本地歌单(同步)
3. view 模块化 `<script>` → 查 DOM、绑按钮、`subscribe(updateUI)`、sync 当前 state

**时序竞争处理**:view script 第一行主动调 `initMusicManager()`(幂等),无论 manager/view 谁先执行,manager 都就绪。view 不依赖 Layout 的执行顺序。

### 4.3 数据流

```
用户点播放按钮 (view)
  └→ mgr.togglePlay() → audio.play() + state.isPlaying=true
      └→ notify(subscribers) → view: 换图标 / 封面旋转 / 均衡器

audio 'timeupdate' (~250ms)
  └→ mgr 算 progress/currentTime → notify → view: 进度条 / 时间

audio 'ended' 或点下一首
  └→ mgr 按 playMode 选下一首 → loadTrack+play → state 全更新
      └→ notify → view: 封面/标题/歌词重渲 / 列表高亮

loadTrack 时: mgr fetch+解析本地 lrc → state.lyrics[]
timeupdate 时: mgr 算 currentLrcIndex → notify → view: 高亮+自动滚动
```

### 4.4 通信机制(替换 Firefly 的 `window.__fireflyMusic` + `CustomEvent`)

```ts
// manager.ts
type Listener = (s: MusicState) => void;
class MusicManager {
  private listeners = new Set<Listener>();
  subscribe(fn: Listener): () => void {            // 返回 unsubscribe
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() { for (const fn of this.listeners) fn(this.state); }
}

// MusicPlayer.astro <script>
const mgr = initMusicManager(musicConfig);
const unsub = mgr.subscribe(updateUI);   // 类型安全
updateUI(mgr.getState());                 // 首次 sync
```

类型安全、无 `window` 污染、`subscribe` 返回 `unsubscribe`(SideBar 虽不被替换用不上,但留着以备浮动条等场景)。

### 4.5 跨刷新持久化
`volume`、`playMode` 存 localStorage(`music-player-volume` / `music-player-mode`),manager 内部处理。

## 5. 配置

### 5.1 类型定义(加进 `src/types/config.ts`)

```ts
export type PlayMode = 'list' | 'one' | 'random';   // 列表循环 / 单曲循环 / 随机

export interface MusicSong {
  name: string;
  artist: string;
  url: string;        // 音频路径,放 public/assets/music/ 下
  cover?: string;     // 封面(可选,无则显示默认音符图标)
  lrc?: string;       // .lrc 歌词文件路径(可选)
}

export interface MusicConfig {
  enable: boolean;            // 总开关,false 时 SideBar 不渲染、manager 不 init
  songs: MusicSong[];         // 本地歌单
  defaultVolume?: number;     // 0–1,默认 0.7
  defaultPlayMode?: PlayMode; // 默认 'list'
  showLyrics?: boolean;       // 是否显示歌词切换按钮,默认 true
}
```

### 5.2 `config/music.ts` 示例

```ts
import type { MusicConfig } from "../types/config";

export const musicConfig: MusicConfig = {
  enable: true,
  songs: [
    {
      name: "起风了",
      artist: "买辣椒也用券",
      url: "/assets/music/qifengle.mp3",
      cover: "/assets/music/qifengle.jpg",
      lrc: "/assets/music/qifengle.lrc",
    },
    {
      name: "纯音频示例",
      artist: "未知",
      url: "/assets/music/sample.mp3",
      // 无 cover / lrc → 自动 fallback 到默认图标、无歌词
    },
  ],
  defaultVolume: 0.7,
  defaultPlayMode: "list",
  showLyrics: true,
};
```

`config/index.ts` 加:`export { musicConfig } from "./music";`

### 5.3 本地音频准备

```
public/assets/music/
  qifengle.mp3      ← 音频(必须)
  qifengle.jpg      ← 封面(可选)
  qifengle.lrc      ← 歌词(可选)
```

四步:放文件 → `config/music.ts` 登记 → 构建时 `public/` 原样拷到 dist → 路径 `/assets/music/xxx` 直接可用。

**路径处理**:`songs[].url` 等是字符串,manager 运行时用 fuwari 的 `url()`(`utils/url-utils.ts`)包裹,兼容 base path(config 保持纯数据)。
**歌词解析**:`lrc` 统一是 `.lrc` 文件路径,manager fetch 文本 + `parseLRC()` 解析,支持 `[mm:ss.xx]` / `[mm:ss.xxx]` 两种精度。

### 5.4 注意事项:仓库体积
mp3 直接进 git 仓库 + Cloudflare Pages 构建。一首 3–8MB,初期建议 **5–10 首足够**(个人博客背景乐,不是曲库)。歌单变大后再考虑外部对象存储(范围外)。

## 6. view 改动(相对 Firefly 的 MusicPlayer.astro)

UI 视觉照搬 Firefly(封面+信息行 / 细进度条 / 控制行 / 歌词抽屉 / 播放列表抽屉 / 加载遮罩)。三处实质改动:

1. **Tailwind 4 → 3 语法**(机械批量替换):全文件 `bg-(--x)` → `bg-[var(--x)]`、`text-(--primary)` → `text-[var(--primary)]`。所需 CSS 变量(`--primary` / `--btn-regular-bg` / `--btn-regular-bg-hover` / `--btn-regular-bg-active` / `--btn-content`)fuwari **全有**(`src/styles/variables.styl`),零新增。

2. **砍掉虚拟滚动**:删 `vsCommitRange` / `vsRequestUpdate` / `vsSetContainerHeight` / `vsApplyActiveStyle` / `vsCreateItemEl` / `ITEM_H` / `OVERSCAN` / `renderedEls` 映射 / absolute 定位 / scroll RAF 节流。`renderPlaylist` 改成 `forEach` 创建全部项、`updatePlaylistActiveUI` 按 `data-index` 直接查询。播放列表项走正常文档流。**高度由 `max-h-48` + `overflow-y-auto` 固定在 192px 滚动**(不管多少首),与是否虚拟滚动无关。

3. **inline → TS + subscribe**:
   - `<script is:inline define:vars={{ viewConfigStr, widgetId }}>` → 模块化 `<script lang="ts">`
   - `var mgr = window.__fireflyMusic` + `window.addEventListener('fm:*', ...)` → `import { initMusicManager } from '../../features/music/manager'` + `mgr.subscribe(cb)`
   - i18n 从 `JSON.stringify` 注入 → 直接 `import { i18n } from '@/i18n/translation'` 在 TS 用
   - 删 `MutationObserver` cleanup(SideBar 不被 Swup 替换,view 无需重挂载)

### 6.1 移动端 + sticky 权衡
- SideBar 移动端单列堆叠(`col-span-2`),播放器宽度自适应、可用。
- **可接受的权衡**:桌面端播放器在 sticky 侧栏里,展开歌词(192px)/列表抽屉会让 sticky 块变高,极端情况 sticky 退化(随页滚)。默认收起不受影响、展开是临时行为。移动端不 sticky,无此问题。

## 7. i18n

### 18 个新 key
`music` / `musicNoPlaying` / `musicCover` / `musicLyrics` / `musicNoLyrics` / `musicLoadingLyrics` / `musicFailedLyrics` / `musicNoSongs` / `musicError` / `musicPlay` / `musicPause` / `musicVolume` / `musicPlayMode` / `musicPrev` / `musicNext` / `musicPlaylist` / `musicProgress` / `musicNoCover`

### 策略(因 fuwari 无 key 级 fallback)
fuwari 的 `translation.ts`:`map[lang] || en` 只在**整语言缺失**时回退;类型 `Translation = { [K in I18nKey]: string }` **强制每个语言对象必须含全部 key**,否则 `pnpm check` 报错 + 运行时显示 undefined。

→ 必须在 10 语言文件(en/es/id/ja/ko/th/tr/vi/zh_CN/zh_TW)都加齐 18 个 key。
- `zh_CN` + `en`:认真翻译
- 其余 8 语言:先复制 `en` 值占位,行尾标 `// TODO: translate`,后续再补

## 8. 集成点

```astro
<!-- src/components/widget/SideBar.astro(Profile 正下方、Categories 上方 = sticky 区顶部) -->
{musicConfig.enable && <Music class="onload-animation" style="animation-delay: 100ms" />}
```

```ts
// src/layouts/Layout.astro 全局 <script>(对齐 initElasticHeader 模式)
import { initMusicManager } from "../features/music/manager";
import { musicConfig } from "../config";
if (musicConfig.enable) {
  initMusicManager(musicConfig);
}
```

## 9. 验证清单(`pnpm dev` 手动)

1. 点播放 → 有声 / 进度走 / 封面旋转 / 均衡器动
2. **播放中切页(点导航)→ 音乐不断、播放器仍在侧栏、控件仍有效**(最关键)
3. 点击进度条跳转、点击音量条调音量
4. 循环模式三态切换(列表 / 单曲 / 随机),单曲循环到结尾重播
5. 歌词抽屉:当前行高亮、自动滚动、用户滚动暂停自动滚 3s
6. 播放列表抽屉:点击切歌、当前曲目高亮 + 均衡器
7. 窄屏(<lg)布局正常、可操作
8. 刷新页面后音量 / 模式保留(localStorage)
9. 音频 url 错误 → 显示错误信息,不崩
10. `enable: false` → 侧栏无播放器、无 audio 元素

## 10. 关键文件参考

- `src/layouts/Layout.astro:263,423` — `initElasticHeader()` 调用模式(manager init 对齐)
- `src/components/desktop/elastic-banner/elastic-header.ts` — 全局逻辑 .ts 模块的范例
- `src/components/common/WidgetLayout.astro` — view 外壳(注意 fuwari 版比 Firefly 简化,无 moreUrl/contentPadding)
- `src/components/widget/SideBar.astro` — 集成位置
- `src/i18n/translation.ts` — i18n fallback 机制
- `src/styles/variables.styl:30-34` — 按钮变量定义
- `astro.config.mjs:41` — Swup containers 配置(不断音的事实基础)
