<template>
  <!-- 摸鱼日历弹窗 -->
  <Transition name="fade">
    <div class="moyu-calendar-modal" v-if="store.moyuOpen" @click.self="store.moyuOpen = false">
      <div class="moyu-calendar-content">
        <!-- Header -->
        <div class="moyu-header">
          <span class="moyu-title">摸鱼日历</span>
          <div class="header-actions">
            <button class="settings-btn" @click="showSettings = !showSettings" title="设置">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <close-one class="moyu-close" theme="filled" size="20" fill="#fff" @click="store.moyuOpen = false" />
          </div>
        </div>

        <!-- Body -->
        <div class="moyu-body">
          <!-- Settings Panel -->
          <Transition name="slide">
            <div v-if="showSettings" class="settings-panel">
              <div class="setting-row">
                <label>上班时间</label>
                <input type="time" v-model="workSettings.onTime" />
              </div>
              <div class="setting-row">
                <label>下班时间</label>
                <input type="time" v-model="workSettings.offTime" />
              </div>
              <button class="save-btn" @click="saveWorkSettings">保存设置</button>
            </div>
          </Transition>

          <!-- 仪表盘主体 -->
          <div class="dashboard">
            <!-- 左侧：圆形进度环 -->
            <div class="gauge-section">
              <div class="main-gauge">
                <svg viewBox="0 0 120 120" class="gauge-svg">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#ff6b9d"/>
                      <stop offset="100%" stop-color="#87ceeb"/>
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="52" class="gauge-bg"/>
                  <circle cx="60" cy="60" r="52" class="gauge-fill" :style="{ strokeDashoffset: gaugeOffset }"/>
                </svg>
                <div class="gauge-center">
                  <span class="gauge-value">{{ moyuData.day }}</span>
                  <span class="gauge-label">{{ moyuData.month }}月</span>
                </div>
              </div>
              <div class="year-progress-text">
                <span>本年已过</span>
                <strong>{{ moyuData.yearProgress }}%</strong>
              </div>
            </div>

            <!-- 右侧：倒计时 -->
            <div class="countdown-section">
              <div class="countdown-label">{{ workStatus.label }}</div>
              <!-- 工作中：下班倒计时 -->
              <div class="countdown-display" v-if="workStatus.status === 'working' && offWorkCountdown && !offWorkCountdown.passed">
                <div class="time-unit">
                  <span class="time-value">{{ String(offWorkCountdown.hours).padStart(2, '0') }}</span>
                  <span class="time-unit-label">时</span>
                </div>
                <span class="time-colon">:</span>
                <div class="time-unit">
                  <span class="time-value">{{ String(offWorkCountdown.minutes).padStart(2, '0') }}</span>
                  <span class="time-unit-label">分</span>
                </div>
                <span class="time-colon">:</span>
                <div class="time-unit">
                  <span class="time-value">{{ String(offWorkCountdown.seconds).padStart(2, '0') }}</span>
                  <span class="time-unit-label">秒</span>
                </div>
              </div>
              <!-- 上班前：上班倒计时 -->
              <div class="countdown-display small" v-else-if="workStatus.status === 'beforeWork' && onWorkCountdown">
                <div class="time-unit">
                  <span class="time-value" v-if="onWorkCountdown.days > 0">{{ onWorkCountdown.days }}</span>
                  <span class="time-value" v-else>{{ String(onWorkCountdown.hours).padStart(2, '0') }}</span>
                  <span class="time-unit-label">{{ onWorkCountdown.days > 0 ? '天' : '时' }}</span>
                </div>
                <span class="time-colon" v-if="onWorkCountdown.days === 0">:</span>
                <div class="time-unit" v-if="onWorkCountdown.days === 0">
                  <span class="time-value">{{ String(onWorkCountdown.minutes).padStart(2, '0') }}</span>
                  <span class="time-unit-label">分</span>
                </div>
              </div>
              <!-- 其他状态 -->
              <div class="countdown-status" v-else>
                <span class="status-message">{{ workStatus.message }}</span>
              </div>
            </div>
          </div>

          <!-- 进度条组 -->
          <div class="progress-bars">
            <div class="progress-item">
              <span class="progress-label">本月</span>
              <div class="progress-track">
                <div class="progress-fill month" :style="{ width: moyuData.monthProgress + '%' }"></div>
              </div>
              <span class="progress-value">{{ moyuData.monthProgress }}%</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">本周</span>
              <div class="progress-track">
                <div class="progress-fill week" :style="{ width: moyuData.weekProgress + '%' }"></div>
              </div>
              <span class="progress-value">{{ moyuData.weekProgress }}%</span>
            </div>
          </div>

          <!-- 假期卡片 -->
          <div class="holiday-cards">
            <div class="holiday-card weekend" v-if="moyuData.toWeekend > 0">
              <div class="holiday-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div class="holiday-info">
                <span class="holiday-name">周末</span>
                <span class="holiday-count">{{ moyuData.toWeekend }} 天</span>
              </div>
            </div>
            <div class="holiday-card" v-if="moyuData.nextHoliday">
              <div class="holiday-icon holiday">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="holiday-info">
                <span class="holiday-name">{{ moyuData.nextHoliday.name }}</span>
                <span class="holiday-count">{{ moyuData.nextHoliday.until }} 天 <small>({{ moyuData.nextHoliday.duration }}天假)</small></span>
              </div>
            </div>
          </div>

          <!-- 底部信息 -->
          <div class="footer-info">
            <div class="date-info">
              <span>{{ moyuData.weekday }}</span>
              <span class="divider">|</span>
              <span>{{ moyuData.lunarDate }}</span>
              <span class="divider">|</span>
              <span>{{ moyuData.zodiac }}年</span>
            </div>
          </div>

          <!-- 摸鱼格言 -->
          <div class="quote-text">{{ moyuData.quote }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { CloseOne } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import {
  getNextHoliday,
  getDaysToWeekend,
  getCountdownToOffWork,
  getCountdownToOnWork,
  getWorkStatus,
  calculateProgress,
  getZodiac,
  getSimpleLunarDate,
  MOYU_QUOTES
} from "@/utils/moyuCalendar";

const store = mainStore();

// Settings
const showSettings = ref(false);
const workSettings = reactive({
  onTime: '09:00',
  offTime: '18:00'
});

// Load settings from localStorage
onMounted(() => {
  const saved = localStorage.getItem('work_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      workSettings.onTime = parsed.onTime || '09:00';
      workSettings.offTime = parsed.offTime || '18:00';
    } catch (e) {
      // Use defaults
    }
  }
});

