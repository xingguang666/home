<template>
  <!-- API监测面板 -->
  <Transition name="fade">
    <div v-if="store.apiMonitorOpen" class="api-monitor" @click.self="closeMonitor">
      <div class="monitor-panel">
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <Icon size="20"><LaptopCode /></Icon>
            <span>API 接口监测</span>
          </div>
          <button class="close-btn" @click="closeMonitor">
            <CloseOne theme="filled" size="18" fill="#fff" />
          </button>
        </div>

        <!-- 状态概览 -->
        <div class="status-overview">
          <div class="status-item success">
            <span class="count">{{ successCount }}</span>
            <span class="label">正常</span>
          </div>
          <div class="status-item error">
            <span class="count">{{ errorCount }}</span>
            <span class="label">异常</span>
          </div>
          <div class="status-item pending">
            <span class="count">{{ pendingCount }}</span>
            <span class="label">检测中</span>
          </div>
        </div>

        <!-- API网格 -->
        <div class="api-grid">
          <div
            v-for="api in apiList"
            :key="api.id"
            class="api-card"
            :class="api.status"
          >
            <div class="card-icon">
              <CheckOne v-if="api.status === 'success'" theme="filled" size="18" fill="#67c23a" />
              <CloseOne v-else-if="api.status === 'error'" theme="filled" size="18" fill="#f56c6c" />
              <Time v-else theme="filled" size="18" fill="#e6a23c" />
            </div>
            <div class="card-info">
              <span class="card-name">{{ api.name }}</span>
              <span class="card-time">{{ api.responseTime || '检测中...' }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="panel-footer">
          <button class="action-btn refresh" @click="refreshAllApis">
            <RefreshOne theme="filled" size="16" fill="#fff" />
            <span>刷新检测</span>
          </button>
          <button class="action-btn clear" @click="clearApiList">
            <DeleteFour theme="filled" size="16" fill="#fff" />
            <span>清空记录</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { CloseOne, RefreshOne, DeleteFour, CheckOne, Time } from "@icon-park/vue-next";
import { LaptopCode } from "@vicons/fa";
import { Icon } from "@vicons/utils";
import { mainStore } from "@/store";

const store = mainStore();

// API列表数据
const apiList = ref([]);

// 统计数据
const successCount = computed(() => apiList.value.filter(a => a.status === 'success').length);
const errorCount = computed(() => apiList.value.filter(a => a.status === 'error').length);
const pendingCount = computed(() => apiList.value.filter(a => a.status === 'pending').length);

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    success: '正常',
    error: '异常',
    pending: '检测中'
  };
  return texts[status] || '未知';
};

// 关闭监测面板
const closeMonitor = () => {
  store.apiMonitorOpen = false;
};

// 清空记录
const clearApiList = () => {
  apiList.value = [];
};

// 检测单个API
const checkApi = async (apiConfig) => {
  const startTime = Date.now();
  const apiItem = {
    id: apiConfig.id || Date.now() + Math.random(),
    name: apiConfig.name,
    url: apiConfig.url,
    status: 'pending',
    responseTime: null
  };

  apiList.value.unshift(apiItem);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    await fetch(apiConfig.url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const endTime = Date.now();

    const index = apiList.value.findIndex(a => a.id === apiItem.id);
    if (index !== -1) {
      apiList.value[index].status = 'success';
      apiList.value[index].responseTime = `${endTime - startTime}ms`;
    }
  } catch {
    const endTime = Date.now();
    const index = apiList.value.findIndex(a => a.id === apiItem.id);
    if (index !== -1) {
      apiList.value[index].status = 'error';
      apiList.value[index].responseTime = `${endTime - startTime}ms`;
    }
  }
};

