# components/mobile/

**移动端独有**的组件放这里——桌面端完全不加载、不渲染的那种。

与 [`../desktop/`](../desktop/) 对称：
- `desktop/` = 桌面端独有（移动端没有）
- `mobile/` = 移动端独有（桌面端没有）

配置见 [`src/config/mobile.ts`](../../../config/mobile.ts)。

## 约定

1. **桌面端自我屏蔽**：组件入口用 `isDesktopViewport()`（来自 `@utils/device`）做 guard，或反过来——桌面端不挂载。实际使用时按需选择判断方向。
2. **响应式优先**：如果某个组件只是"移动端布局不同"，用 Tailwind 断点（`md:hidden` 等）即可，不必放这里。这里只放**桌面端完全没有**的组件。

## 现有组件

（暂无，预留。未来移动端独有的交互/组件放这里。）
