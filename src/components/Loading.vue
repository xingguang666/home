<template>
  <div id="loader-wrapper" :class="{ loaded: store.imgLoadStatus }" v-if="shouldShow">
    <!-- 极致排版派：「墨竹小筑」四字即画面、即进度。
         删掉所有手搓具象（竹影/墨晕/印章图形/墨痕进度条），
         画面只剩纯字——大字竖排当主角，四字依次带重量感落下作为加载推进。
         配日本设计/原研哉调性：超慷慨留白、极致字号对比、中性纯净暗色。 -->

    <!-- 极淡颗粒底：让暗色不死板，但极其克制（几乎看不出） -->
    <div class="grain" aria-hidden="true"></div>

    <div class="stage" role="status" aria-live="polite" aria-label="正在加载墨竹小筑">
      <!-- 极小竖排拼音副标题：贴标题左侧上方，做字号对比层次 -->
      <p class="pinyin" aria-hidden="true">
        Mò&nbsp;Zhú<br />Xiǎo&nbsp;Zhú
      </p>

      <!-- 超大竖排宋体四字：画面绝对主角，逐字落下 = 加载进度 -->
      <h1 class="mark" aria-label="墨竹小筑">
        <span class="ch" style="--i: 0">墨</span>
        <span class="ch" style="--i: 1">竹</span>
        <span class="ch" style="--i: 2">小</span>
        <span class="ch" style="--i: 3">筑</span>
      </h1>

      <!-- 右下极小落款：唯一克制的温度点（暗朱砂，几乎融入暗底） -->
      <p class="signature" aria-hidden="true">千&nbsp;帆</p>
    </div>
  </div>
</template>

<script setup>
// 逻辑逐字保留：仅 UI/视觉重做，行为契约不变
import { ref, onMounted, onUnmounted, watch } from "vue";
import { mainStore } from "@/store";

const store = mainStore();
const shouldShow = ref(true);
let timeoutId = null;

const MAX_LOAD_TIME = 5000;
const ANIMATION_DURATION = 800;

watch(
  () => store.imgLoadStatus,
  (newValue) => {
    if (newValue) {
      timeoutId = setTimeout(() => {
        shouldShow.value = false;
      }, ANIMATION_DURATION);
    }
  },
);

onMounted(() => {
  timeoutId = setTimeout(() => {
    if (!store.imgLoadStatus) {
      store.setImgLoadStatus(true);
    }
  }, MAX_LOAD_TIME);
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});
</script>

<style lang="scss" scoped>
/* ===== 色彩与字体令牌（遵循项目 DESIGN.md 第 02-03 章）=====
   底色用 ink-void #1a1815（带暖度的暗墨，比纯黑有"墨"的温度，
   也比之前的冷灰黑 #121316 更贴中式墨色）。文字、朱砂保持 DESIGN.md 标准。 */
$void: #1a1815;              /* DESIGN.md ink-void：暗墨底，带极微暖度 */
$void-soft: #232017;         /* DESIGN.md ink-deep：氛围光晕中心，略提一档 */
$bones: #e8e4dc;             /* DESIGN.md paper-warm：默认正文暖白 */
$bones-muted: rgba(232, 228, 220, 0.42);  /* DESIGN.md paper-muted */
$cinnabar: #7a3530;          /* DESIGN.md cinnabar-deep：克制暗朱砂，落款唯一温度点 */

/* 纯系统衬线栈：Loading 页不能依赖外部字体（会卡加载）。
   宋体处理中文（大字号下衬线美感最强），系统衬线兜底拉丁。 */
$serif-cn: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC",
  "Source Han Serif SC", serif;
$serif: "Cormorant Garamond", "Times New Roman", Georgia, $serif-cn;

