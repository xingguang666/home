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

const setCache = (type, url) => {
  try {
    const key = `bg_cache_${type}`;
    localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
  } catch (_) {
    void 0;
    return;
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

  try {
    if (type == 0) {
      // 默认壁纸 (JPG)
      url = `/images/background${bgRandom}.jpg`;
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
      // code可能是数字200或字符串"200"
      if ((data.code === 200 || data.code === "200") && data.data) {
        url = data.data;
      } else {
        throw new Error("4K壁纸API返回错误");
      }
    }

    if (url) {
      await preloadImage(url);
      bgUrl.value = url;
    }
  } catch (error) {
    console.error("壁纸加载失败:", error);
    imgLoadError();
  }
};

// 图片加载完成
const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  console.log("壁纸加载且动画完成");
  // 加载完成事件
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  ElMessage({
    message: "壁纸加载失败，已临时切换回默认",
    icon: h(ErrorIcon, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  // 随机选择一个默认图片
  bgUrl.value = `/images/background${bgRandom}.jpg`;
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
