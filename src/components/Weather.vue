<template>
  <!-- 天气主行：点击展开详情（stop 防止触发时间卡翻转） -->
  <div class="weather" v-if="weatherInfo.city && weatherInfo.weather" @click.stop="toggleDetail">
    <span>{{ weatherInfo.city }}&nbsp;</span>
    <span>{{ weatherInfo.weather }}&nbsp;</span>
    <span v-if="weatherInfo.temperature != null">{{ weatherInfo.temperature }}℃</span>
    <span class="sm-hidden" v-if="weatherInfo.winddirection">
      &nbsp;{{ formatWindDirection(weatherInfo.winddirection) }}&nbsp;
    </span>
    <span class="sm-hidden" v-if="weatherInfo.windpower">{{ weatherInfo.windpower }}&nbsp;级</span>
    <span class="detail-hint" :class="{ open: showDetail }">⌄</span>

    <!-- 天气详情浮层：逐小时 / 日出日落 / PM2.5（Open-Meteo） -->
    <Transition name="fade-up">
      <div v-if="showDetail" class="detail-popover" @click.stop>
        <template v-if="detailLoading">
          <div class="detail-status">正在获取详情…</div>
        </template>
        <template v-else-if="detail">
          <div class="hourly-strip">
            <div v-for="hour in detail.hourly" :key="hour.time" class="hour">
              <span class="h-time">{{ hour.time.slice(11, 13) }}时</span>
              <span class="h-glyph">{{ weatherGlyph(hour.code) }}</span>
              <span class="h-temp">{{ hour.temp }}°</span>
            </div>
          </div>
          <div class="detail-row">
            <span v-if="detail.sunrise">日出 {{ detail.sunrise }}</span>
            <span v-if="detail.sunset">日落 {{ detail.sunset }}</span>
            <span v-if="detail.pm25 != null">PM2.5 {{ detail.pm25 }}（{{ detail.pm25Level }}）</span>
          </div>
        </template>
        <template v-else>
          <div class="detail-status">详情获取失败，稍后再试</div>
        </template>
      </div>
    </Transition>
  </div>
  <div class="weather" v-else-if="isLoading">
    <span>正在获取天气...</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import { getWeather, getWeatherDetail } from "@/api";

// 天气数据
const weatherInfo = reactive({
  city: null,
  weather: null,
  temperature: null,
  winddirection: null,
  windpower: null,
  coords: null,
});

const isLoading = ref(false);

// 详情浮层状态
const showDetail = ref(false);
const detailLoading = ref(false);
const detail = ref(null);
let detailLoaded = false;

// 格式化风向描述
const formatWindDirection = (direction) => {
  if (!direction) return "";
  return direction.endsWith("风") ? direction : direction + "风";
};

// WMO weather code → 表意符号
const weatherGlyph = (code) => {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
};

// 展开 / 收起详情（首次展开时拉取 Open-Meteo 数据）
const toggleDetail = () => {
  showDetail.value = !showDetail.value;
  if (showDetail.value && !detailLoaded) {
    detailLoading.value = true;
    getWeatherDetail({
      latitude: weatherInfo.coords?.latitude,
      longitude: weatherInfo.coords?.longitude,
      city: weatherInfo.city,
    })
      .then((data) => {
        detail.value = data;
        detailLoaded = true;
      })
      .catch(() => {
        detail.value = null;
      })
      .finally(() => {
        detailLoading.value = false;
      });
  }
};

// 点击浮层外关闭
const onDocClick = () => {
  showDetail.value = false;
};

// 获取天气数据
const getWeatherData = async () => {
  isLoading.value = true;

  try {
    // getWeather 内部已处理：浏览器定位 -> 逆地理编码 -> 高德天气 -> 降级 IP 定位
    const weatherRes = await getWeather();

    if (weatherRes && weatherRes.code === 1 && weatherRes.data) {
      const { data } = weatherRes;
      const { current } = data;

      weatherInfo.city = data.city;
      weatherInfo.weather = current.weather;
      weatherInfo.temperature = current.temp;
      weatherInfo.winddirection = current.wind;
      weatherInfo.windpower = current.windSpeed ? current.windSpeed.replace("级", "") : null;
      weatherInfo.coords = data.coords || null;
    }
  } catch {
    // 清空数据，显示错误状态
    weatherInfo.city = null;
    weatherInfo.weather = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  getWeatherData();
  document.addEventListener("click", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>

<style lang="scss" scoped>
.weather {
  position: relative;
  cursor: pointer;

  .detail-hint {
    display: inline-block;
    margin-left: 4px;
    font-size: 0.9em;
    opacity: 0.5;
    transition:
      transform var(--dur-quick) var(--ease-soft),
      opacity var(--dur-quick) var(--ease-soft);

    &.open {
      transform: rotate(180deg);
      opacity: 0.9;
    }
  }
}

.detail-popover {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: min(520px, 82vw);
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(42, 38, 32, 0.92), rgba(26, 24, 21, 0.88));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(232, 228, 220, 0.14);
  border-top-color: rgba(232, 228, 220, 0.28);
  box-shadow:
    0 12px 32px 0 rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(232, 228, 220, 0.1);
  font-family: var(--serif-cn);
  cursor: default;

  .detail-status {
    text-align: center;
    font-size: 0.8125rem;
    color: var(--paper-soft);
    padding: 6px 0;
  }

  .hourly-strip {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(232, 228, 220, 0.16);
      border-radius: 2px;
    }

    .hour {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 4px 7px;
      border-radius: 6px;
      transition: background var(--dur-quick) var(--ease-soft);

      &:hover {
        background: rgba(232, 228, 220, 0.06);
      }

      .h-time {
        font-family: var(--mono);
        font-size: 0.68rem;
        color: var(--paper-muted);
        letter-spacing: 0.04em;
      }

      .h-glyph {
        font-size: 0.95rem;
        line-height: 1.2;
      }

      .h-temp {
        font-family: var(--mono);
        font-size: 0.8rem;
        color: var(--paper-warm);
      }
    }
  }

  .detail-row {
    display: flex;
    justify-content: center;
    gap: var(--sp-xs);
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(232, 228, 220, 0.08);
    font-size: 0.75rem;
    color: var(--paper-soft);
    letter-spacing: 0.04em;
    flex-wrap: wrap;
  }
}

// 浮层出入场：只用透明度与轻微位移，遵守缓动纪律
.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity var(--dur-quick) var(--ease-soft),
    transform var(--dur-quick) var(--ease-soft);
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
