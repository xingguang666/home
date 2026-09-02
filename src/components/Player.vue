<template>
  <APlayer
    v-if="playList[0]"
    ref="player"
    :audio="playList"
    :autoplay="store.playerAutoplay"
    :theme="theme"
    :autoSwitch="false"
    :loop="store.playerLoop"
    :order="store.playerOrder"
    :volume="volume"
    :showLrc="true"
    :listFolded="listFolded"
    :listMaxHeight="listMaxHeight"
    :noticeSwitch="false"
    @play="onPlay"
    @pause="onPause"
    @timeupdate="onTimeUp"
    @error="loadMusicError"
  />
</template>

<script setup>
import { MusicOne, PlayWrong } from "@icon-park/vue-next";
import { getPlayerList } from "@/api";
import { useMusicStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";

const store = useMusicStore();

// 获取播放器 DOM
const player = ref(null);

// 歌曲播放列表
const playList = ref([]);

// 歌曲播放项
const playIndex = ref(0);

// 配置项
const props = defineProps({
  theme: {
    type: String,
    default: "#efefef",
  },
  volume: {
    type: Number,
    default: 0.7,
    validator: (value) => value >= 0 && value <= 1,
  },
  songServer: {
    type: String,
    default: "netease",
  },
  songType: {
    type: String,
    default: "playlist",
  },
  songId: {
    type: String,
    default: "",
  },
  listFolded: {
    type: Boolean,
    default: false,
  },
  listMaxHeight: {
    type: Number,
    default: 420,
  },
});

const listHeight = computed(() => props.listMaxHeight + "px");

// 定义 emit
const emit = defineEmits(['play']);

// 初始化播放器
onMounted(() => {
  nextTick(() => {
    getPlayerList(props.songServer, props.songType, props.songId)
      .then((res) => {
        store.musicIsOk = true;
        playList.value = res;
      })
      .catch(() => {
        store.musicIsOk = false;
        ElMessage({
          message: "播放器加载失败",
          grouping: true,
          icon: h(PlayWrong, { theme: "filled", fill: "#efefef" }),
        });
      });
  });
});

// 播放
const onPlay = () => {
  playIndex.value = player.value.aplayer.index;
  store.setPlayerState(player.value.audioRef.paused);
  store.setPlayerData(playList.value[playIndex.value].name, playList.value[playIndex.value].artist);
  // 通知父组件停止网易云播放器
  emit('play');
  ElMessage({
    message: store.getPlayerData.name + " - " + store.getPlayerData.artist,
    grouping: true,
    icon: h(MusicOne, { theme: "filled", fill: "#efefef" }),
  });
};

// 暂停
const onPause = () => {
  store.setPlayerState(player.value.audioRef.paused);
};

// 音频时间更新事件
const onTimeUp = () => {
  let lyrics = player.value.aplayer.lyrics[playIndex.value];
  let lyricIndex = player.value.aplayer.lyricIndex;
  if (!lyrics || !lyrics[lyricIndex]) {
    return;
  }
  let lrc = lyrics[lyricIndex][1];
  if (lrc === "Loading") {
    lrc = "歌词加载中";
  } else if (lrc === "Not available") {
    lrc = "歌词加载失败";
  }
  store.setPlayerLrc(lrc);
};

// 切换播放暂停事件
const playToggle = () => {
  player.value.toggle();
};

// 切换音量事件
const changeVolume = (value) => {
  player.value.setVolume(value, false);
};

// 切换上下曲
const changeSong = (type) => {
  type === 0 ? player.value.skipBack() : player.value.skipForward();
  nextTick(() => {
    player.value.play();
  });
};

// 切换歌曲列表状态
const toggleList = () => {
  player.value.toggleList();
};

// 加载音频错误
const loadMusicError = () => {
  let notice = "";
  if (playList.value.length > 1) {
    notice = "播放歌曲出现错误，播放器将在 2s 后进行下一首";
  } else {
    notice = "播放歌曲出现错误";
  }
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, {
      theme: "filled",
      fill: "#EFEFEF",
      duration: 2000,
    }),
  });
  console.error(
    "播放歌曲: " + player.value.aplayer.audio[player.value.aplayer.index].name + " 出现错误",
  );
};

// 暂停播放
const pause = () => {
  if (player.value) {
    player.value.pause();
  }
};

// 暴露子组件方法
defineExpose({ playToggle, changeVolume, changeSong, toggleList, pause, player });
</script>

<style lang="scss" scoped>
.aplayer {
  width: 85%;
  max-width: 520px;
  border-radius: 8px;
  font-family: "HarmonyOS_Regular", sans-serif !important;

  :deep(.aplayer-body) {
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);

    .aplayer-pic {
      display: none;
    }

    .aplayer-info {
      margin-left: 0;
      padding: 12px 16px;
      border-color: transparent !important;

      .aplayer-music {
        flex-grow: initial;
        margin-bottom: 4px;
        overflow: initial;

        .aplayer-title {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.95);
          margin-right: 8px;
        }

        .aplayer-author {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }
      }

      .aplayer-lrc {
        text-align: left;
        margin: 8px 0 4px 0;
        height: 40px;
        mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );
        -webkit-mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );

        &::before,
        &::after {
          display: none;
        }

        p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
        }

        .aplayer-lrc-current {
          color: #fff;
          font-size: 14px;
          margin-bottom: 4px !important;
        }
      }

      .aplayer-controller {
        display: none;
      }
    }
  }

  :deep(.aplayer-list) {
    margin-top: 8px;
    height: v-bind(listHeight);
    background-color: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);

    ol {
      padding: 8px 0;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
      }

      li {
        border-color: transparent;
        color: rgba(255, 255, 255, 0.8);
        padding: 8px 14px;
        font-size: 13px;

        &.aplayer-list-light {
          background: rgba(255, 107, 157, 0.15);
          border-radius: 6px;
          color: #fff;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          border-radius: 6px !important;
        }

        .aplayer-list-index {
          color: rgba(255, 255, 255, 0.4);
        }

        .aplayer-list-author {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }
}
</style>
