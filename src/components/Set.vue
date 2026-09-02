<template>
  <div class="set-panel" @click.stop @mouseenter="closeShow = true" @mouseleave="closeShow = false">
    <!-- Close Button -->
    <transition name="el-fade-in-linear">
      <close-one
        class="set-panel__close"
        theme="filled"
        size="28"
        fill="#ffffff60"
        v-show="closeShow"
        @click="store.setOpenState = false"
      />
    </transition>

    <div class="set-panel__content">
      <!-- Left Column: Core Info (Domain, Version, Update Log) -->
      <section class="set-panel__left">
        <div class="set-info">
          <div class="set-info__logo">
            <span class="set-info__logo-text">{{ siteUrl[0] }}</span>
            <span class="set-info__logo-dot">.{{ siteUrl[1] }}</span>
          </div>
          <div class="set-info__version">
            <span class="set-info__version-text">v&nbsp;{{ config.version }}</span>
          </div>
        </div>

        <div class="set-update">
          <el-collapse v-model="updateLogActive" accordion class="set-update__collapse">
            <el-collapse-item name="1">
              <template #title>
                <div class="set-update__header">
                  <span class="set-update__title">更新日志</span>
                  <span class="set-update__version">v&nbsp;{{ config.version }}</span>
                </div>
              </template>
              <div class="set-update__body">
                <div class="set-update__section">
                  <div class="set-update__label">New</div>
                  <div v-for="item in upData.new" :key="'new-' + item" class="set-update__item">
                    <add-one theme="outline" size="16" class="set-update__icon" />
                    <span class="set-update__text">{{ item }}</span>
                  </div>
                </div>
                <div class="set-update__section">
                  <div class="set-update__label">Fix</div>
                  <div v-for="item in upData.fix" :key="'fix-' + item" class="set-update__item">
                    <bug theme="outline" size="16" class="set-update__icon" />
                    <span class="set-update__text">{{ item }}</span>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </section>

      <!-- Right Column: Settings Controls -->
      <section class="set-panel__right">
        <div class="set-header">
          <setting-two theme="filled" size="28" fill="#ffffff60" class="set-header__icon" />
          <span class="set-header__title">全局设置</span>
        </div>

        <div class="set-content">
          <el-collapse class="set-collapse" v-model="activeName" accordion>
            <el-collapse-item title="个性壁纸" name="1">
              <div class="set-section">
                <el-radio-group v-model="coverType" text-color="#ffffff" @change="radioChange" class="set-radio-group">
                  <el-radio value="0" size="large" border>默认壁纸</el-radio>
                  <el-radio value="5" size="large" border>每日必应</el-radio>
                  <el-radio value="6" size="large" border>随机动漫</el-radio>
                  <el-radio value="7" size="large" border>随机二次元</el-radio>
                  <el-radio value="8" size="large" border>4K壁纸</el-radio>
                </el-radio-group>
              </div>
            </el-collapse-item>

            <el-collapse-item title="个性化调整" name="2">
              <SetItem label="建站日期显示" v-model="siteStartShow" />
              <SetItem label="樱花飘落特效" v-model="snowShow" />
              <SetItem label="音乐点击是否打开面板" v-model="musicClick" />
              <SetItem label="底栏歌词显示" v-model="playerLrcShow" />
              <SetItem label="底栏背景模糊" v-model="footerBlur" />
            </el-collapse-item>

            <el-collapse-item title="播放器配置" name="3">
              <SetItem label="自动播放" v-model="playerAutoplay" />
              <SetItem label="随机播放" v-model="playerOrder" active-value="random" inactive-value="list" />
              <SetItem label="循环模式">
                <el-radio-group v-model="playerLoop" size="small" text-color="#FFFFFF">
                  <el-radio value="all" border>列表</el-radio>
                  <el-radio value="one" border>单曲</el-radio>
                  <el-radio value="none" border>不循环</el-radio>
                </el-radio-group>
              </SetItem>
            </el-collapse-item>

            <el-collapse-item title="其他设置" name="4">
              <div class="set-section set-section--center">设置内容待增加</div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { CloseOne, SettingTwo, SuccessPicture, AddOne, Bug } from "@icon-park/vue-next";
import { mainStore, useMusicStore } from "@/store";
import { storeToRefs } from "pinia";
import SetItem from "@/components/SetItem.vue";
import config from "@/../package.json";

const store = mainStore();
const musicStore = useMusicStore();

const { coverType, siteStartShow, snowShow } = storeToRefs(store);
const {
  musicClick,
  playerLrcShow,
  footerBlur,
  playerAutoplay,
  playerOrder,
  playerLoop,
} = storeToRefs(musicStore);

// Close button visibility state
const closeShow = ref(false);

// Update Log collapse state
const updateLogActive = ref(["1"]);

// Default active collapse item
const activeName = ref("1");

// Site URL calculation for Logo
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "zhijieqianyan.cn".split(".");
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const urlFormat = url.replace(/^(https?:\/\/)/, "");
    return urlFormat.split(".");
  }
  return url.split(".");
});

