# DESIGN.md — 墨竹小筑（無名の主页）

> 墨竹小筑的设计系统文档。AI agent 读此文件，可生成视觉一致的 UI。
> 与 `AGENTS.md`（怎么构建）配套：本文件定义**怎么好看**。

---

## 01 — Visual Theme & Atmosphere

**一句话气质**：文人水墨手工艺 × 现代极简编辑。暗墨底，宣纸白字，单一朱砂强调，超大宋体当主角。

**设计哲学**：
- **克制即奢侈**——单一强调色（朱砂），不用多色彩渐变；单一字族（宋体），不混搭花哨字体；单一缓动语言，不堆砌动效。
- **字即画面**——超大字号的品牌字本身就是画面主体，不靠装饰图形填充空白（参考 Bugatti "monumental display type as the only voltage"）。
- **卷轴章法**——不对称留白，左下重、右上空，呼应传统中国画的"计白当黑"。
- **文人温度**——朱砂落款、竖排副标题、宋体衬线，是任何西方模板都不会有的专属文人手势。

**适用场景**：个人主页、Loading 启动页、内容卡片、设置面板、AI 聊天浮窗。整套站点共用一套令牌，保证视觉一致。

---

## 02 — Color Palette & Roles

### 墨色系（中性 surface，多个层级）
> 融合 Ferrari 暖墨黑（#181818）与中式"墨分五色"分层。不用纯黑 #000（太死），用带暖度的近黑。

| 令牌 | 值 | 角色 |
|------|-----|------|
| `ink-void` | `#1a1815` | 最深墨底（带极微暖度，比纯黑有"墨"的温度） |
| `ink-deep` | `#232017` | 提一档的氛围光晕中心 |
| `ink-mid` | `#2a2620` | 卡片层、浮动面板背景 |
| `ink-hairline` | `#3a342a` | 1px 分割线、卡片边框 |
| `ink-overlay` | `rgba(26,24,21,0.85)` | 毛玻璃覆盖层（配合 backdrop-blur） |

### 宣纸白系（文字）

| 令牌 | 值 | 角色 |
|------|-----|------|
| `paper-pure` | `#ffffff` | 显示级文字（大标题、强调） |
| `paper-warm` | `#e8e4dc` | 默认正文（带极微暖度，比纯白柔和） |
| `paper-soft` | `#c4bdae` | 副标题、说明文字 |
| `paper-muted` | `rgba(232,228,220,0.42)` | 极弱文字（水印、辅助标签） |

### 朱砂系（唯一强调色）

| 令牌 | 值 | 角色 |
|------|-----|------|
| `cinnabar` | `#c0392b` | 朱砂主色（印章、唯一强调点） |
| `cinnabar-deep` | `#7a3530` | 暗朱砂（融入暗底的克制版本） |
| `cinnabar-soft` | `rgba(192,57,43,0.12)` | 朱砂印泥底色（印章背景） |

**关键纪律**：朱砂是**唯一**强调色。整页最多出现一处朱砂（印章 / 一个关键 CTA）。绝不用朱砂做大面积色块、不用第二个强调色、不用渐变。

### 竹青（保留色，谨慎使用）
> 仅在需要"墨竹"双意象呼应时使用，绝不与朱砂同页出现。

| 令牌 | 值 | 角色 |
|------|-----|------|
| `bamboo` | `#8b9a6b` | 竹青（替代朱砂的次选强调，互斥使用） |

---

## 03 — Typography Rules

### 字族
- **中文**：`"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", "Source Han Serif SC", serif`（宋体衬线，文人气质）
- **拉丁**：`"Cormorant Garamond", "Times New Roman", Georgia, <宋体栈>, serif`（衬线，与中文宋体调性统一）
- **技术 / 数字**：`"SF Mono", "JetBrains Mono", "Cascadia Code", Consolas, monospace`（仅代码、数字标识）

**关键纪律**：
- Loading 页 / 首屏**不依赖外部字体**（会卡加载），全部用系统字体栈。
- 全站只用衬线字族，不混搭无衬线（除非功能性 UI 如输入框）。

### 字号阶梯（参考 Ferrari 8px 体系，融合 CJK 规则）

| 令牌 | 字号 | 字重 | 行高 | 字距 | 用途 |
|------|------|------|------|------|------|
| `display-mega` | `clamp(4rem, 11vh, 7rem)` | **400** | 1.34 | `0.04em`（微正字距透气） | 品牌主角大字「墨竹小筑」 |
| `display-lg` | `clamp(2rem, 5vw, 3rem)` | 400 | 1.2 | `0.02em` | 页面主标题 |
| `title-md` | `1.25rem` | 500 | 1.4 | 0 | 卡片标题、区块标题 |
| `body-md` | `0.875rem` | 400 | 1.6 | 0 | 默认正文 |
| `body-sm` | `0.8125rem` | 400 | 1.5 | 0 | 辅助正文、说明 |
| `caption` | `0.72rem` | 400 | 1.8 | `0.3em`（拉丁大写时正字距） | 副标题、拼音、标签 |
| `signature` | `0.82rem` | 400 | 1.4 | `0.22em` | 题跋落款 |

