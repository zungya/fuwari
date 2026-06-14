# 🎵 Music 音乐播放器

跨端全局音乐播放功能（桌面 + 移动都在侧栏）。

## 文件

- `manager.ts` — **逻辑单例**：`initMusicManager()` 创建唯一 `<audio>` 挂 `document.body`、持有播放 state、暴露控制方法。Swup 切页不销毁（audio 在 body、不在 swup-container 内）。纯函数 `parseLRC`/`formatTime`/`computeNextIndex` 有单元测试（`manager.test.ts`）。
- `MusicPlayer.astro` — **UI 视图控制器**：纯 UI，通过 `mgr.subscribe()` 订阅状态刷新画面，点击转发给 manager。位置无关（目前由 `widget/Music.astro` 装进侧栏）。

## 架构要点

Manager / View 分离是 Swup 无刷新切页不断音的**硬要求**：
- audio 挂 `document.body`（Swup 不替换）
- manager 是 ES module 级单例
- view 在 SideBar（`<main>` 兄弟，Swup 不替换）

## 配置

歌单、默认音量/模式在 `src/config/music.ts`；音频文件放 `public/assets/music/`。
详见 `docs/superpowers/specs/2026-06-14-music-player-design.md`。
