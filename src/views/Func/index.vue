<template>
  <!-- 功能区域 -->
  <div :class="store.mobileFuncState ? 'function mobile' : 'function'">
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="left">
          <Hitokoto />
          <Music v-if="playerHasId" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="right cards time-card-wrapper" @click="toggleCard">
          <Transition name="flip" mode="out-in">
            <!-- 时间卡片 -->
            <div v-if="!showCountdown" key="time" class="time-card">
              <div class="time">
                <div class="date">
                  <span>{{ currentTime.year }}&nbsp;年&nbsp;</span>
                  <span>{{ currentTime.month }}&nbsp;月&nbsp;</span>
                  <span>{{ currentTime.day }}&nbsp;日&nbsp;</span>
                  <span class="sm-hidden">{{ currentTime.weekday }}</span>
                </div>
                <div class="text">
                  <span> {{ currentTime.hour }}:{{ currentTime.minute }}:{{ currentTime.second }}</span>
                </div>
              </div>
              <Weather />
            </div>
            <!-- 工作状态卡片 -->
            <div v-else key="countdown" class="time-card countdown-card">
              <div class="time">
                <div class="date">
                  <span>{{ workStatus.label }}</span>
                  <span class="sm-hidden" v-if="workStatus.status === 'working'">&nbsp;|&nbsp;{{ workSettings.offTime }}</span>
                  <span class="sm-hidden" v-else-if="workStatus.status === 'beforeWork'">&nbsp;|&nbsp;{{ workSettings.onTime }}</span>
                </div>
                <!-- 工作中：显示下班倒计时 -->
                <div class="text" v-if="workStatus.status === 'working' && offWorkCountdown">
                  <span>{{ String(offWorkCountdown.hours).padStart(2, '0') }}:{{ String(offWorkCountdown.minutes).padStart(2, '0') }}:{{ String(offWorkCountdown.seconds).padStart(2, '0') }}</span>
                </div>
                <!-- 上班前：显示上班倒计时 -->
                <div class="text before-work" v-else-if="workStatus.status === 'beforeWork' && onWorkCountdown">
                  <span v-if="onWorkCountdown.days > 0">{{ onWorkCountdown.days }}天</span>
                  <span>{{ String(onWorkCountdown.hours).padStart(2, '0') }}:{{ String(onWorkCountdown.minutes).padStart(2, '0') }}</span>
                </div>
                <!-- 下班后/周末/节假日 -->
                <div class="text off-work" v-else>
                  <span>{{ workStatus.message }}</span>
                </div>
              </div>
              <div class="status-info">
                <span v-if="nextHoliday && workStatus.status !== 'holiday'">{{ nextHoliday.name }}还有 {{ nextHoliday.until }} 天</span>
                <span v-else>{{ getTimeBasedGreeting() }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { getCurrentTime } from "@/utils/getTime";
import { mainStore } from "@/store";
import Music from "@/components/Music.vue";
import Hitokoto from "@/components/Hitokoto.vue";
import Weather from "@/components/Weather.vue";
import { getCountdownToOffWork, getCountdownToOnWork, getWorkStatus, getNextHoliday } from "@/utils/moyuCalendar";

const store = mainStore();

// 当前时间
const currentTime = ref({});
const timeInterval = ref(null);

// 播放器 id
const playerHasId = import.meta.env.VITE_SONG_ID;

// 更新时间
const updateTimeData = () => {
  currentTime.value = getCurrentTime();
};

// 卡片翻转状态
const showCountdown = ref(false);

// 工作时间设置
const workSettings = reactive({
  onTime: '09:00',
  offTime: '18:00'
});

// 下班倒计时
const offWorkCountdown = ref(null);
// 上班倒计时
const onWorkCountdown = ref(null);
// 工作状态
const workStatus = ref({ status: 'working', label: '距离下班', message: '努力工作中' });

// 下一个假期
const nextHoliday = ref(null);

// 倒计时定时器
let countdownTimer = null;

// 加载设置
const loadWorkSettings = () => {
  try {
    const saved = localStorage.getItem('work_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      workSettings.onTime = parsed.onTime || '09:00';
      workSettings.offTime = parsed.offTime || '18:00';
    }
  } catch (e) {
    // Use defaults
  }
};

// 监听 localStorage 变化（用于同步摸鱼日历设置）
const handleStorageChange = (e) => {
  if (e.key === 'work_settings') {
    loadWorkSettings();
    updateCountdown();
  }
};

// 更新倒计时
const updateCountdown = () => {
  offWorkCountdown.value = getCountdownToOffWork(workSettings.offTime);
  onWorkCountdown.value = getCountdownToOnWork(workSettings.onTime);
  workStatus.value = getWorkStatus(workSettings.onTime, workSettings.offTime);
};

// 根据时间获取问候语
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了，注意休息';
  if (hour < 9) return '早安，新的一天开始';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了，注意休息';
};

