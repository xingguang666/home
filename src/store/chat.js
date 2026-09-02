import { defineStore } from "pinia";

export const useChatStore = defineStore("chat", {
  state: () => ({
    chatOpenState: false,
    chatHistory: [],
  }),
  persist: {
    key: "chat",
    storage: window.localStorage,
    paths: ["chatHistory"],
  },
});