// Update Log Data
const upData = reactive({
  new: [
    "新增知乎热榜、B站热榜功能",
    "AI助手全新UI设计，支持多模型切换",
    "新增GLM-4-5模型支持",
    "AI对话支持快捷提问功能",
    "优化弹窗关闭按钮显示效果",
  ],
  fix: [
    "修复弹窗关闭按钮看不清的问题",
    "优化热榜标签页布局",
    "改进AI对话消息显示样式",
  ],
});

// Wallpaper Change Handler
const radioChange = () => {
  ElMessage({
    message: "壁纸更换成功",
    icon: h(SuccessPicture, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
};
</script>

<style lang="scss" scoped>
/* Main Container - Glassmorphism Card */
.set-panel {
  @include glass-card();
  width: 80%;
  height: 80%;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05); /* Transparent background to show original website background */
  display: flex;
  flex-direction: column;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
    width: 95%;
    height: 90%;
  }

  /* Close Button */
  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    transition: transform 0.3s, opacity 0.3s;
    z-index: 10;

    &:hover {
      transform: scale(1.2);
    }
    &:active {
      transform: scale(0.95);
    }
  }

  /* Content Grid - Golden Ratio Layout */
  &__content {
    display: grid;
    grid-template-columns: 38.2% 1fr; /* Golden Ratio Split */
    gap: 40px; /* 5 * 8px spacing */
    height: 100%;
    width: 100%;
    overflow: hidden;

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
      gap: 24px;
      overflow-y: auto;
    }
  }

  /* Left Column: Info */
  &__left {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
    overflow: hidden;
    
    @media (max-width: 992px) {
      height: auto;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
    }
  }

  /* Right Column: Settings */
  &__right {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
}

/* Info Section Styling */
.set-info {
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  
  &__logo {
    font-family: "Pacifico-Regular";
    line-height: 1.2;
    
    &-text {
      font-size: 4rem;
    }
    &-dot {
      font-size: 1.8rem;
      margin-left: 4px;
    }
  }

  &__version {
    margin-top: 8px;
    &-text {
      font-size: 1.5rem;
      font-family: "Pacifico-Regular";
      opacity: 0.8;
    }
  }

  @media (max-width: 992px) {
    padding-left: 0;
    flex-direction: row;
    align-items: baseline;
    gap: 16px;

    &__logo-text { font-size: 2.5rem; }
    &__logo-dot { font-size: 1.2rem; }
    &__version-text { font-size: 1.2rem; }
  }
}

/* Update Log Styling */
.set-update {
  width: 100%;
  margin-top: auto;
  
  &__collapse {
    border: none;
    --el-collapse-border-color: transparent;
    --el-collapse-header-bg-color: rgba(255, 255, 255, 0.1);
    --el-collapse-content-bg-color: rgba(255, 255, 255, 0.05);
    --el-collapse-header-text-color: #fff;
    --el-collapse-content-text-color: #fff;
    border-radius: 12px;
    overflow: hidden;

    :deep(.el-collapse-item__header) {
      padding: 0 20px;
      height: 50px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 16px;
      font-weight: bold;
      
      &.is-active {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    :deep(.el-collapse-item__wrap) {
      border-bottom: none;
    }

    :deep(.el-collapse-item__content) {
      padding: 20px;
      padding-bottom: 10px;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-right: 10px;
  }

  &__title {
    font-size: 16px;
  }

  &__version {
    font-size: 12px;
    opacity: 0.8;
    font-family: "Pacifico-Regular";
  }

  &__section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    font-size: 12px;
    opacity: 0.6;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 8px;
    line-height: 1.4;
    font-size: 14px;
    opacity: 0.9;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__icon {
    margin-right: 8px;
    flex-shrink: 0;
    margin-top: 3px;
    opacity: 0.8;
  }
}

/* Settings Header */
.set-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;

  &__icon {
    margin-right: 8px;
  }

  &__title {
    font-size: 18px;
    font-weight: bold;
  }
}

/* Settings Content */
.set-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  /* Scrollbar Styling */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
}

/* Collapse Styling */
.set-collapse {
  border-top: none;
  border-bottom: none;
  --el-collapse-border-color: transparent;
  --el-collapse-header-bg-color: rgba(255, 255, 255, 0.1);
  --el-collapse-content-bg-color: rgba(255, 255, 255, 0.05);
  --el-collapse-header-text-color: #fff;
  --el-collapse-content-text-color: #fff;

  :deep(.el-collapse-item) {
    margin-bottom: 12px;
    border-radius: 8px;
    overflow: hidden;
    border: none;
  }

  :deep(.el-collapse-item__header) {
    padding-left: 16px;
    border-bottom: none;
    font-size: 15px;
    height: 48px;
    transition: background-color 0.3s;

    &.is-active {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 16px;
    padding-bottom: 16px;
  }
}

/* Section & Controls */
.set-section {
  display: flex;
  justify-content: center;
  
  &--center {
    align-items: center;
    color: rgba(255, 255, 255, 0.6);
  }
}

.set-radio-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  :deep(.el-radio) {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 10px;
    height: auto;

    &.is-checked {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);

      .el-radio__inner {
        background-color: #fff;
        border-color: #fff;
      }
      .el-radio__label {
        color: #fff;
        font-weight: bold;
      }
    }

    .el-radio__label {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .el-radio__inner {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}
</style>