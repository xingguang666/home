<template>
  <!-- 音乐控制面板 -->
  <div
    class="music cards"
    @mouseenter="volumeShow = true"
    @mouseleave="volumeShow = false"
    v-show="store.musicOpenState"
  >
    <div class="btns">
      <span @click="openMusicList()">音乐列表</span>
      <span @click="store.musicOpenState = false">回到一言</span>
    </div>
    <div class="control">
      <go-start theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(0)" />
      <Transition name="fade" mode="out-in">
        <div :key="store.playerState" class="state" @click="changePlayState">
          <play-one theme="filled" size="50" fill="#efefef" v-show="!store.playerState" />
          <pause theme="filled" size="50" fill="#efefef" v-show="store.playerState" />
        </div>
      </Transition>
      <go-end theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(1)" />
    </div>
    <div class="menu">
      <div class="name" v-show="!volumeShow">
        <span>{{
          store.getPlayerData.name
            ? store.getPlayerData.name + " - " + store.getPlayerData.artist
            : "未播放音乐"
        }}</span>
      </div>
      <div class="volume" v-show="volumeShow">
        <div class="icon">
          <volume-mute theme="filled" size="24" fill="#efefef" v-if="volumeNum == 0" />
          <volume-small
            theme="filled"
            size="24"
            fill="#efefef"
            v-else-if="volumeNum > 0 && volumeNum < 0.7"
          />
          <volume-notice theme="filled" size="24" fill="#efefef" v-else />
        </div>
        <el-slider v-model="volumeNum" :show-tooltip="false" :min="0" :max="1" :step="0.01" />
      </div>
    </div>
  </div>

  <!-- 音乐列表弹窗 -->
  <Transition name="fade" mode="out-in">
    <div class="music-list" v-show="musicListShow" @click="closeMusicList()">
      <Transition name="zoom">
        <div class="list" v-show="musicListShow" @click.stop>
          <!-- 弹窗头部 -->
          <div class="list-header">
            <div class="header-info">
              <span class="title">{{ currentSource === 'meting' ? '默认播放列表' : '网易云歌单' }}</span>
              <span class="song-count" v-if="currentSource === 'netease' && neteasePlaylist.length">
                共 {{ neteasePlaylist.length }} 首
              </span>
            </div>
            <div class="header-actions">
              <button class="switch-btn" @click.stop="toggleSource">
                <refresh theme="filled" size="14" />
                <span>{{ currentSource === 'meting' ? '网易云' : '默认源' }}</span>
              </button>
              <close-one
                class="close"
                theme="filled"
                size="22"
                fill="rgba(255,255,255,0.6)"
                @click="closeMusicList()"
              />
            </div>
          </div>

          <!-- 播放器内容 -->
          <div class="list-body">
            <!-- 默认播放器 -->
            <div v-show="currentSource === 'meting'" class="meting-wrap">
              <Player
                ref="playerRef"
                :songServer="playerData.server"
                :songType="playerData.type"
                :songId="playerData.id"
                :volume="volumeNum"
                @play="onMetingPlay"
              />
            </div>

            <!-- 网易云歌单列表 -->
            <div v-show="currentSource === 'netease'" class="netease-content">
              <!-- 加载中 -->
              <div v-if="neteaseLoading" class="state-wrap">
                <div class="spinner"></div>
                <span>加载歌单中...</span>
              </div>

              <!-- 错误提示 -->
              <div v-else-if="neteaseError" class="state-wrap error">
                <error theme="filled" size="36" fill="#ff6b6b" />
                <span>{{ neteaseError }}</span>
                <button class="retry-btn" @click="loadNeteasePlaylist">重新加载</button>
              </div>

              <!-- 空列表提示 -->
              <div v-else-if="neteasePlaylist.length === 0" class="state-wrap">
                <span>暂无歌曲</span>
              </div>

              <!-- 歌曲列表 -->
              <div v-else class="song-list" ref="songListRef">
                <div
                  v-for="(item, index) in visibleSongs"
                  :key="item.id"
                  class="song-item"
                  :class="{
                    playing: neteasePlayingIndex === index && !neteasePaused,
                    paused: neteasePlayingIndex === index && neteasePaused,
                    disabled: !item.url
                  }"
                  @click="playNeteaseSong(index)"
                >
                  <div class="song-left">
                    <div class="song-rank" :class="getRankClass(index)">
                      <span v-if="neteasePlayingIndex !== index || neteasePaused">{{ index + 1 }}</span>
                      <div v-else class="playing-bars">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                    <div class="song-cover" v-if="item.cover">
                      <img :src="item.cover" alt="" loading="lazy" @error="handleCoverError($event)" />
                    </div>
                  </div>
                  <div class="song-info">
                    <div class="song-name">
                      {{ item.name }}
                      <span v-if="!item.url" class="vip-tag">VIP</span>
                    </div>
                    <div class="song-meta">
                      <span class="song-artist">{{ item.artist }}</span>
                    </div>
                  </div>
                  <div class="song-actions">
                    <play-one
                      v-if="(neteasePlayingIndex !== index || neteasePaused) && item.url"
                      theme="filled"
                      size="18"
                      fill="rgba(255,255,255,0.5)"
                      class="play-icon"
                    />
                    <pause
                      v-if="neteasePlayingIndex === index && !neteasePaused"
                      theme="filled"
                      size="18"
                      fill="#ff6b6b"
                      class="play-icon"
                    />
                  </div>
                </div>
                <!-- 加载更多提示 -->
                <div v-if="visibleCount < neteasePlaylist.length" class="load-more" @click="loadMore">
                  加载更多 ({{ visibleCount }}/{{ neteasePlaylist.length }})
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- 隐藏的音频播放器（用于网易云） -->
  <audio
    ref="audioRef"
    style="display: none"
    @play="onAudioPlay"
    @pause="onAudioPause"
    @ended="onAudioEnded"
    @error="onAudioError"
  />
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  Pause,
  GoEnd,
  CloseOne,
  VolumeMute,
  VolumeSmall,
  VolumeNotice,
  Refresh,
  Error,
} from "@icon-park/vue-next";
import Player from "@/components/Player.vue";
import { watch, onMounted } from "vue";
import { useMusicPlayer } from "@/composables/useMusicPlayer.js";

