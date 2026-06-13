# components/desktop/

**桌面端独有**的组件放这里——移动端完全不加载、不渲染的那种。

与 [`src/features/`](../../../features/) 的区别：
- `features/` = **跨端**特效（粒子、音乐栏，两端都用）
- `desktop/` = **桌面端独有**（移动端直接没有）

## 约定

1. **移动端自我屏蔽**：组件入口用 `isMobileViewport()`（来自 `@utils/device`）做 guard，移动端 early-return，不挂载任何东西。
2. **不要在通用组件里依赖这里**：`desktop/` 下的组件是增强项，`components/layout`、`widget` 等通用组件不应硬依赖它们。

## 现有组件

### `elastic-banner/`
桌面端 banner 弹性拉伸——鼠标滚轮下拉时 banner 弹性展开，松手回弹。移动端不启用（静态 banner）。

入口：`initElasticHeader()`（`elastic-header.ts`），由 `Layout.astro` 调用。

**预留扩展**：banner 拉到最顶部后继续展开显示的"画布内容"，计划作为同目录下的 `BannerCanvas.astro` 加入。