// 翻转卡片
const toggleCard = () => {
  showCountdown.value = !showCountdown.value;
};

onMounted(() => {
  updateTimeData();
  timeInterval.value = setInterval(updateTimeData, 1000);

  loadWorkSettings();
  updateCountdown();
  nextHoliday.value = getNextHoliday();
  countdownTimer = setInterval(updateCountdown, 1000);

  // 监听 localStorage 变化
  window.addEventListener('storage', handleStorageChange);
});

onBeforeUnmount(() => {
  clearInterval(timeInterval.value);
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<style lang="scss" scoped>
.function {
  height: 165px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  &.mobile {
    .el-row {
      .el-col {
        &:nth-of-type(1) {
          display: contents;
        }
        &:nth-of-type(2) {
          display: none;
        }
      }
    }
  }
  .el-row {
    height: 100%;
    width: 100%;
    margin: 0 !important;
    .el-col {
      &:nth-of-type(1) {
        padding-left: 0 !important;
      }
      &:nth-of-type(2) {
        padding-right: 0 !important;
      }
      @media (max-width: 910px) {
        &:nth-of-type(1) {
          display: none;
        }
        &:nth-of-type(2) {
          padding: 0 !important;
          flex: none;
          max-width: none;
          width: 100%;
        }
      }
    }
    .left,
    .right {
      width: 100%;
      height: 100%;
    }
    .right {
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      animation: fade 0.5s;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.02);
      }
    }
  }
}

.time-card-wrapper {
  perspective: 1000px;
}

.time-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  .time {
    font-size: 1.1rem;
    text-align: center;
    .date {
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
    }
    .text {
      margin-top: 10px;
      font-size: 3.25rem;
      letter-spacing: 2px;
      font-family: "UnidreamLED";

      &.before-work {
        font-size: 2.5rem;
      }

      &.off-work {
        font-size: 1.8rem;
        background: linear-gradient(135deg, #a8ff78, #78ffd6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
    @media (min-width: 1201px) and (max-width: 1280px) {
      font-size: 1rem;
    }
    @media (min-width: 911px) and (max-width: 992px) {
      font-size: 1rem;
      .text {
        font-size: 2.75rem;

        &.before-work {
          font-size: 2rem;
        }

        &.off-work {
          font-size: 1.5rem;
        }
      }
    }
  }
}

.countdown-card {
  .status-info {
    text-align: center;
    width: 100%;
    text-overflow: ellipsis;
    overflow-x: hidden;
    white-space: nowrap;
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

// 翻转动画
.flip-enter-active {
  animation: flip-in 0.5s ease;
}

.flip-leave-active {
  animation: flip-out 0.5s ease;
}

@keyframes flip-in {
  0% {
    transform: rotateY(90deg);
    opacity: 0;
  }
  100% {
    transform: rotateY(0deg);
    opacity: 1;
  }
}

@keyframes flip-out {
  0% {
    transform: rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: rotateY(-90deg);
    opacity: 0;
  }
}
</style>
