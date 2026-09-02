<template>
  <div class="weather" v-if="weatherInfo.city && weatherInfo.weather">
    <span>{{ weatherInfo.city }}&nbsp;</span>
    <span>{{ weatherInfo.weather }}&nbsp;</span>
    <span v-if="weatherInfo.temperature != null">{{ weatherInfo.temperature }}℃</span>
    <span class="sm-hidden" v-if="weatherInfo.winddirection">
      &nbsp;{{ formatWindDirection(weatherInfo.winddirection) }}&nbsp;
    </span>
    <span class="sm-hidden" v-if="weatherInfo.windpower">{{ weatherInfo.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else-if="isLoading">
    <span>正在获取天气...</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { getWeather } from "@/api";

// 天气数据
const weatherInfo = reactive({
  city: null,
  weather: null,
  temperature: null,
  winddirection: null,
  windpower: null,
});

const isLoading = ref(false);

// 格式化风向描述
const formatWindDirection = (direction) => {
  if (!direction) return "";
  return direction.endsWith("风") ? direction : direction + "风";
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
});
</script>
