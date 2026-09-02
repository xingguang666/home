<template>
  <!-- 热榜弹窗 -->
  <Transition name="fade">
    <div v-if="store.hotListOpen" class="hotlist-modal" @click.self="closeModal">
      <Transition name="zoom">
        <div class="modal-container" v-if="store.hotListOpen" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <div class="header-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="tab-btn"
                :class="{ active: currentTab === tab.key }"
                @click="switchTab(tab.key)"
              >
                <component :is="tab.icon" theme="filled" size="16" />
                <span>{{ tab.name }}</span>
              </button>
            </div>
            <div class="header-actions">
              <button class="refresh-btn" @click="refreshHotList" :disabled="isLoading">
                <RefreshOne theme="filled" size="16" :class="{ spinning: isLoading }" />
              </button>
              <button class="close-btn" @click="closeModal">
                <CloseOne theme="filled" size="18" fill="#fff" />
              </button>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="modal-body">
            <!-- 加载中 -->
            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner"></div>
              <span>加载中...</span>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="error-state">
              <Error theme="filled" size="40" fill="#f56c6c" />
              <span>{{ error }}</span>
              <button class="retry-btn" @click="fetchHotList">重试</button>
            </div>

            <!-- 热榜列表 -->
            <div v-else class="hot-list">
              <TransitionGroup name="list">
                <a
                  v-for="(item, index) in hotList"
                  :key="item.id || index"
                  class="hot-item"
                  @click.prevent="openDetail(item)"
                >
                  <div class="item-rank" :class="getRankClass(index)">
                    {{ index + 1 }}
                  </div>
                  <div class="item-platform">
                    <component :is="currentTabIcon" theme="filled" size="14" />
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ item.title }}</div>
                  </div>
                </a>
              </TransitionGroup>
            </div>
          </div>

          <!-- 底部信息 -->
          <div class="modal-footer">
            <span>数据来源：{{ currentTabName }}</span>
            <span>更新时间：{{ updateTime }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { Fire, CloseOne, RefreshOne, Error, VideoOne, Search, ReadBook, Youtube, Book, Github } from "@icon-park/vue-next";
import { mainStore } from "@/store";

const store = mainStore();

// 热榜配置
const tabs = [
  {
    key: 'baidu',
    name: '百度',
    icon: Search,
    apiUrl: 'https://v2.xxapi.cn/api/baiduhot',
    dataField: 'data',
    getUrl: (item) => item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.title)}`
  },
  {
    key: 'zhihu',
    name: '知乎',
    icon: ReadBook,
    apiUrl: '/api/daily-hot/zhihu?limit=20',
    dataField: 'data',
    getUrl: (item) => item.url || `https://www.zhihu.com/search?q=${encodeURIComponent(item.title)}`
  },
  {
    key: 'weibo',
    name: '微博',
    icon: Fire,
    apiUrl: 'https://oiapi.net/api/WeiBoHot',
    dataField: 'data',
    getUrl: (item) => item.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(item.title)}`
  },
  {
    key: 'douyin',
    name: '抖音',
    icon: VideoOne,
    apiUrl: 'https://oiapi.net/api/DouYinHot',
    dataField: 'data',
    getUrl: (item) => item.url || `https://www.douyin.com/search/${encodeURIComponent(item.title)}`
  },
  {
    key: 'bilibili',
    name: 'B站',
    icon: Youtube,
    apiUrl: '/api/daily-hot/bilibili?limit=20',
    dataField: 'data',
    getUrl: (item) => item.url || `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.title)}`
  },
  {
    key: 'weread',
    name: '微信读书',
    icon: Book,
    apiUrl: '/api/daily-hot/weread?limit=20',
    dataField: 'data',
    getUrl: (item) => item.url || `https://weread.qq.com/web/search/books?keyword=${encodeURIComponent(item.title)}`
  },
  {
    key: 'douban',
    name: '豆瓣',
    icon: Fire,
    apiUrl: '/api/daily-hot/douban-group?limit=20',
    dataField: 'data',
    getUrl: (item) => item.url || `https://www.douban.com/search?q=${encodeURIComponent(item.title)}`
  },
  {
    key: 'github',
    name: 'GitHub',
    icon: Github,
    apiUrl: '/api/daily-hot/github?limit=20',
    dataField: 'data',
    getUrl: (item) => item.url || `https://github.com/search?q=${encodeURIComponent(item.title)}`
  }
];

