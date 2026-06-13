# 📦 Components 组件目录

博客所有组件的集中管理目录，按功能和职责分类。

## 📁 目录结构

### 🧱 layout/ — 页面结构组件

页面主体内容和整体结构框架。

- `ArchivePanel.svelte` — 归档页内容栏（文章按年分组的交互式列表）
- `ConfigCarrier.astro` — 配置载体（把主题色等配置注入 DOM）
- `Footer.astro` — 页脚
- `Navbar.astro` — 顶部导航栏
- `NavMenuPanel.astro` — 移动端导航菜单抽屉
- `PostCard.astro` — 文章卡片
- `PostMeta.astro` — 文章元数据（日期、分类、标签）
- `PostPage.astro` — 文章列表页主体（PostCard 集合）

### 🎮 controls/ — 交互控件

用户交互和导航控件。

- `BackToTop.astro` — 返回顶部按钮
- `DisplaySettings.svelte` — 显示设置面板（主题色调滑块）
- `LightDarkSwitch.svelte` — 明暗主题切换
- `Search.svelte` — 搜索（Pagefind）

### 🔧 common/ — 通用可复用组件

跨多个页面 / 组件复用的基础 UI。

- `ButtonLink.astro` — 链接按钮（带角标）
- `ButtonTag.astro` — 标签按钮（带圆点）
- `GlobalStyles.astro` — 全局样式入口
- `ImageWrapper.astro` — 图片包装器（本地 / 远程 / 移动端双图）
- `Markdown.astro` — Markdown 内容样式包装
- `Pagination.astro` — 分页导航
- `WidgetLayout.astro` — 小部件布局容器（标题 + 折叠）

### 🧩 widget/ — 侧边栏小部件

侧边栏里使用的功能小部件。

- `Categories.astro` — 分类列表
- `Profile.astro` — 个人信息 / 社交链接
- `SideBar.astro` — 侧边栏（组合 Profile + Categories + Tags）
- `Tags.astro` — 标签云
- `TOC.astro` — 文章目录

### 📃 misc/ — 杂项

不属于上述分类的辅助组件。

- `License.astro` — 文章许可证 / 署名信息

### 🖥️ desktop/ — 桌面端独有

**移动端完全不加载**的组件。入口用 `isMobileViewport()`（`@utils/device`）自我屏蔽。

- `elastic-banner/` — banner 弹性拉伸效果（详见目录内说明）

### 📱 mobile/ — 移动端独有

**桌面端完全不加载**的组件（预留）。配置见 `src/config/mobile.ts`。

## 🗂️ 分类原则

| 分类 | 用途 | 特点 |
|------|------|------|
| **layout/** | 页面结构和主体内容 | 决定页面框架 / 正文 |
| **controls/** | 交互和导航 | 用户操作 |
| **common/** | 通用可复用组件 | 跨页面 / 组件复用 |
| **widget/** | 侧边栏小部件 | 侧边栏专用 |
| **misc/** | 杂项辅助 | 不属于上面任一类 |
| **desktop/** | 桌面端独有 | 移动端不加载 |
| **mobile/** | 移动端独有 | 桌面端不加载 |

## 平台分离约定

同一个功能，放哪取决于"两端是否都有"：

| 场景 | 放哪 |
|------|------|
| 两端都有，只是布局不同 | 对应分类目录 + Tailwind 断点（`md:`/`lg:`） |
| 桌面端独有（移动端没有） | `desktop/` |
| 移动端独有（桌面端没有） | `mobile/` |
| 两端都有的全局特效（粒子、音乐栏） | [`../features/`](../features/)（顶层，跨端） |

**判断口诀**：*关掉它页面还完整吗？* 否 → 上面的结构 / 交互分类（必需组件）；是 → 增强型，再看两端是否都有来决定 `desktop/` / `mobile/` / `features/`。