const {
  volumeShow,
  volumeNum,
  musicListShow,
  playerRef,
  audioRef,
  songListRef,
  playerData,
  currentSource,
  neteasePlaylist,
  neteaseLoading,
  neteaseError,
  neteasePlayingIndex,
  neteasePaused,
  visibleCount,
  visibleSongs,
  loadMore,
  onMetingPlay,
  toggleSource,
  loadNeteasePlaylist,
  playNeteaseSong,
  onAudioPlay,
  onAudioPause,
  onAudioEnded,
  onAudioError,
  openMusicList,
  closeMusicList,
  changePlayState,
  changeMusicIndex,
  getRankClass,
  handleCoverError,
} = useMusicPlayer();

import { useMusicStore } from "@/store";
const store = useMusicStore();

onMounted(() => {
  window.$openList = openMusicList;
});

watch(volumeNum, (val) => {
  store.musicVolume = val;
  playerRef.value?.changeVolume(val);
  if (audioRef.value) {
    audioRef.value.volume = val;
  }
});
</script>

<style lang="scss" scoped>
.music {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  animation: fade 0.5s;
  .btns {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    span {
      background: #ffffff26;
      padding: 2px 8px;
      border-radius: 6px;
      margin: 0 6px;
      cursor: pointer;
      &:hover {
        background: #ffffff4d;
      }
    }
  }
  .control {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    .state {
      cursor: pointer;
      transition: opacity 0.1s;
    }
    .i-icon {
      width: 36px;
      height: 36px;
      display: flex;
      border-radius: 6px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        background: #ffffff33;
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }
  .menu {
    height: 26px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .name {
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .volume {
      width: 100%;
      padding: 0 12px;
      display: flex;
      align-items: center;
      .icon {
        margin-right: 12px;
      }
      .el-slider {
        flex: 1;
        --el-slider-main-bg-color: #efefef;
        --el-slider-runway-bg-color: #ffffff40;
        --el-slider-button-size: 16px;
      }
    }
  }
}

.music-list {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(12px);
  z-index: 999;

  .list {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 660px;
    max-width: 95vw;
    height: 620px;
    max-height: 85vh;
    background: linear-gradient(160deg, rgba(35, 35, 50, 0.97), rgba(25, 25, 38, 0.99));
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;

      .header-info {
        display: flex;
        align-items: baseline;
        gap: 12px;

        .title {
          color: #fff;
          font-weight: 600;
          font-size: 16px;
        }

        .song-count {
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .switch-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.75);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.2);
          }
        }

        .close {
          cursor: pointer;
          transition: all 0.2s;
          padding: 6px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.15);
          &:hover {
            background: rgba(255, 107, 157, 0.35);
            transform: scale(1.1);
          }
        }
      }
    }

    .list-body {
      flex: 1;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;

      .meting-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .netease-content {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        .state-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.5);

          &.error {
            color: rgba(255, 255, 255, 0.6);
          }

          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #ff6b6b;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }

          .retry-btn {
            margin-top: 4px;
            padding: 10px 24px;
            border: none;
            border-radius: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            &:hover {
              transform: scale(1.03);
            }
          }
        }

        .song-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px 16px;

          &::-webkit-scrollbar {
            width: 5px;
          }
          &::-webkit-scrollbar-track {
            background: transparent;
          }
          &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
          }

          .song-item {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            margin: 3px 0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.15s;

            &:hover {
              background: rgba(255, 255, 255, 0.05);
              .play-icon {
                opacity: 1;
              }
            }

            &.playing {
              background: rgba(255, 107, 157, 0.1);
              .song-name {
                color: #ff6b9d;
              }
            }

            &.paused:not(.disabled) {
              background: rgba(255, 255, 255, 0.04);
            }

            &.disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .song-left {
              display: flex;
              align-items: center;
              gap: 12px;
              flex-shrink: 0;

              .song-rank {
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.35);

                &.rank-1 { color: #ff6b6b; }
                &.rank-2 { color: #ffa940; }
                &.rank-3 { color: #ffd700; }

                .playing-bars {
                  display: flex;
                  align-items: flex-end;
                  gap: 2px;
                  height: 14px;

                  span {
                    width: 3px;
                    background: #ff6b6b;
                    border-radius: 2px;
                    animation: bars 0.6s ease-in-out infinite;

                    &:nth-child(1) { height: 6px; animation-delay: 0s; }
                    &:nth-child(2) { height: 12px; animation-delay: 0.15s; }
                    &:nth-child(3) { height: 8px; animation-delay: 0.3s; }
                  }
                }
              }

              .song-cover {
                width: 42px;
                height: 42px;
                border-radius: 6px;
                overflow: hidden;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
              }
            }

            .song-info {
              flex: 1;
              min-width: 0;
              margin-left: 12px;

              .song-name {
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 8px;

                .vip-tag {
                  font-size: 10px;
                  padding: 1px 5px;
                  background: linear-gradient(135deg, #ffd700, #ffaa00);
                  color: #333;
                  border-radius: 3px;
                  font-weight: 600;
                }
              }

              .song-meta {
                margin-top: 3px;

                .song-artist {
                  color: rgba(255, 255, 255, 0.45);
                  font-size: 12px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }
            }

            .song-actions {
              flex-shrink: 0;
              margin-left: 8px;

              .play-icon {
                opacity: 0;
                transition: opacity 0.15s;
              }
            }
          }

          .load-more {
            text-align: center;
            padding: 16px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              color: rgba(255, 255, 255, 0.8);
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
            }
          }
        }
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bars {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.5); }
}

// 弹窗动画
.zoom-enter-active {
  animation: zoom 0.35s ease-out;
}
.zoom-leave-active {
  animation: zoom 0.25s ease-in reverse;
}
@keyframes zoom {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.93);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
