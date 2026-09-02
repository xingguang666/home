<template>
  <div :class="store.mobileOpenState ? 'left hidden' : 'left'">
    <Message />
    <SocialLinks />
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import Message from "@/components/Message.vue";
import SocialLinks from "@/components/SocialLinks.vue";
const store = mainStore();
</script>

<style lang="scss" scoped>
.left {
  width: 50%;
  margin-right: 10px;
  transform: translateY(20px);
  animation: slideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &.hidden {
    display: none;
  }

  @media (max-width: 720px) {
    margin-right: 0;
    width: 100%;
    animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (max-width: 480px) {
    transform: translateY(10px);
  }
}

@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-50px) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(20px);
  }
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(10px);
  }
}
</style>
