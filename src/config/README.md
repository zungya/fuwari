# ⚙️ Config 配置目录

博客所有配置的集中管理目录。每个配置领域一个独立文件，通过 `index.ts` 统一导出。

## 📁 目录结构

| 文件 | 配置内容 |
|------|---------|
| `site.ts` | 站点级：标题、副标题、语言、主题色（hue）、banner（桌面/移动双图）、TOC、favicon |
| `navbar.ts` | 导航栏链接（支持 `LinkPreset` 预设 + 自定义链接） |
| `profile.ts` | 个人资料：头像、名字、简介、社交链接 |
| `license.ts` | 文章许可证（CC BY-NC-SA 等） |
| `expressive-code.ts` | 代码块主题（`github-dark` 等） |
| `desktop.ts` | **桌面端独有**配置：弹性 banner 全部参数 |
| `mobile.ts` | **移动端独有**配置（预留） |
| `index.ts` | barrel 入口，统一 re-export 全部配置 |

类型定义在 [`../types/config.ts`](../types/config.ts)。

## 使用方式

所有配置从 `@/config` 或相对路径 `../config` 导入，自动解析到 `index.ts`：

```ts
import { siteConfig, desktopConfig } from "../config";
```

无需关心具体在哪个文件——barrel 会转发。

## 平台配置约定

| 配置类型 | 放哪 |
|---------|------|
| 两端通用的站点 / 导航 / 资料等 | 对应领域文件（`site.ts` / `navbar.ts` / ...） |
| 桌面端独有组件的配置 | `desktop.ts` |
| 移动端独有组件的配置 | `mobile.ts` |

平台配置和平台组件一一对应：`config/desktop.ts` ↔ [`components/desktop/`](../components/desktop/)，`config/mobile.ts` ↔ [`components/mobile/`](../components/mobile/)。

## 添加新配置

1. 在 [`types/config.ts`](../types/config.ts) 定义类型（如 `interface XxxConfig`）
2. 新建 `config/<name>.ts` 导出配置实例
3. 在 [`index.ts`](./index.ts) 加一行 re-export：`export { xxxConfig } from "./<name>";`

之后任何地方 `import { xxxConfig } from "../config"` 即可使用。
