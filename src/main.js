import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// swiper
import "swiper/css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.mount("#app");

// 加载性能测试（开发环境启用）


// PWA：监听 Service Worker 更新（加保护，无 SW 支持或开发环境下不报错）
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // 弹出更新提醒
    ElMessage("站点已更新，刷新后生效");
  });
}