#loader-wrapper {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  overflow: hidden;
  display: block;
  /* 分层暗色氛围：主光晕 + 角落墨青色温 + 边缘 vignette 收暗。
     让暗色有呼吸和深度，不死黑，但不抢字。 */
  background:
    /* 第三层：边缘 vignette，把四角收暗，聚拢视觉中心 */
    radial-gradient(ellipse 120% 120% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.55) 100%),
    /* 第二层：右上一抹极淡的墨青色温（东方冷墨调，克制） */
    radial-gradient(ellipse 50% 60% at 75% 25%, rgba(82, 104, 118, 0.09) 0%, transparent 65%),
    /* 第一层：主氛围光晕，中心偏左上（呼应标题位置），略提一档 */
    radial-gradient(ellipse 90% 80% at 42% 42%, $void-soft 0%, transparent 70%),
    /* 底色 */
    $void;
  /* 退出：整体上抬淡出（利落，不拖沓） */
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    visibility 0s linear 0.6s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  /* 极淡颗粒：SVG noise data URI，opacity 极低，让暗色有呼吸但不抢戏 */
  .grain {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.035;
    mix-blend-mode: screen;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 120px 120px;
  }

  .stage {
    position: absolute;
    inset: 0;
    z-index: 2;
    color: $bones;
  }

  /* ===== 拼音副标题：极小竖排，贴标题左上，先于字滑入 ===== */
  .pinyin {
    position: absolute;
    left: clamp(48px, 11vw, 160px);
    /* 垂直上对齐标题第一字的顶部，留一小段呼吸 */
    top: calc(50vh - clamp(2.5rem, 6vh, 4rem));
    margin: 0;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-family: $serif;
    font-size: 0.72rem;
    font-weight: 400;
    letter-spacing: 0.34em;
    line-height: 1.9;
    color: $bones-muted;
    white-space: nowrap;
    /* 入场：从上轻滑入（快、克制，不抢字的落下） */
    opacity: 0;
    transform: translateY(-12px);
    animation: slip-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards;
  }

  /* ===== 主角：超大竖排宋体四字，逐字带重量感落下 ===== */
  .mark {
    position: absolute;
    left: clamp(64px, 14vw, 200px);
    /* 垂直居中偏下，制造上重下轻的不对称留白 */
    top: 50%;
    transform: translateY(-46%);
    margin: 0;
    display: inline-flex;
    flex-direction: column;
    font-family: $serif-cn;
    /* DESIGN.md display-mega：超大字用 weight-400（细字重更克制高级，
       Bugatti 洞察：monumental display 用细字重而非粗体） */
    font-weight: 400;
    /* 超大字号：真正成为画面主角（比 v2 大近一倍） */
    font-size: clamp(4rem, 11vh, 7rem);
    /* DESIGN.md：CJK 行高底线 1.3；竖排下即字间距 */
    line-height: 1.34;
    /* DESIGN.md display-mega：CJK 微正字距 0.04em 透气（纪念碑式庄严，
       参考 Bugatti 超大字加正字距策略；CJK 永不用负字距） */
    letter-spacing: 0.04em;
    color: $bones;

    .ch {
      display: block;
      /* 初始：在上方、放大、模糊、不可见 */
      opacity: 0;
      transform: translateY(-34px) scale(1.14);
      filter: blur(4px);
      /* 落下：带回弹的重量感缓动，有机连贯；缩短到 0.42s */
      animation: drop-in 0.42s cubic-bezier(0.34, 1.42, 0.64, 1) forwards;
      /* 四字依次：0.18s 起，每字间隔 0.11s，第四字在 0.93s 落完 */
      animation-delay: calc(0.18s + var(--i) * 0.11s);
    }
  }

  /* ===== 右下落款：极小，唯一暗朱砂温度点，第四字落完后淡入 ===== */
  .signature {
    position: absolute;
    right: clamp(48px, 10vw, 140px);
    bottom: clamp(52px, 12vh, 120px);
    margin: 0;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-family: $serif-cn;
    font-size: 0.82rem;
    font-weight: 400;
    letter-spacing: 0.22em;
    color: $cinnabar;
    /* 极淡入：第四字落定后才出现，作为收笔 */
    opacity: 0;
    animation: fade-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.75s forwards;
  }

  /* ===== 退出态：整体上抬淡出 ===== */
  &.loaded {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-14px);
  }
}

/* ===== 关键帧 =====
   统一缓动语言：所有运动用同一组 cubic-bezier，保证有机连贯。
   - slip/fade 用 (0.22,1,0.36,1)：柔顺减速
   - drop 用 (0.34,1.42,0.64,1)：带回弹的重量落下 */

@keyframes slip-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drop-in {
  0% {
    opacity: 0;
    transform: translateY(-34px) scale(1.14);
    filter: blur(4px);
  }
  55% {
    opacity: 1;
    filter: blur(0.5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes fade-in {
  to {
    opacity: 1;
  }
}

/* ===== 移动端：收紧排版，保持不对称留白 ===== */
@media (max-width: 480px) {
  #loader-wrapper {
    .pinyin {
      left: clamp(30px, 9vw, 64px);
      top: calc(50vh - clamp(2rem, 5vh, 3rem));
      font-size: 0.62rem;
      letter-spacing: 0.26em;
    }
    .mark {
      left: clamp(40px, 11vw, 80px);
      font-size: clamp(3.4rem, 13vh, 4.8rem);
    }
    .signature {
      right: clamp(30px, 9vw, 70px);
      bottom: clamp(44px, 11vh, 90px);
      font-size: 0.74rem;
    }
  }
}

/* ===== 无障碍：尊重减少动效 =====
   降级后保留静态"已完成态"：四字清晰就位、拼音与落款可见。
   不让降级用户看到空白。 */
@media (prefers-reduced-motion: reduce) {
  #loader-wrapper {
    .pinyin {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
    .mark .ch {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      animation: none !important;
    }
    .signature {
      opacity: 1 !important;
      animation: none !important;
    }
    &.loaded {
      transform: none;
    }
  }
}
</style>