### CJK 字距特殊规则（极重要）
> Bugatti 给的反直觉洞察：超大字用 **weight 400**（不是 500/700）更克制更高级。

- **中文永不使用负字距**（与拉丁相反）。CJK 字符本身已紧凑，负字距会让字糊在一起、损失衬线呼吸。
- 中文超大字用 **weight 400** + 微正字距 `0.04em`（透气、庄严，参考 Bugatti 纪念碑大字策略）。
- 中文行高**永远 ≥ 1.3**（底线），大字行高 1.3-1.4，正文 1.6。
- 拉丁副标题大写时用正字距 `0.3em`（透气、专业）。

---

## 04 — Layout Principles（卷轴章法）

### 间距阶梯（8px 基准）
```
xxxs = 4px    xxs = 8px    xs = 16px    sm = 24px
md   = 32px   lg  = 48px   xl = 64px    xxl = 96px
super = 128px
```
所有间距必须落在阶梯上，不用任意数值。

### 构图原则
- **不对称留白**：主体锚左下（或左中），右上大面积留白，呼应"计白当黑"。
- **单一视觉重心**：一页只有一个主角元素（如 Loading 的超大品牌字）。副元素贴边、弱化。
- **边缘呼吸**：所有内容距视口边缘至少 `clamp(48px, 11vw, 160px)`，制造卷轴展开的呼吸感。
- **竖排优先**：品牌名、副标题、落款能用竖排就用竖排（`writing-mode: vertical-rl`），强化文人手势。

### 圆角
- 默认 `0`（锐角，文人克制，参考 Ferrari / Bugatti）。
- 仅功能性 UI（按钮、输入框）可用 `4px`。
- 印章用直角方框（朱砂方印传统）。
- **永不用药丸形 `full`**（除了 Loading 状态点的微小圆形）。

---

## 05 — Motion Principles（笔墨落定语言）

### 缓动函数库（统一缓动，保证有机连贯）