// 数据状态
const currentTab = ref('baidu');
const hotList = ref([]);
const isLoading = ref(false);
const error = ref(null);
const updateTime = ref('');

// 当前热榜名称
const currentTabName = computed(() => {
  const tab = tabs.find(t => t.key === currentTab.value);
  return tab ? tab.name : '';
});

// 当前热榜图标
const currentTabIcon = computed(() => {
  const tab = tabs.find(t => t.key === currentTab.value);
  return tab ? tab.icon : Fire;
});

// 切换热榜
const switchTab = (key) => {
  if (currentTab.value !== key) {
    currentTab.value = key;
    hotList.value = [];
    fetchHotList();
  }
};

// 获取热榜数据
const fetchHotList = async () => {
  isLoading.value = true;
  error.value = null;

  const tab = tabs.find(t => t.key === currentTab.value);
  if (!tab) return;

  try {
    const response = await fetch(tab.apiUrl);
    const result = await response.json();

    // 不同API返回格式处理
    let dataList = [];
    if (tab.key === 'zhihu' || tab.key === 'bilibili' || tab.key === 'weread' || tab.key === 'douban' || tab.key === 'github') {
      // 新API格式: code为数字，data为数组
      if (result.code === 200 && Array.isArray(result.data)) {
        dataList = result.data;
      }
    } else {
      // 旧API格式
      const isSuccess = result.code === 200 || result.code === 1;
      if (isSuccess && result.data) {
        dataList = result.data;
      }
    }

    if (dataList.length > 0) {
      hotList.value = dataList;
      updateTime.value = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      error.value = result.msg || result.message || '获取数据失败';
    }
  } catch (err) {
    error.value = '网络请求失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};

// 刷新热榜
const refreshHotList = () => {
  if (!isLoading.value) {
    fetchHotList();
  }
};

// 打开详情
const openDetail = (item) => {
  const tab = tabs.find(t => t.key === currentTab.value);
  if (tab && tab.getUrl) {
    const url = tab.getUrl(item);
    window.open(url, '_blank');
  }
};

// 获取排名样式
const getRankClass = (index) => {
  if (index === 0) return 'rank-1';
  if (index === 1) return 'rank-2';
  if (index === 2) return 'rank-3';
  return '';
};

// 关闭弹窗
const closeModal = () => {
  store.hotListOpen = false;
};

// 监听弹窗打开
watch(() => store.hotListOpen, (val) => {
  if (val && hotList.value.length === 0) {
    fetchHotList();
  }
});
</script>

<style lang="scss" scoped>
.hotlist-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  background: linear-gradient(145deg, rgba(40, 40, 55, 0.95), rgba(25, 25, 40, 0.98));
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: zoom 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  gap: 16px;

  .header-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      &.active {
        background: linear-gradient(135deg, rgba(255, 107, 157, 0.3), rgba(135, 206, 235, 0.3));
        border-color: rgba(255, 107, 157, 0.5);
        color: #fff;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    .refresh-btn,
    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.35);
      padding: 8px;
      border-radius: 10px;
      cursor: pointer;
      color: #fff;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.95;

      &:hover {
        background: rgba(255, 107, 157, 0.5);
        border-color: rgba(255, 107, 157, 0.7);
        color: #fff;
        opacity: 1;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ff6b6b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.retry-btn {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05);
  }
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }

  .item-rank {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);

    &.rank-1 {
      background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      color: #fff;
    }

    &.rank-2 {
      background: linear-gradient(135deg, #ffa940, #ff8c00);
      color: #fff;
    }

    &.rank-3 {
      background: linear-gradient(135deg, #ffd700, #ffcc00);
      color: #fff;
    }
  }

  .item-platform {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
  }

  .item-content {
    flex: 1;
    min-width: 0;

    .item-title {
      font-size: 0.9rem;
      color: #fff;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active {
  animation: zoom 0.3s ease-out;
}

.zoom-leave-active {
  animation: zoom 0.2s ease-in reverse;
}

@keyframes zoom {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// 响应式
@media (max-width: 520px) {
  .modal-container {
    max-height: 90vh;
  }

  .modal-header {
    flex-direction: column;
    gap: 12px;

    .header-tabs {
      width: 100%;
      justify-content: center;
    }

    .header-actions {
      position: absolute;
      top: 16px;
      right: 16px;
    }
  }

  .hot-item .item-content .item-title {
    font-size: 0.85rem;
  }
}
</style>
