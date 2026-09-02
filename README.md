简体中文 | [English](./README_EN.md)

<p>
<strong><h2>墨竹小筑</h2></strong>
一个简洁美观的个人主页，支持天气显示、音乐播放器、AI 聊天、摸鱼日历等功能
</p>

![墨竹小筑](/screenshots/main.jpg)

### 👀 Demo

> 由于 CDN 缓存原因，查看最新效果可能需要 `Ctrl` + `F5` 强制刷新浏览器缓存

- [墨竹小筑](https://zhijieqianyan.cn/)

### 🎉 功能

- [x] 载入动画
- [x] 站点简介
- [x] 摸鱼日历（进度条、假期倒计时、摸鱼格言）
- [x] 日期及时间
- [x] 实时天气（支持浏览器定位 + 高德 API）
- [x] 时光进度条
- [x] 音乐播放器（网易云/QQ音乐 + 网易云歌单，支持VIP解析）
- [x] AI 聊天助手（智谱清言 GLM-4）
- [x] 热榜（百度/微博/抖音）
- [x] API 状态监测
- [x] 多种壁纸源（必应/随机动漫/随机二次元/4K壁纸）
- [x] 移动端适配
- [x] PWA 离线支持

### ⚙️ 部署

#### 环境要求

- Node.js >= 16.16.0
- pnpm >= 8.0.0

#### 快速开始

```bash
# 安装 pnpm
npm install -g pnpm

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

#### Docker 部署

```bash
# 构建
docker build -t home .
# 运行
docker run -p 12445:12445 -d home
```

### ⚙️ 配置说明

#### 环境变量配置（.env）

复制 `.env` 文件并根据需要修改：

```bash
# ===== 站点信息 =====
VITE_SITE_NAME = "你的站点名称"
VITE_SITE_AUTHOR = "作者名"
VITE_SITE_KEYWORDS = "关键词"
VITE_SITE_DES = "站点简介"
VITE_SITE_URL = "your-domain.com"
VITE_SITE_LOGO = "/images/icon/favicon.ico"
VITE_SITE_MAIN_LOGO = "/images/icon/logo.png"
VITE_SITE_MAIN_LOGO_SIZE = "120"
VITE_SITE_APPLE_LOGO = "/images/logo/apple-touch-icon.png"
VITE_APP_VERSION = "1.0.0"

# ===== 简介文本 =====
VITE_DESC_HELLO = "Hello World !"
VITE_DESC_TEXT = "站点描述文字"
VITE_DESC_HELLO_OTHER = "Oops !"
VITE_DESC_TEXT_OTHER = "其他描述文字"

# ===== 天气服务 =====
# 前往高德开放平台申请：https://lbs.amap.com/
# 注意：选择 Web服务 Key，不是 Web端(JS API)
VITE_WEATHER_KEY = "你的高德API密钥"

# 定位失败时的默认城市
VITE_DEFAULT_CITY = "北京"

# ===== AI 聊天 =====
# 前往智谱开放平台申请：https://open.bigmodel.cn/
VITE_AI_API_KEY = "你的智谱API密钥"

# ===== 音乐播放器（内置解析，无需外部 API）=====
VITE_SONG_SERVER = "netease"  # netease(网易云) | tencent(QQ音乐)
VITE_SONG_TYPE = "playlist"   # playlist(歌单) | song(单曲) | album(专辑) | search(搜索)
VITE_SONG_ID = "歌单ID"       # 从对应音乐平台获取

# ===== 其他 =====
VITE_SITE_START = "2024-01-01"  # 建站日期
VITE_SITE_ICP = ""              # ICP 备案号（可选）
```

#### 网站链接配置

编辑 `src/assets/siteLinks.json`：

```json
{
  "icon": "Blog",
  "name": "博客",
  "link": "https://blog.example.com/"
}
```

支持的图标（在 `src/components/Links.vue` 中可扩展）：
- `Blog`, `Cloud`, `CompactDisc`, `Compass`, `Book`, `Fire`, `LaptopCode`

如需添加自定义动作（如打开 AI 聊天），添加 `action` 字段：

```json
{
  "icon": "Cloud",
  "name": "AI 对话",
  "link": "#",
  "action": "$openAIChat"
}
```

#### 社交链接配置

编辑 `src/assets/socialLinks.json` 自定义社交链接。

#### 网站背景

将图片放入 `public/images/` 目录，命名为 `background1.webp`, `background2.webp` ...

修改 `src/components/Background.vue` 中的图片数量：

```js
bgUrl.value = `/images/background${Math.floor(Math.random() * 10 + 1)}.webp`;
// 将 10 改为你的图片数量
```

### 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite 4.x |
| 状态管理 | Pinia + persistedstate |
| UI 组件 | Element Plus |
| 样式 | SCSS |
| 图标 | @icon-park/vue-next, @vicons/fa |
| 音乐 | APlayer + Meting API |
| PWA | vite-plugin-pwa |

### 📁 项目结构

```
src/
├── api/              # API 服务层
│   ├── index.js      # 天气、音乐、一言等接口
│   └── aiChat.js     # AI 聊天接口
├── assets/           # 静态资源（JSON 配置）
├── components/       # 可复用组件
├── store/            # Pinia 状态管理
├── style/            # 全局样式
├── utils/            # 工具函数
├── views/            # 页面级组件
├── App.vue           # 根组件
└── main.js           # 入口文件
```

### 🔌 API 服务

| 服务 | 提供方 | 用途 |
|------|--------|------|
| 天气 | 高德开放平台 | 实时天气数据 |
| 音乐 | Meting API + 网易云解析API | 网易云/QQ音乐解析，支持VIP歌曲 |
| 一言 | hitokoto.cn | 随机语录 |
| AI | 智谱清言 | 智能对话 |
| 摸鱼日历 | uctb.cn | 进度条、假期倒计时 |
| 热榜 | oiapi.net / xxapi.cn | 百度/微博/抖音热搜 |
| 壁纸 | 多源 | 必应/动漫/二次元/4K壁纸 |

### 📝 开发说明

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 📄 License

[MIT](./LICENSE)