// Save work settings
const saveWorkSettings = () => {
  localStorage.setItem('work_settings', JSON.stringify(workSettings));
  // Trigger storage event for other components
  window.dispatchEvent(new StorageEvent('storage', { key: 'work_settings' }));
  ElMessage({ message: '设置已保存', type: 'success', duration: 1500 });
  showSettings.value = false;
};

const moyuData = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  weekday: '',
  lunarDate: '',
  zodiac: '',
  yearProgress: 0,
  monthProgress: 0,
  weekProgress: 0,
  toWeekend: 0,
  nextHoliday: null,
  quote: '摸鱼一时爽，一直摸鱼一直爽'
});

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const offWorkCountdown = ref(null);
const onWorkCountdown = ref(null);
const workStatus = ref({ status: 'working', label: '距离下班', message: '努力工作中' });
let countdownTimer = null;

// Gauge offset calculation (circle circumference = 2 * PI * r = 327)
const gaugeOffset = computed(() => {
  const circumference = 327;
  return circumference - (moyuData.yearProgress / 100) * circumference;
});

// Update countdown every second
const updateCountdown = () => {
  offWorkCountdown.value = getCountdownToOffWork(workSettings.offTime);
  onWorkCountdown.value = getCountdownToOnWork(workSettings.onTime);
  workStatus.value = getWorkStatus(workSettings.onTime, workSettings.offTime);
};

// Calculate moyu calendar data locally
const getMoyuData = () => {
  const now = new Date();

  // Basic date info
  moyuData.year = now.getFullYear();
  moyuData.month = now.getMonth() + 1;
  moyuData.day = now.getDate();
  moyuData.weekday = weekdays[now.getDay()];

  // Progress
  const progress = calculateProgress();
  moyuData.yearProgress = progress.year;
  moyuData.monthProgress = progress.month;
  moyuData.weekProgress = progress.week;

  // Weekend
  moyuData.toWeekend = getDaysToWeekend();

  // Next holiday
  moyuData.nextHoliday = getNextHoliday();

  // Lunar and zodiac
  moyuData.lunarDate = getSimpleLunarDate(now);
  moyuData.zodiac = getZodiac(moyuData.year);

  // Random quote
  moyuData.quote = MOYU_QUOTES[Math.floor(Math.random() * MOYU_QUOTES.length)];
};

