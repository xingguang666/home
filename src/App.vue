<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
  <!-- 主界面 -->
  <Transition name="fade" mode="out-in">
    <main id="main" v-if="store.imgLoadStatus">
      <div class="container" v-show="!store.backgroundShow">
        <section class="all" v-show="!store.setOpenState">
          <MainLeft />
          <MainRight v-show="!store.boxOpenState" />
          <Box v-show="store.boxOpenState" />
        </section>
        <section class="more" v-show="store.setOpenState" @click="store.setOpenState = false">
          <MoreSet />
        </section>
      </div>
      <!-- 移动端菜单按钮 -->
      <Icon
        class="menu"
        size="24"
        v-show="!store.backgroundShow"
        @click="store.mobileOpenState = !store.mobileOpenState"
      >
        <component :is="store.mobileOpenState ? CloseSmall : HamburgerButton" />
      </Icon>
      <!-- 页脚 -->
      <Transition name="fade" mode="out-in">
        <Footer class="f-ter" v-show="!store.backgroundShow && !store.setOpenState" />
      </Transition>
    </main>
  </Transition>

  <!-- AI聊天组件 -->
  <AIChat />
  <!-- API监测组件 -->
  <ApiMonitor />
  <!-- 热榜组件 -->
  <HotList />
  <!-- 摸鱼日历组件 -->
  <MoyuCalendar />
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { helloInit, checkDays } from "@/utils/getTime.js";
import { HamburgerButton, CloseSmall } from "@icon-park/vue-next";
import { mainStore, useMusicStore } from "@/store";
import { Icon } from "@vicons/utils";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import Box from "@/views/Box/index.vue";
import MoreSet from "@/views/MoreSet/index.vue";
import cursorInit from "@/utils/cursor.js";
import { startSnow, stopSnow } from "@/utils/snow.js";

const AIChat = defineAsyncComponent(() => import("@/components/AIChat.vue"));
const ApiMonitor = defineAsyncComponent(() => import("@/components/ApiMonitor.vue"));
const HotList = defineAsyncComponent(() => import("@/components/HotList.vue"));
const MoyuCalendar = defineAsyncComponent(() => import("@/components/MoyuCalendar.vue"));

const store = mainStore();
const musicStore = useMusicStore();

// 页面宽度
const getWidth = () => {
  store.setInnerWidth(window.innerWidth);
};

// 加载完成事件
const loadComplete = () => {
  nextTick(() => {
    // 欢迎提示
    helloInit();
    // 默哀模式
    checkDays();
  });
};

// 监听宽度变化
watch(
  () => store.innerWidth,
  (value) => {
    if (value < 721) {
      store.boxOpenState = false;
      store.setOpenState = false;
    }
  },
);

// 监听樱花特效开关
watch(
  () => store.snowShow,
  (val) => {
    localStorage.setItem("snowShow", JSON.stringify(val));
    if (val) {
      startSnow();
      ElMessage({
        message: "樱花特效已开启",
        type: "success",
      });
    } else {
      stopSnow();
      // 提示已移至 snow.js 的 destroy() 方法中
    }
  },
);

const onMiddleClick = (event) => {
  if (event.button == 1) {
    store.backgroundShow = !store.backgroundShow;
    ElMessage({
      message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示状态`,
      grouping: true,
    });
  }
};

onMounted(() => {
  // 自定义鼠标
  cursorInit();

  // 屏蔽右键
  document.oncontextmenu = () => {
    ElMessage({
      message: "为了浏览体验，本站禁用右键",
      grouping: true,
      duration: 2000,
    });
    return false;
  };

  // 恢复樱花特效状态
  const savedSnow = localStorage.getItem("snowShow");
  if (savedSnow) {
    store.snowShow = JSON.parse(savedSnow);
  }

  // 启动樱花特效
  if (store.snowShow) {
    startSnow();
  }

  window.addEventListener("mousedown", onMiddleClick);

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", getWidth);
  window.removeEventListener("mousedown", onMiddleClick);
  document.oncontextmenu = null;
  stopSnow();
});
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.2);
  transition: transform 0.3s;
  animation: fade-blur-main-in 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.5s;

  // 添加动漫风格背景装饰
  &::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 20% 80%, rgba(255, 107, 157, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(135, 206, 235, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  .container {
    width: 100%;
    height: 100vh;
    margin: 0 auto;
    padding: 0 0.5vw;
    position: relative;

    .all {
      width: 100%;
      height: 100%;
      padding: 0 0.75rem;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }

    .more {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      backdrop-filter: blur(10px);
      z-index: 2;
      animation: fade 0.5s;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    @media (max-width: 1200px) {
      padding: 0 2vw;
    }
  }

  .menu {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 84%;
    left: calc(50% - 28px);
    width: 56px;
    height: 34px;
    background: linear-gradient(135deg, rgba(255, 107, 157, 0.3), rgba(135, 206, 235, 0.3));
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fade 0.5s;
    box-shadow: var(--shadow-pink);

    &:active {
      transform: scale(0.95);
    }

    &:hover {
      background: linear-gradient(135deg, rgba(255, 107, 157, 0.5), rgba(135, 206, 235, 0.5));
      box-shadow: 0 0 20px rgba(255, 107, 157, 0.6);
    }

    .i-icon {
      transform: translateY(2px);
      color: white;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    @media (min-width: 721px) {
      display: none;
    }
  }

  @media (max-height: 720px) {
    overflow-y: auto;
    overflow-x: hidden;
    .container {
      height: 721px;
      .more {
        height: 721px;
        width: calc(100% + 6px);
      }
      @media (min-width: 391px) {
        // w 1201px ~ max
        padding-left: 0.7vw;
        padding-right: 0.25vw;
        @media (max-width: 1200px) {
          // w 1101px ~ 1280px
          padding-left: 2.3vw;
          padding-right: 1.75vw;
        }
        @media (max-width: 1100px) {
          // w 993px ~ 1100px
          padding-left: 2vw;
          padding-right: calc(2vw - 6px);
        }
        @media (max-width: 992px) {
          // w 901px ~ 992px
          padding-left: 2.3vw;
          padding-right: 1.7vw;
        }
        @media (max-width: 900px) {
          // w 391px ~ 900px
          padding-left: 2vw;
          padding-right: calc(2vw - 6px);
        }
      }
    }
    .menu {
      top: 605.64px; // 721px * 0.84
      left: 170.5px; // 391 * 0.5 - 25px
      @media (min-width: 391px) {
        left: calc(50% - 25px);
      }
    }
    .f-ter {
      top: 675px; // 721px - 46px
      @media (min-width: 391px) {
        padding-left: 6px;
      }
    }
  }
  @media (max-width: 390px) {
      overflow-x: auto;
      .container {
        width: 391px;
      }
      .menu {
      left: 167.5px; // 391px * 0.5 - 28px
    }
    .f-ter {
      width: 391px;
    }
    @media (min-height: 721px) {
      overflow-y: hidden;
    }
  }
}
</style>
