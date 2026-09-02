<template>
  <footer id="footer" :class="[store.footerBlur ? 'blur' : '', store.playerState ? 'on-playing' : '']">
    <Transition name="fade" mode="out-in">
      <!-- 歌词显示区域 -->
      <div v-if="store.playerLrcShow && store.playerState && store.playerLrc" class="lrc" :key="'lrc'">
        <div class="lrc-all">
          <span class="lrc-text">{{ store.getPlayerLrc }}</span>
        </div>
      </div>
      <!-- 歌曲信息区域（网易云歌曲或无歌词时显示） -->
      <div v-else-if="store.playerTitle" class="song-info" :key="'song'">
        <span class="song-name">{{ store.playerTitle }}</span>
        <span v-if="store.playerArtist" class="song-artist"> - {{ store.playerArtist }}</span>
      </div>
      <!-- 版权信息区域 -->
      <div v-else class="power" :key="'power'">
        <span>
          <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
          &copy;
          <span v-if="startYear < fullYear" class="site-start">
            {{ startYear }}
            -
          </span>
          {{ fullYear }}
          <a :href="siteUrl">{{ siteAuthor }}</a>
        </span>
        <!-- 以下信息请不要修改哦 -->
        <span class="hidden">
          &&nbsp;Made&nbsp;by
          <a :href="config.github" target="_blank">
            {{ config.author }}
          </a>
        </span>
        <!-- 站点备案 -->
        <span>
          &
          <a v-if="siteIcp" href="https://beian.miit.gov.cn" target="_blank">
            {{ siteIcp }}
          </a>
        </span>
      </div>
    </Transition>
  </footer>
</template>

<script setup>
import { useMusicStore } from "@/store";
import { onMounted, onBeforeUnmount } from "vue";
import config from "@/../package.json";

const store = useMusicStore();
const fullYear = new Date().getFullYear();

// 加载配置数据
const startYear = ref(
  import.meta.env.VITE_SITE_START?.length >= 4
    ? import.meta.env.VITE_SITE_START.substring(0, 4)
    : null,
);
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteAuthor = ref(import.meta.env.VITE_SITE_AUTHOR);

// 桥接外部 myhkw.cn 播放器 play/pause 事件到 Pinia Store
const onPlayerPlay = () => store.setPlayerState(false);
const onPlayerPause = () => store.setPlayerState(true);

onMounted(() => {
  window.addEventListener("player:play", onPlayerPlay);
  window.addEventListener("player:pause", onPlayerPause);
});

onBeforeUnmount(() => {
  window.removeEventListener("player:play", onPlayerPlay);
  window.removeEventListener("player:pause", onPlayerPause);
});
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "https://zhijieqianyan.cn/";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  }
  return url;
});
</script>

<style lang="scss" scoped>
#footer {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 14px;
  word-break: keep-all;
  white-space: nowrap;
  .power {
    animation: fade 0.3s;
  }
  .lrc {
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    .lrc-all {
      width: 98%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      .lrc-text {
        margin: 0 8px;
      }
      .i-icon {
        width: 18px;
        height: 18px;
        display: inherit;
      }
    }
  }
  .song-info {
    animation: fade 0.3s;
    .song-name {
      color: rgba(255, 255, 255, 0.85);
    }
    .song-artist {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  &.blur {
    backdrop-filter: blur(10px);
    background: rgb(0 0 0 / 25%);
    font-size: 16px;
  }
  &.on-playing {
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease-in-out;
  }
  @media (max-width: 720px) {
    font-size: 0.9rem;
    &.blur {
      font-size: 0.9rem;
    }
  }
  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }
  @media (max-width: 480px) {
    .hidden {
      display: none;
    }
  }
}
</style>
