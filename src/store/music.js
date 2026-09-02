import { defineStore } from "pinia";

export const useMusicStore = defineStore("music", {
  state: () => ({
    musicVolume: 0,
    musicClick: false,
    musicIsOk: false,
    musicOpenState: false,
    playerState: false,
    playerTitle: null,
    playerArtist: null,
    playerLrc: "歌词加载中",
    playerLrcShow: true,
    footerBlur: true,
    playerAutoplay: false,
    playerLoop: "all",
    playerOrder: "list",
  }),
  getters: {
    getPlayerLrc: (state) => state.playerLrc,
    getPlayerData: (state) => ({
      name: state.playerTitle,
      artist: state.playerArtist,
    }),
  },
  actions: {
    setPlayerState(value) {
      if (value) {
        this.playerState = false;
      } else {
        this.playerState = true;
      }
    },
    setPlayerLrc(value) {
      this.playerLrc = value;
    },
    setPlayerData(title, artist) {
      this.playerTitle = title;
      this.playerArtist = artist;
    },
  },
  persist: {
    key: "music",
    storage: window.localStorage,
    paths: [
      "musicVolume",
      "musicClick",
      "musicOpenState",
      "playerLrcShow",
      "footerBlur",
      "playerAutoplay",
      "playerLoop",
      "playerOrder",
    ],
  },
});
