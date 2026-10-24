import { defineStore } from "pinia";
import { useMusicStore } from "./music";

export const mainStore = defineStore("main", {
  state: () => ({
    imgLoadStatus: false,
    innerWidth: null,
    coverType: "0",
    siteStartShow: false,
    // 站点主题：ink 墨底（默认）| paper 宣纸底
    siteTheme: "ink",
    backgroundShow: false,
    snowShow: false,
    boxOpenState: false,
    mobileOpenState: false,
    mobileFuncState: false,
    setOpenState: false,
    apiMonitorOpen: false,
    hotListOpen: false,
    moyuOpen: false,
  }),
  getters: {
    getInnerWidth: (state) => state.innerWidth,
  },
  actions: {
    setInnerWidth(value) {
      this.innerWidth = value;
      if (value >= 720) {
        this.mobileOpenState = false;
        this.mobileFuncState = false;
      }
    },
    setImgLoadStatus(value) {
      this.imgLoadStatus = value;
    },
  },
  persist: {
    key: "data",
    storage: window.localStorage,
    paths: [
      "coverType",
      "siteStartShow",
      "siteTheme",
    ],
  },
});

export { useMusicStore };
