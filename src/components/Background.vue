<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a
        v-if="store.backgroundShow && store.coverType != '3'"
        class="down"
        :href="bgUrl"
        target="_blank"
      >
        下载壁纸
      </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error as ErrorIcon } from "@icon-park/vue-next";

const store = mainStore();
const bgUrl = ref(null);
const imgTimeout = ref(null);
// 是否已尝试过降级到本地图。防止连环降级 + 连环通知：
// - changeBg 失败时静默降级一次（fallbackAttempted=true）
// - 若降级图渲染仍失败（img @error），才真正通知用户
// - 新壁纸成功后重置为 false
const fallbackAttempted = ref(false);
const emit = defineEmits(["loadComplete"]);

// 壁纸随机数
// 请依据文件夹内的图片个数修改 Math.random() 后面的第一个数字
const bgRandom = Math.floor(Math.random() * 10 + 1);

// 更换壁纸链接
const getCache = (type) => {
  try {
    const key = `bg_cache_${type}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { url, ts } = JSON.parse(raw);
    const ttl = 60 * 60 * 1000;
    if (Date.now() - ts < ttl) return url;
    return null;
  } catch {
    return null;
  }
};

const preloadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });

// 安全 JSON 请求：上游壁纸接口偶发返回纯文本错误页（如"数据库连接失败"），
// 直接 response.json() 会抛 SyntaxError。这里先校验 HTTP 状态与 content-type，
// 非 JSON 时给出可控错误，避免把上游的原始报文当成 JSON 解析。
const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`壁纸接口异常 (${response.status})`);
  }
  const ctype = response.headers.get("content-type") || "";
  if (!ctype.toLowerCase().includes("application/json")) {
    // 上游返回了非 JSON（多为错误页/纯文本），吞掉原始报文，抛可控错误
    throw new Error("壁纸接口未返回有效数据");
  }
  try {
    return await response.json();
  } catch {
    throw new Error("壁纸接口数据解析失败");
  }
};

const changeBg = async (type) => {
  let url = null;
  let isLocal = false;

  try {
    if (type == 0) {
      // 默认壁纸 (JPG) - 本地资源，加载极快，跳过 preload 等待
      url = `/images/background${bgRandom}.jpg`;
      isLocal = true;
    } else if (type == 5) {
      // 每日必应 - 通过本地代理，自动处理302重定向
      const cached = getCache('bing');
      if (cached) {
        url = cached;
      } else {
        url = "/api/bing?t=" + Date.now();
      }
    } else if (type == 6) {
      // 随机动漫 - 返回JSON，需要解析URL
      const data = await fetchJson("/api/dongman");
      if (data.code === 200 && data.url) {
        url = data.url;
      } else {
        throw new Error("随机动漫API返回错误");
      }
    } else if (type == 7) {
      // 随机二次元 - 302重定向
      url = "/api/acg?t=" + Date.now();
    } else if (type == 8) {
      // 4K壁纸 - 返回JSON，需要解析URL
      const data = await fetchJson("/api/4k");
      if ((data.code === 200 || data.code === "200") && data.data) {
        url = data.data;
      } else {
        throw new Error("4K壁纸API返回错误");
      }
    }

    if (url) {
      // 本地图片直接赋值（<img> 标签自带加载，无需双重等待）。
      // 仅远程图片才需要 preloadImage 预加载确认可访问后再赋值。
      if (!isLocal) {
        await preloadImage(url);
      }
      bgUrl.value = url;
      // 成功加载新图，重置降级标志
      fallbackAttempted.value = false;
    }
  } catch (error) {
    console.error("壁纸加载失败:", error);
    if (!fallbackAttempted.value) {
      fallbackAttempted.value = true;
      bgUrl.value = `/images/background${bgRandom}.jpg`;
    }
  }
};

// 图片加载完成
// 去掉了原来的 300-600ms 随机延迟：那是纯粹的装饰性等待，
// 用户感受不到任何好处，只增加 Loading 显示时间（每次进站多等半秒）。
const imgLoadComplete = () => {
  store.setImgLoadStatus(true);
};

// 图片动画完成
const imgAnimationEnd = () => {
  console.log("壁纸加载且动画完成");
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败 - 分层降级
// 第一次失败：静默降级到本地图，给降级图一次机会（不打扰用户）
// 降级图也失败：才通知用户（此时是真没图了）
const imgLoadError = () => {
  if (!fallbackAttempted.value) {
    // 第一次失败：尝试降级到本地图，不打扰用户
    fallbackAttempted.value = true;
    console.warn("壁纸加载失败，降级到默认图:", bgUrl.value);
    bgUrl.value = `/images/background${bgRandom}.jpg`;
    return;
  }
  // 降级图也失败了，这才是真正需要告诉用户的
  console.error("壁纸最终加载失败（含降级图）:", bgUrl.value);
  ElMessage({
    message: "壁纸加载失败，请检查网络连接",
    grouping: true,
    icon: h(ErrorIcon, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
};

// 监听壁纸切换
watch(
  () => store.coverType,
  (value) => {
    changeBg(value);
  },
);

onMounted(() => {
  // 加载壁纸
  changeBg(store.coverType);
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;
  overflow: hidden;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    // 性能：初始 blur 与 fade-blur-in 关键帧起始保持一致（8px，原 20px）
    filter: blur(8px) brightness(0.3);
    will-change: transform, filter;
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }

  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.3) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.2) 166%);
    transition: 1.5s;

    &.hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }

  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 8px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;

    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }

    &:active {
      transform: scale(1);
    }
  }
}
</style>