| 令牌 | cubic-bezier | 用途 |
|------|--------------|------|
| `ease-ink-drop` | `cubic-bezier(0.34, 1.42, 0.64, 1)` | 笔墨落定（带回弹的重量落下） |
| `ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | 收笔淡出、柔顺减速 |
| `ease-quick` | `cubic-bezier(0.4, 0, 0.2, 1)` | 利落切换（退出态） |

**关键纪律**：全站只用这三种缓动。绝不随手用 `ease`、`linear`、`ease-in-out` 默认值。

### 动画纪律
- **单次入场编排**：一页只做一次精心编排的入场（staggered reveals），不堆砌散落的微交互。
- **总时长上限**：入场动画整体不超过 **1.2s**（Loading 现状 ~1.1s）。
- **逐字落定节奏**：多字标题逐字落下，每字间隔 `0.11s`，单字落下时长 `0.42s`。
- **进度隐喻**：加载进度优先用"内容本身的构建"表达（如四字依次落下 = 0→100%），而非独立的进度条。

### WCAG 减少动效降级
`@media (prefers-reduced-motion: reduce)` 下：
- 关闭所有循环动画。
- 保留**静态完成态**（标题清晰就位、落款可见），不让降级用户看到空白。
- 退出态改为纯透明度过渡，去掉位移。

---

## 06 — Depth & Elevation（克制阴影）

> 参考 Bugatti "no shadows, depth from contrast"：能不用阴影就不用。

| 层级 | 用法 |
|------|------|
| Flat（无阴影） | 默认。深度靠墨色系分层（ink-void → ink-mid）营造。 |
| Soft drop（仅一级） | `0 4px 8px rgba(0,0,0,0.1)` 浮动面板、弹窗。全站只用这一种阴影。 |
| 朱砂印章 | `box-shadow: inset 0 0 0 3px rgba(192,57,43,0.18)` 内阴影模拟印泥不匀。 |

**禁止**：多层阴影、彩色阴影、长投影、毛玻璃模糊当阴影用。

---

## 07 — Component Patterns

### Loading 启动页（已建立，作为品牌基准）
```
┌─────────────────────────────────┐
│  Mò Zhú        （极小竖排拼音）   │
│  Xiǎo Zhú                       │
│                                 │
│  墨                             │
│  竹      （超大 display-mega）    │
│  小                             │
│  筑                             │
│                                 │
│                    千帆 ·（落款）│
└─────────────────────────────────┘
```
- 四字依次带重量落下 = 加载进度。
- 右下朱砂落款，第四字落定后淡入。
- 暗墨氛围底（分层径向渐变）。

### 卡片（未来扩展）
- 背景 `ink-mid`，1px `ink-hairline` 边框，0 阴影。
- 标题 `title-md` 宋体，正文 `body-md`。
- 留白用 `lg (48px)` 内边距。

### 印章（朱砂方印）
- 直角方框，`1.5px solid cinnabar` 边框 + `cinnabar-soft` 印泥底。
- 阴文（字透明、靠印泥色衬托），宋体竖排。
- 微旋转 `-2deg`（传统印章盖下很少完全方正）。

### 按钮（未来扩展）
- 默认锐角 0，宋体或衬线，weight 500。
- 主按钮：`cinnabar` 底 + `paper-pure` 字。
- 次按钮：透明 + `1px paper-soft` 边框。
- **永不用药丸形**。

---

## 08 — Responsive Behavior

| 断点 | 宽度 | 关键变化 |
|------|------|---------|
| Mobile | < 480px | display-mega 缩到 `clamp(3.4rem, 13vh, 4.8rem)`；边缘呼吸 `clamp(30px, 9vw, 64px)`；竖排副标题字号 `0.62rem` |
| Tablet | 480–768px | display-mega `clamp(4rem, 11vh, 6rem)` |
| Desktop | 768–1280px | 完整令牌 |
| Wide | > 1280px | 内容区上限 1280px，留白继续放大 |

**移动端收紧规则**：保留不对称留白构图，间距按比例缩，但**不改变布局结构**（不变成居中堆叠）。

---

## 09 — Do's and Don'ts

### Do
- ✅ 单一朱砂强调色，全页最多一处
- ✅ 超大宋体当画面主角，字号 `display-mega`
- ✅ 不对称留白，左下重、右上空
- ✅ 竖排副标题与落款（`writing-mode: vertical-rl`）
- ✅ 8px 间距阶梯，所有间距落在阶梯上
- ✅ 统一三种缓动函数
- ✅ 减少动效降级到静态完成态

### Don't
- ❌ 用负字距压缩中文（CJK 字距规则与拉丁相反）
- ❌ 用多色彩渐变（破坏单一强调色纪律）
- ❌ 中文行高低于 1.3（字会糊）
- ❌ 多层阴影 / 彩色阴影 / 长投影
- ❌ 用药丸形圆角（破坏锐角文人克制）
- ❌ 同页同时用朱砂和竹青（强调色互斥）
- ❌ 用手搓几何 SVG 模拟水墨竹 / 墨晕（必假，改用纯排版或真图）
- ❌ 用 `ease` / `linear` / `ease-in-out` 默认缓动

---

## 10 — Agent Prompt Guide（给 AI 的快速参考）

### 快速配色
```
背景：ink-void #1a1815（暗墨底，分层径向渐变叠出深度）
主文字：paper-pure #ffffff 或 paper-warm #e8e4dc
副文字：paper-soft #c4bdae 或 paper-muted
强调：cinnabar #c0392b（唯一，全页最多一处）
分割线：ink-hairline #3a342a
```

### 快速字体
```
中文宋体：font-family: var(--serif-cn);  /* Songti SC 栈 */
拉丁衬线：font-family: var(--serif);     /* Cormorant → 宋体 */
大字：font-weight: 400; letter-spacing: 0.04em; line-height: 1.34;
正文：font-weight: 400; line-height: 1.6;
副标题大写：letter-spacing: 0.3em; text-transform: uppercase;
```

### 即用提示词
> "用 DESIGN.md 的令牌做 [组件名]。配色用 ink-void 底 + paper-warm 字 + 唯一 cinnabar 强调；字体用宋体栈，大字 weight-400 微正字距；间距用 8px 阶梯；缓动用 ease-ink-drop 或 ease-soft；遵守 Do's and Don'ts。"

---

## 附录 — CSS 变量定义（复制到全局样式）

```scss
:root {
  /* 墨色系 */
  --ink-void: #1a1815;
  --ink-deep: #232017;
  --ink-mid: #2a2620;
  --ink-hairline: #3a342a;
  --ink-overlay: rgba(26, 24, 21, 0.85);

  /* 宣纸白 */
  --paper-pure: #ffffff;
  --paper-warm: #e8e4dc;
  --paper-soft: #c4bdae;
  --paper-muted: rgba(232, 228, 220, 0.42);

  /* 朱砂（唯一强调） */
  --cinnabar: #c0392b;
  --cinnabar-deep: #7a3530;
  --cinnabar-soft: rgba(192, 57, 43, 0.12);

  /* 竹青（互斥备用） */
  --bamboo: #8b9a6b;

  /* 字体 */
  --serif-cn: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", "Source Han Serif SC", serif;
  --serif: "Cormorant Garamond", "Times New Roman", Georgia, var(--serif-cn);
  --mono: "SF Mono", "JetBrains Mono", "Cascadia Code", Consolas, monospace;

  /* 缓动 */
  --ease-ink-drop: cubic-bezier(0.34, 1.42, 0.64, 1);
  --ease-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-quick: cubic-bezier(0.4, 0, 0.2, 1);

  /* 间距阶梯 */
  --sp-xxxs: 4px;  --sp-xxs: 8px;  --sp-xs: 16px; --sp-sm: 24px;
  --sp-md: 32px;   --sp-lg: 48px;  --sp-xl: 64px; --sp-xxl: 96px;
  --sp-super: 128px;
}
```

---

*本设计系统融合 Ferrari（暗黑编辑结构 + 单一红强调 + 8px 间距阶梯）与 Bugatti（纪念碑式大字 + 细字重克制）的令牌框架，叠加墨竹小筑的中式水墨语义（墨分五色、卷轴章法、文人题跋、朱砂方印）。*
