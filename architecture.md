# 项目架构 (Architecture)

> **本文件是新对话了解项目的入口。** 根目录的 `README.md` 是上游 Fuwari 模板的，部分内容已过时——以本文件为准。
> 最后更新：2026-06，对应架构重构后状态。

## 概述

基于 [Fuwari](https://github.com/saicaca/fuwari)（Astro 博客模板）的二次开发个人博客。

**技术栈**：
- **Astro 5**（SSG 静态生成）
- **Svelte 5**（客户端交互组件）
- **Tailwind CSS 3**（样式，默认断点 `md=768`/`lg=1024`）
- **Swup**（无刷新页面切换，`visit:start`/`visit:end` 生命周期）
- **OverlayScrollbars**（自定义滚动条，macOS 下退化为原生）
- **Pagefind**（静态搜索索引，build 时生成）
- **astro-icon**（Iconify 图标）

**部署**：push 到 GitHub → Cloudflare Pages 自动构建。

## 常用命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动开发服务器（默认 :4321） |
| `pnpm build` | 构建（`astro build` + `pagefind` 索引） |
| `pnpm check` | Astro 类型检查 |
| `pnpm new-post` | 新建文章（`scripts/new-post.js`） |
| `pnpm format` / `pnpm lint` | Biome 格式化 / 检查 |

> 包管理器锁定 **pnpm**（`preinstall` 强制）。

## 目录结构

```
src/
├── assets/images/        # 图片资源（banner4-6.png, avatar.png）
├── components/           # 组件，按职责分类（详见 components/README.md）
│   ├── common/           # 通用可复用 UI（ButtonLink, ImageWrapper, Markdown, Pagination, WidgetLayout...）
│   ├── controls/         # 交互控件（BackToTop, DisplaySettings, LightDarkSwitch, Search）
│   ├── layout/           # 页面结构（Navbar, Footer, PostCard, PostPage, PostMeta, ArchivePanel, NavMenuPanel, ConfigCarrier）
│   ├── widget/           # 侧边栏小部件（SideBar, Categories, Tags, Profile, TOC, Music）
│   ├── misc/             # 杂项（License）
│   ├── desktop/          # 桌面端独有（移动端不加载）— elastic-banner/
│   └── mobile/           # 移动端独有（桌面端不加载）— 预留
├── config/               # 配置，每领域一文件（详见 config/README.md）
│   ├── site.ts           # 站点：标题/语言/主题色/banner(双图)/toc/favicon
│   ├── navbar.ts         # 导航栏链接
│   ├── profile.ts        # 个人资料/社交链接
│   ├── license.ts        # 文章许可证
│   ├── expressive-code.ts# 代码块主题
│   ├── desktop.ts        # 桌面端独有配置（弹性 banner 参数）
│   ├── mobile.ts         # 移动端独有配置（预留）
│   ├── music.ts          # 音乐播放器配置（歌单/模式/音量）
│   └── index.ts          # barrel，统一 re-export
├── constants/            # 常量：constants.ts(布局数值) / icon.ts(默认favicon) / link-presets.ts(导航预设)
├── content/              # 文章 Markdown（posts/, spec/about.md）
├── features/             # 跨端全局特效（已实现：音乐播放器 music/；预留：粒子）— 详见 features/README.md
├── i18n/                 # 国际化：i18nKey.ts / translation.ts / languages/(10 种语言)
├── layouts/
│   ├── Layout.astro      # 全局布局 + 大量 CSS + Swup/弹性效果集成脚本
│   └── MainGridLayout.astro # 主网格结构（侧边栏 + 主内容 + TOC 布局）
├── pages/                # 路由：[...page](首页分页) / archive / about / posts/[...slug] / rss.xml / robots.txt
├── plugins/              # Markdown/rehype/remark 插件（admonition, github-card, reading-time...）
├── styles/               # 样式：main.css / markdown.css / transition.css / scrollbar.css...
├── types/config.ts       # 配置类型定义（含 DesktopConfig/MobileConfig/ElasticBannerConfig）
└── utils/                # 工具函数
    ├── content-utils.ts  # 文章/标签/分类获取与排序
    ├── date-utils.ts     # 日期格式化
    ├── device.ts         # 视口判断：isMobileViewport()/isDesktopViewport() + 断点常量
    ├── setting-utils.ts  # 主题色/明暗模式（localStorage）
    └── url-utils.ts      # URL 生成与路径处理
```

## 核心架构约定

### 1. 平台分离（desktop / mobile / features）

| 场景 | 放哪 |
|------|------|
| 两端都有，只是布局不同 | 组件内 Tailwind 断点（`md:`/`lg:`） |
| **桌面端独有**（移动端不渲染） | `components/desktop/` + 配置 `config/desktop.ts` |
| **移动端独有**（桌面端不渲染） | `components/mobile/` + 配置 `config/mobile.ts` |
| 两端都有的全局特效（音乐播放器、粒子） | `features/`（顶层，跨端） |

**判断口诀**：*关掉它页面还完整吗？* 否 → 结构/交互组件（必需）；是 → 增强型，再看两端是否都有来定 `desktop/`/`mobile/`/`features/`。

平台组件入口用 `isMobileViewport()`/`isDesktopViewport()`（`utils/device.ts`）自我屏蔽，调用方无需关心设备。

### 2. 配置 config 化

- 所有可调参数集中在 `config/`，不在源码里 hardcode。
- 通过 `@/config` 或 `../config` 导入（barrel 自动转发）。
- 桌面/移动独有组件的参数 → `config/desktop.ts` / `config/mobile.ts`。

### 3. 响应式断点

- CSS 层：Tailwind 默认 `md=768`/`lg=1024`（`tailwind.config.cjs` 未自定义）。
- JS 层：`utils/device.ts` 同值常量，集中判断。
- 移动端布局骨架在 `MainGridLayout.astro`（`lg:` 切换侧边栏/主内容/footer/TOC）；移动端全局样式（banner 高度等）在 `Layout.astro` 的 `@media (max-width:767px)` 块。

## 自定义功能现状

### 弹性 Banner（桌面端独有）
鼠标滚轮下拉时 banner 弹性展开，松手回弹。逻辑在 `components/desktop/elastic-banner/elastic-header.ts`，全部参数在 `config/desktop.ts`（`elasticBanner` 字段）。移动端不启用（静态 banner）。

**预留**：banner 拉到最顶后展开显示的"画布内容"，计划作为同目录 `BannerCanvas.astro` 加入。

### Banner 双图
桌面/移动用不同 banner 图，在 `config/site.ts` 的 `banner.src`（桌面）/`banner.mobileSrc`（移动），由 `common/ImageWrapper.astro` 渲染双图 + CSS media query 切换。

### Swup 页面切换
`Layout.astro` 的 `<script>` 管理生命周期：`visit:start` 锁内容高度防抖、`visit:end` 释放、重新初始化弹性效果。`#swup-container` 是切换容器。

### 音乐播放器（侧边栏，跨端）
本地音频 + Meting 在线歌单（`mode` 切换）的侧边栏播放器。**Manager/View 分离**保证 Swup 切页不断音：
- **逻辑层** `features/music/manager.ts` — 单例，唯一 `<audio>` 挂 `document.body`（Swup 不替换）+ ES module 级单例；纯函数 `parseLRC`/`formatTime`/`computeNextIndex`/`buildMetingUrl` 有 vitest 单元测试。
- **UI 视图层** `features/music/MusicPlayer.astro` — 模块化 TS `<script>`，`subscribe` 订阅 manager 状态刷新画面。
- **侧边栏壳** `components/widget/Music.astro` — 用 `WidgetLayout` 包 MusicPlayer。

参数（歌单/模式/音量/歌词开关）在 `config/music.ts`，音频放 `public/assets/music/`。Swup 不断音是 Manager/View 分离的硬要求，详见 `docs/superpowers/specs/2026-06-14-music-player-design.md`。

## 开发指南（常见任务速查）

| 任务 | 去哪改 |
|------|--------|
| 改站点标题/语言/banner 图 | `config/site.ts` |
| 改导航栏链接 | `config/navbar.ts` |
| 改个人资料/社交链接 | `config/profile.ts` |
| 调弹性 banner 手感（阻力/速度/拉伸） | `config/desktop.ts` → `elasticBanner` |
| 改音乐播放器（歌单/模式/音量/歌词） | `config/music.ts` |
| 改移动端 banner 高度/样式 | `layouts/Layout.astro` 的 `@media (max-width:767px)` |
| 改整体布局结构（侧边栏/网格） | `layouts/MainGridLayout.astro` |
| 加新配置 | `types/config.ts` 定义类型 → `config/<name>.ts` → `config/index.ts` re-export |
| 加新通用组件 | `components/` 对应分类目录（看 `components/README.md`） |
| 加桌面端独有特效 | `components/desktop/<name>/`，入口 `isMobileViewport()` guard |
| 加跨端全局特效（粒子等） | `features/<name>/` |
| 加新文章 | `pnpm new-post` 或直接写 `content/posts/` |
| 改明暗模式/主题色逻辑 | `utils/setting-utils.ts` |

## 关键文件

- `layouts/Layout.astro` — 全局布局、CSS、Swup + 弹性效果集成（最大的文件）
- `layouts/MainGridLayout.astro` — 主网格布局结构
- `config/site.ts` — 站点配置入口
- `config/desktop.ts` — 桌面端参数（弹性 banner）
- `config/music.ts` — 音乐播放器配置
- `features/music/manager.ts` — 音乐播放器逻辑单例（Swup 切页不断音）
- `features/music/MusicPlayer.astro` — 音乐播放器 UI 视图
- `components/desktop/elastic-banner/elastic-header.ts` — 弹性效果逻辑
- `utils/device.ts` — 视口判断
- `astro.config.mjs` — 构建配置（集成 rehype/remark/expressive-code 插件）
