# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 personal homepage project (無名の主页), featuring a modern glassmorphism UI with anime-style aesthetics. It includes real-time weather, music player, AI chat integration, and social links.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Development server (runs on port 5763)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Format code with Prettier
pnpm format
```

## Architecture Overview

### Tech Stack
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite 4.x
- **State Management**: Pinia with persistedstate plugin
- **UI Library**: Element Plus (auto-imported via unplugin)
- **Styling**: SCSS with global styles
- **Icons**: @icon-park/vue-next, @vicons/fa
- **Music Player**: APlayer with Meting API integration
- **PWA**: vite-plugin-pwa for offline support

### Directory Structure

```
src/
├── api/              # External API integrations (weather, music, hitokoto)
├── assets/           # Static assets (JSON configs, images)
├── components/       # Reusable Vue components
├── store/            # Pinia store (mainStore)
├── style/            # Global SCSS styles
├── utils/            # Utility functions
├── views/            # Page-level components
│   ├── Main/         # Main layout (Left/Right panels)
│   ├── Box/          # Box view mode
│   ├── Func/         # Functional views
│   ├── MoreSet/      # Settings panel
│   └── AIChat/       # AI chat feature
└── App.vue           # Root component
```

### Key Configuration Files

- **`.env`**: Site configuration (name, author, weather API key, music settings, ICP number)
- **`vite.config.js`**: Build config, PWA manifest, dev server proxy for `/api/wallpaper` and `/api/weather`
- **`src/assets/siteLinks.json`**: Site navigation links with icons
- **`src/assets/socialLinks.json`**: Social media links

### Component Architecture

The main layout uses a left-right panel structure:
- **MainLeft**: Time display, greetings, site description
- **MainRight**: Weather, links, hitokoto, music player

Global features are mounted at App.vue level:
- **Loading**: Initial page load animation
- **Background**: Wallpaper/background management
- **AIChat**: Floating AI chat panel
- **Footer**: Player controls and lyrics display

### State Management

`src/store/index.js` exports `mainStore` with:
- UI state (panel visibility, mobile mode, settings)
- Music player state (volume, autoplay, loop mode)
- Persisted preferences via `pinia-plugin-persistedstate`

Key persisted fields: `coverType`, `musicVolume`, `playerAutoplay`, `playerLoop`, `chatHistory`

### API Integration

`src/api/index.js` handles:
- **Music**: Meting API for playlist retrieval, supports QQ Music JSONP fallback
- **Weather**: Multi-tier approach - Browser Geolocation → Amap reverse geocoding → Amap weather API → Fallback to IP-based location
- **Hitokoto**: One-liner quotes from hitokoto.cn

Weather API flow:
1. Try browser geolocation
2. Convert coordinates to city via Amap regeo API
3. Fetch weather from Amap weather API (JSONP)
4. Fallback to Amap IP location if geolocation fails

### Styling Conventions

- Global SCSS variables in `src/style/global.scss`
- Component-level scoped styles with `<style lang="scss" scoped>`
- Glassmorphism effects with `backdrop-filter: blur()`
- CSS variables for theming (e.g., `--shadow-pink`)

### Environment Variables

All env vars are prefixed with `VITE_`:
- `VITE_SITE_NAME`, `VITE_SITE_AUTHOR`, `VITE_SITE_DES`: Site metadata
- `VITE_WEATHER_KEY`: Amap API key for weather
- `VITE_DEFAULT_CITY`: Fallback city for weather
- `VITE_SONG_API`, `VITE_SONG_SERVER`, `VITE_SONG_TYPE`, `VITE_SONG_ID`: Music player config
- `VITE_SITE_START`: Site creation date for time progress
- `VITE_SITE_ICP`: ICP registration number

### Dev Server Proxies

Configured in `vite.config.js`:
- `/api/wallpaper` → `https://api.52vmy.cn/api/img/tu/pc`
- `/api/weather` → `https://api.cenguigui.cn/api/WeatherInfo`

## Development Notes

- Element Plus components are auto-imported; no manual registration needed
- Vue APIs (ref, computed, watch, etc.) are auto-imported via unplugin-auto-import
- The project uses Chinese comments in source code
- PWA caching strategy: CacheFirst for static assets and images
- Build uses Terser for minification with `console.log` removal

## Known Issues & Technical Debt

### Security

- **IMPORTANT**: `src/api/aiChat.js` API key should be configured via `VITE_AI_API_KEY` in `.env`

### Architecture Notes

- **Music Module**: Built-in parsing via `src/api/music.js`, no external API required
- **Weather**: Consolidated in `src/api/index.js` with multi-tier fallback
- **API Proxies**: Configured in `vite.config.js` for netease music (dev mode only)