onMounted(() => {
  getMoyuData();
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
});

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style lang="scss" scoped>
.moyu-calendar-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.moyu-calendar-content {
  width: 100%;
  max-width: 400px;
  background: linear-gradient(160deg, rgba(30, 30, 45, 0.98), rgba(15, 15, 25, 0.99));
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.moyu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  .moyu-title {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 1px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .settings-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px;
    border-radius: 10px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
  }

  .moyu-close {
    cursor: pointer;
    padding: 6px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.3s;

    &:hover {
      background: rgba(239, 68, 68, 0.3);
      border-color: rgba(239, 68, 68, 0.5);
      transform: scale(1.1);
    }
  }
}

.moyu-body {
  padding: 20px;
}

.settings-panel {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    label {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    input[type="time"] {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-size: 0.85rem;
      outline: none;

      &:focus {
        border-color: rgba(255, 107, 157, 0.5);
      }
    }
  }

  .save-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, rgba(255, 107, 157, 0.5), rgba(135, 206, 235, 0.5));
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

.dashboard {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.gauge-section {
  display: flex;
  flex-direction: column;
  align-items: center;

  .main-gauge {
    position: relative;
    width: 130px;
    height: 130px;

    .gauge-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .gauge-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.06);
      stroke-width: 8;
    }

    .gauge-fill {
      fill: none;
      stroke: url(#gaugeGradient);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 327;
      transition: stroke-dashoffset 1s ease;
    }

    .gauge-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .gauge-value {
        font-size: 2.8rem;
        font-weight: 700;
        background: linear-gradient(135deg, #ff6b9d, #87ceeb);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
      }

      .gauge-label {
        font-size: 0.9rem;
        opacity: 0.6;
        margin-top: 2px;
      }
    }
  }

  .year-progress-text {
    margin-top: 8px;
    text-align: center;
    font-size: 0.8rem;
    opacity: 0.7;

    strong {
      background: linear-gradient(135deg, #ff6b9d, #87ceeb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

.countdown-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .countdown-label {
    font-size: 0.85rem;
    opacity: 0.6;
    margin-bottom: 12px;
  }

  .countdown-display {
    display: flex;
    align-items: flex-start;

    &.small {
      .time-value {
        font-size: 1.8rem;
      }
    }

    .time-unit {
      display: flex;
      flex-direction: column;
      align-items: center;

      .time-value {
        font-size: 2.2rem;
        font-weight: 600;
        font-family: "UnidreamLED", monospace;
        line-height: 1;
      }

      .time-unit-label {
        font-size: 0.65rem;
        opacity: 0.5;
        margin-top: 4px;
      }
    }

    .time-colon {
      font-size: 2rem;
      opacity: 0.4;
      margin: 0 2px;
      line-height: 1;
    }
  }

  .countdown-status {
    .status-message {
      font-size: 1.3rem;
      font-weight: 600;
      background: linear-gradient(135deg, #a8ff78, #78ffd6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

.progress-bars {
  margin-bottom: 16px;

  .progress-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    .progress-label {
      width: 40px;
      font-size: 0.75rem;
      opacity: 0.6;
    }

    .progress-track {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 2px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.6s ease;

        &.month {
          background: linear-gradient(90deg, #87ceeb, #5f9ea0);
        }

        &.week {
          background: linear-gradient(90deg, #ffd700, #ffa500);
        }
      }
    }

    .progress-value {
      width: 36px;
      text-align: right;
      font-size: 0.75rem;
      opacity: 0.8;
    }
  }
}

.holiday-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;

  .holiday-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }

    .holiday-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 107, 157, 0.15);
      color: #ff6b9d;

      svg {
        width: 18px;
        height: 18px;
      }

      &.holiday {
        background: rgba(135, 206, 235, 0.15);
        color: #87ceeb;
      }
    }

    .holiday-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .holiday-name {
        font-size: 0.85rem;
        font-weight: 500;
      }

      .holiday-count {
        font-size: 0.75rem;
        opacity: 0.6;

        small {
          opacity: 0.7;
        }
      }
    }
  }
}

.footer-info {
  text-align: center;
  margin-bottom: 12px;

  .date-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.8rem;
    opacity: 0.5;

    .divider {
      opacity: 0.3;
    }
  }
}

.quote-text {
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.4;
  font-style: italic;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

// Animations
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 420px) {
  .dashboard {
    flex-direction: column;
    align-items: center;
  }

  .countdown-section {
    align-items: center;

    .countdown-label {
      margin-top: 12px;
    }
  }

  .holiday-cards {
    flex-direction: column;
  }
}
</style>
