# features/

**跨端**的全局特效 / 扩展功能放这里——桌面和移动端都启用的那种。

典型成员：粒子背景、音乐播放器、自定义光标动效等。

> ⚠️ 如果某个特效是**桌面端独有**（移动端完全不渲染），不要放这里，放 [`src/components/desktop/`](../components/desktop/)。

## 约定

1. **每个特性一个子目录**：`features/<name>/`，里面放逻辑（`.ts`）、组件（`.astro`/`.svelte`）。
2. **跨端优先**：这里的特效默认两端都启用。如果某端体验要弱化，在特性内部用 `isMobileViewport()` / `isDesktopViewport()`（来自 `@utils/device`）做降级，而不是把整个特性搬走。
3. **暴露一个 `init` 入口**：供 `Layout.astro` 在页面加载 / Swup 切换时调用，返回 cleanup 函数。

## 判断口诀

*关掉这个特效，页面还是完整的吗？* 是 → 放这里（增强型特效）。否 → 放 `components/`（结构型组件）。
*这个特效移动端也要吗？* 是 → 放这里。否 → 放 `components/desktop/`。

## 现有特性

（暂无，等待粒子背景、音乐栏等加入）
