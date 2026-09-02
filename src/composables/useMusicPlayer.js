import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { useMusicStore } from "@/store";
import { getNeteasePlaylist } from "@/api";

export function useMusicPlayer() {
  const store = useMusicStore();

  const volumeShow = ref(false);
  const volumeNum = ref(store.musicVolume || 0.7);
  const musicListShow = ref(false);
  const playerRef = ref(null);
  const audioRef = ref(null);
  const songListRef = ref(null);

  const playerData = reactive({
    server: import.meta.env.VITE_SONG_SERVER,
    type: import.meta.env.VITE_SONG_TYPE,
    id: import.meta.env.VITE_SONG_ID,
  });

  const currentSource = ref("meting");
  const neteasePlaylist = ref([]);
  const neteaseLoading = ref(false);
  const neteaseError = ref(null);
  const neteasePlayingIndex = ref(-1);
  const neteasePaused = ref(true);
  const visibleCount = ref(50);

  const visibleSongs = computed(() =>
    neteasePlaylist.value.slice(0, visibleCount.value)
  );

  const loadMore = () => {
    visibleCount.value = Math.min(
      visibleCount.value + 50,
      neteasePlaylist.value.length
    );
  };

  const stopMetingPlayer = () => {
    if (playerRef.value) {
      try { playerRef.value.pause(); } catch (_) { /* ignore */ }
    }
  };

  const stopNeteasePlayer = () => {
    if (audioRef.value) {
      audioRef.value.pause();
      audioRef.value.currentTime = 0;
    }
    neteasePlayingIndex.value = -1;
    neteasePaused.value = true;
  };

  const onMetingPlay = () => {
    stopNeteasePlayer();
  };

  const loadNeteasePlaylist = async () => {
    neteaseLoading.value = true;
    neteaseError.value = null;
    visibleCount.value = 50;
    try {
      const list = await getNeteasePlaylist(playerData.id);
      neteasePlaylist.value = list;
      const playableCount = list.filter((item) => item.url).length;
      if (playableCount === 0 && list.length > 0) {
        neteaseError.value = "歌单中暂无可播放的歌曲";
      }
    } catch (err) {
      neteaseError.value = err.message || "加载失败";
    } finally {
      neteaseLoading.value = false;
    }
  };

  const playNeteaseSong = (index) => {
    const song = neteasePlaylist.value[index];
    if (!song) return;
    if (!song.url) {
      ElMessage({ message: "该歌曲需要VIP，无法播放", type: "warning", duration: 2000 });
      return;
    }
    stopMetingPlayer();
    neteasePlayingIndex.value = index;
    if (audioRef.value) {
      audioRef.value.src = song.url;
      audioRef.value.volume = volumeNum.value;
      audioRef.value.play();
    }
  };

  const toggleSource = async () => {
    if (currentSource.value === "meting") {
      stopMetingPlayer();
      currentSource.value = "netease";
      if (neteasePlaylist.value.length === 0) {
        await loadNeteasePlaylist();
      }
    } else {
      stopNeteasePlayer();
      currentSource.value = "meting";
    }
  };

  const onAudioPlay = () => {
    stopMetingPlayer();
    neteasePaused.value = false;
    store.setPlayerState(false);
    const song = neteasePlaylist.value[neteasePlayingIndex.value];
    if (song) {
      store.setPlayerData(song.name, song.artist);
      store.setPlayerLrc("");
    }
  };

  const onAudioPause = () => {
    neteasePaused.value = true;
    store.setPlayerState(true);
  };

  const onAudioEnded = () => {
    const findNextPlayable = (start, end, step) => {
      for (let i = start; step > 0 ? i < end : i > end; i += step) {
        if (neteasePlaylist.value[i]?.url) return i;
      }
      return -1;
    };
    const len = neteasePlaylist.value.length;
    let next = findNextPlayable(neteasePlayingIndex.value + 1, len, 1);
    if (next === -1) next = findNextPlayable(0, neteasePlayingIndex.value, 1);
    if (next >= 0) {
      playNeteaseSong(next);
    } else {
      neteasePlayingIndex.value = -1;
      neteasePaused.value = true;
    }
  };

  const onAudioError = () => {
    const song = neteasePlaylist.value[neteasePlayingIndex.value];
    ElMessage({
      message: `"${song?.name || "歌曲"}" 播放失败，请选择其他歌曲`,
      type: "error",
      duration: 3000,
    });
    if (audioRef.value) audioRef.value.pause();
    neteasePaused.value = true;
    store.setPlayerState(true);
  };

  const openMusicList = () => {
    musicListShow.value = true;
    if (currentSource.value === "meting" && playerRef.value) {
      playerRef.value.toggleList();
    }
  };

  const closeMusicList = () => {
    musicListShow.value = false;
    if (currentSource.value === "meting" && playerRef.value) {
      playerRef.value.toggleList();
    }
  };

  const changePlayState = () => {
    if (currentSource.value === "meting") {
      playerRef.value?.playToggle();
    } else if (audioRef.value) {
      if (audioRef.value.paused) {
        if (neteasePlayingIndex.value < 0) {
          const first = neteasePlaylist.value.findIndex((item) => item.url);
          if (first >= 0) playNeteaseSong(first);
          else ElMessage({ message: "没有可播放的歌曲", type: "warning" });
        } else {
          audioRef.value.play();
        }
      } else {
        audioRef.value.pause();
      }
    }
  };

  const changeMusicIndex = (type) => {
    if (currentSource.value === "meting") {
      playerRef.value?.changeSong(type);
      return;
    }
    const len = neteasePlaylist.value.length;
    if (len === 0) return;
    const findNext = (start, direction) => {
      let i = start;
      while (direction > 0 ? i < len : i >= 0) {
        if (neteasePlaylist.value[i]?.url) return i;
        i += direction;
      }
      return -1;
    };
    let next;
    if (type === 0) {
      next = findNext(neteasePlayingIndex.value - 1, -1);
      if (next === -1) next = findNext(len - 1, -1);
    } else {
      next = findNext(neteasePlayingIndex.value + 1, 1);
      if (next === -1) next = findNext(0, 1);
    }
    if (next >= 0 && neteasePlaylist.value[next]?.url) {
      playNeteaseSong(next);
    } else {
      ElMessage({ message: "没有可播放的歌曲了", type: "warning" });
    }
  };

  const getRankClass = (index) => {
    if (index === 0) return "rank-1";
    if (index === 1) return "rank-2";
    if (index === 2) return "rank-3";
    return "";
  };

  const handleCoverError = (e) => {
    e.target.style.display = "none";
  };

  const handleKeydown = (e) => {
    if (!store.musicIsOk) return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
    if (e.code === "Space") {
      e.preventDefault();
      changePlayState();
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  return {
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
  };
}
