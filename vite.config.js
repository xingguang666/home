/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return defineConfig({
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue"],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /(.*?)\.(js|css|woff2|woff|ttf)/,
              handler: "CacheFirst",
              options: {
                cacheName: "js-css-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/,
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
              },
            },
          ],
        },
        manifest: {
          name: env.VITE_SITE_NAME,
          short_name: env.VITE_SITE_NAME,
          description: env.VITE_SITE_DES,
          display: "standalone",
          start_url: "/",
          theme_color: "#424242",
          background_color: "#424242",
          icons: [
            { src: "/images/icon/48.png", sizes: "48x48", type: "image/png" },
            { src: "/images/icon/72.png", sizes: "72x72", type: "image/png" },
            { src: "/images/icon/96.png", sizes: "96x96", type: "image/png" },
            { src: "/images/icon/128.png", sizes: "128x128", type: "image/png" },
            { src: "/images/icon/144.png", sizes: "144x144", type: "image/png" },
            { src: "/images/icon/192.png", sizes: "192x192", type: "image/png" },
            { src: "/images/icon/512.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
      viteCompression(),
    ],
    server: {
      port: 5763,
      open: true,
      hmr: { overlay: false },
      proxy: {
        '/api/bing': {
          target: 'https://bing.img.run',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bing/, '/uhd.php'),
          secure: false,
        },
        '/api/dongman': {
          target: 'https://api.52vmy.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/dongman/, '/api/img/tu/pc'),
          secure: false,
        },
        '/api/acg': {
          target: 'https://t.mwm.moe',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/acg/, '/mp'),
          secure: false,
        },
        '/api/4k': {
          target: 'https://v2.xxapi.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/4k/, '/api/random4kPic?type=wallpaper&return=json'),
          secure: false,
        },
        '/api/weather': {
          target: 'https://api.cenguigui.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/weather/, '/api/WeatherInfo'),
        },
        // Proxy daily-hot & AI chat requests to avoid SSL renegotiation issues
        '/api/daily-hot': {
          target: 'https://apiserver.alcex.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/daily-hot/, '/daily-hot'),
          secure: false,
        },
        '/api/chat': {
          target: 'https://apiserver.alcex.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, '/v1/chat/completions'),
          secure: false,
        },
      },
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "src"),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          additionalData: `@use "./src/style/global.scss" as *;`,
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          pure_funcs: ["console.log", "console.warn", "console.info"],
          drop_console: false,
        },
      },
    },
  });
};