// 刷新所有API检测
const refreshAllApis = async () => {
  const base = window.location.origin;
  const apis = [
    { id: 'hitokoto', name: '一言', url: 'https://v1.hitokoto.cn' },
    { id: 'music', name: '音乐', url: import.meta.env.VITE_SONG_API || 'https://api.injahow.cn/meting/' },
    { id: 'netease', name: '网易云', url: 'https://oiapi.net/api/NeteasePlaylistDetail' },
    { id: 'weather', name: '天气', url: 'https://restapi.amap.com/v3/weather/weatherInfo' },
    { id: 'greeting', name: '问候语', url: 'https://api.kuleu.com/api/getGreetingMessage' },
    { id: 'baiduhot', name: '百度热搜', url: 'https://v2.xxapi.cn/api/baiduhot' },
    { id: 'zhihu', name: '知乎热榜', url: '/api/daily-hot/zhihu' },
    { id: 'bilibili', name: 'B站热榜', url: '/api/daily-hot/bilibili' },
    { id: 'weread', name: '微信读书', url: '/api/daily-hot/weread' },
    { id: 'douban', name: '豆瓣讨论', url: '/api/daily-hot/douban-group' },
    { id: 'github', name: 'GitHub', url: '/api/daily-hot/github' },
    { id: 'weibo', name: '微博热榜', url: 'https://oiapi.net/api/WeiBoHot' },
    { id: 'douyin', name: '抖音热榜', url: 'https://oiapi.net/api/DouYinHot' },
    { id: 'bing', name: '必应壁纸', url: `${base}/api/bing` },
    { id: 'dongman', name: '随机动漫', url: `${base}/api/dongman` },
    { id: 'acg', name: '二次元', url: `${base}/api/acg` },
    { id: '4k', name: '4K壁纸', url: `${base}/api/4k` },
  ];

  apiList.value = [];
  apis.forEach(api => checkApi(api));
};

// 监听面板打开
watch(() => store.apiMonitorOpen, (val) => {
  if (val && apiList.value.length === 0) {
    refreshAllApis();
  }
});
</script>

<style lang="scss" scoped>
.api-monitor {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fade 0.3s ease;
}

.monitor-panel {
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(135, 206, 235, 0.2));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.3s;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.95;

    &:hover {
      background: rgba(255, 107, 157, 0.5);
      border-color: rgba(255, 107, 157, 0.7);
      transform: scale(1.05);
      opacity: 1;
    }
  }
}

.status-overview {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.1);

  .status-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .count {
      font-size: 1.8rem;
      font-weight: 600;
    }

    .label {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    &.success .count { color: #67c23a; }
    &.error .count { color: #f56c6c; }
    &.pending .count { color: #e6a23c; }
  }
}

.api-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  .api-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 14px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s;
    text-align: center;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
    }

    &.success {
      border-color: rgba(103, 194, 58, 0.3);
      .card-icon {
        background: rgba(103, 194, 58, 0.15);
      }
    }

    &.error {
      border-color: rgba(245, 108, 108, 0.3);
      .card-icon {
        background: rgba(245, 108, 108, 0.15);
      }
    }

    &.pending {
      border-color: rgba(230, 162, 60, 0.3);
      .card-icon {
        background: rgba(230, 162, 60, 0.15);
      }
    }

    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.1);
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;

      .card-name {
        font-size: 0.85rem;
        color: #fff;
        font-weight: 500;
      }

      .card-time {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    &.refresh:hover {
      background: rgba(103, 194, 58, 0.3);
      border-color: rgba(103, 194, 58, 0.5);
    }

    &.clear:hover {
      background: rgba(245, 108, 108, 0.3);
      border-color: rgba(245, 108, 108, 0.5);
    }
  }
}

// 响应式
@media (max-width: 600px) {
  .monitor-panel {
    width: 95%;
    max-height: 90vh;
  }

  .api-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    .api-card {
      padding: 12px 6px;

      .card-icon {
        width: 32px;
        height: 32px;
      }

      .card-info .card-name {
        font-size: 0.8rem;
      }
    }
  }

  .status-overview {
    gap: 24px;
    .status-item .count {
      font-size: 1.5rem;
    }
  }
}
</style>
