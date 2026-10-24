<template>
  <div class="rss-card cards">
    <div class="line">
      <Icon size="18">
        <Rss />
      </Icon>
      <span class="title">RSS 订阅</span>
      <span class="toggle" @click="showManage = !showManage">{{ showManage ? "收起" : "管理" }}</span>
      <span class="refresh" title="刷新" @click="loadAll">↻</span>
    </div>

    <!-- 订阅源管理 -->
    <div v-if="showManage" class="manage">
      <div class="add-form">
        <input v-model="newFeedName" type="text" placeholder="名称（如：我的博客）" maxlength="10" class="name-input" />
        <input v-model="newFeedUrl" type="text" placeholder="RSS 地址 https://…" class="url-input" @keydown.enter="addFeed" />
        <span class="add-btn" :class="{ disabled: !canAdd }" @click="addFeed">添加</span>
      </div>
      <div v-for="feed in feeds" :key="feed.id" class="feed-row">
        <span class="feed-name text-hidden">{{ feed.name }}</span>
        <span class="feed-url text-hidden">{{ feed.url }}</span>
        <span class="del" title="删除" @click="removeFeed(feed.id)">×</span>
      </div>
    </div>

    <!-- 订阅源选择 -->
    <div v-if="feeds.length > 1" class="feed-tabs">
      <span
        v-for="feed in feeds"
        :key="feed.id"
        :class="['feed-tab', { active: feed.id === currentFeedId }]"
        @click="switchFeed(feed.id)"
      >
        {{ feed.name }}
      </span>
    </div>

    <!-- 文章列表 -->
    <div v-if="loading" class="status">正在拉取…</div>
    <div v-else-if="error" class="status error">{{ error }}</div>
    <div v-else-if="items.length" class="list">
      <a
        v-for="item in items"
        :key="item.link"
        class="item"
        :href="item.link"
        target="_blank"
        rel="noopener"
      >
        <span class="item-title text-hidden">{{ item.title }}</span>
        <span class="item-date">{{ item.dateText }}</span>
      </a>
    </div>
    <div v-else class="status empty">
      {{ feeds.length ? "该源暂无内容" : "点「管理」添加一个 RSS 源，如你的博客或友链" }}
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { Rss } from "@vicons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const STORAGE_KEY = "rss_feeds";
const CACHE_PREFIX = "rss_cache_";
const CACHE_TTL = 15 * 60 * 1000;

// 可选自部署代理（.env 的 VITE_RSS_PROXY，如 https://xxx.vercel.app/?url=）
// 设置后直接走该代理，跳过公共回退链，稳定且不受公共服务限流影响。
const RSS_PROXY = import.meta.env.VITE_RSS_PROXY || "";

const loadFeeds = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const feeds = ref(loadFeeds());
const showManage = ref(false);
const currentFeedId = ref(feeds.value[0]?.id ?? null);
const loading = ref(false);
const error = ref(null);
const items = ref([]);

const newFeedName = ref("");
const newFeedUrl = ref("");
const canAdd = computed(() => /^https?:\/\/.+/.test(newFeedUrl.value.trim()));

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds.value.map(({ id, name, url }) => ({ id, name, url }))));
};

const addFeed = () => {
  if (!canAdd.value) return;
  const feed = {
    id: Date.now(),
    name: newFeedName.value.trim() || new URL(newFeedUrl.value.trim()).hostname,
    url: newFeedUrl.value.trim(),
  };
  feeds.value = [...feeds.value, feed];
  persist();
  newFeedName.value = "";
  newFeedUrl.value = "";
  showManage.value = false;
  switchFeed(feed.id, true);
};

const removeFeed = (id) => {
  feeds.value = feeds.value.filter((f) => f.id !== id);
  persist();
  localStorage.removeItem(CACHE_PREFIX + id);
  if (currentFeedId.value === id) {
    currentFeedId.value = feeds.value[0]?.id ?? null;
    loadCurrent(true);
  }
};

const switchFeed = (id, force = false) => {
  if (currentFeedId.value !== id || force) {
    currentFeedId.value = id;
    loadCurrent(force);
  }
};

// —— 数据拉取：代理链回退 ——
// rss2json（JSON 直出）→ allorigins（raw XML）→ 直连（依赖源站 CORS）
const fetchViaRss2Json = async (url) => {
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=8`);
  const data = await res.json();
  if (data.status !== "ok" || !Array.isArray(data.items)) throw new Error("rss2json 数据异常");
  return data.items.map((i) => ({ title: i.title, link: i.link, pubDate: i.pubDate }));
};

const parseXml = (text) => {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("XML 解析失败");
  const entries = [...doc.querySelectorAll("item, entry")].slice(0, 8);
  if (!entries.length) throw new Error("未解析到条目");
  return entries.map((e) => ({
    title: e.querySelector("title")?.textContent?.trim() || "(无标题)",
    link: e.querySelector("link")?.getAttribute("href") || e.querySelector("link")?.textContent?.trim() || "",
    pubDate: e.querySelector("pubDate, published, updated")?.textContent || "",
  }));
};

const fetchViaProxy = async (proxyBase, url) => {
  const res = await fetch(proxyBase + encodeURIComponent(url));
  if (!res.ok) throw new Error(`代理响应 ${res.status}`);
  return parseXml(await res.text());
};

const fetchFeed = async (url) => {
  const chain = [];
  if (RSS_PROXY) chain.push(() => fetchViaProxy(RSS_PROXY, url));
  chain.push(
    () => fetchViaRss2Json(url),
    () => fetchViaProxy("https://api.allorigins.win/raw?url=", url),
    async () => parseXml(await (await fetch(url)).text()),
  );

  let lastErr;
  for (const attempt of chain) {
    try {
      return await attempt();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("全部获取方式失败");
};

const loadCurrent = async (force = false) => {
  const feed = feeds.value.find((f) => f.id === currentFeedId.value);
  if (!feed) {
    items.value = [];
    error.value = null;
    return;
  }

  // 15 分钟缓存，避免高频请求公共服务
  const cacheKey = CACHE_PREFIX + feed.id;
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.ts < CACHE_TTL && Array.isArray(cached.items)) {
        items.value = cached.items;
        error.value = null;
        return;
      }
    } catch {
      // 缓存损坏则重新拉取
    }
  }

  loading.value = true;
  error.value = null;
  try {
    const list = await fetchFeed(feed.url);
    items.value = list
      .filter((i) => i.link)
      .map((i) => ({
        ...i,
        dateText: i.pubDate && dayjs(i.pubDate).isValid() ? dayjs(i.pubDate).fromNow() : "",
      }));
    if (!items.value.length) throw new Error("该源没有可展示的条目");
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: items.value }));
  } catch (e) {
    error.value = `获取失败（${e.message}）。公共转换服务可能限流，可在 .env 配置 VITE_RSS_PROXY 自部署代理`;
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const loadAll = () => {
  if (!loading.value) loadCurrent(true);
};

watch(currentFeedId, () => {
  /* switchFeed 已触发加载 */
});

onMounted(() => loadCurrent());
onBeforeUnmount(() => {
  /* 无全局监听需要清理 */
});
</script>

<style lang="scss" scoped>
.rss-card {
  padding: 14px 18px;
  margin-top: 0.75rem;
  font-family: var(--serif-cn);

  .line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;

    .title {
      font-size: 1rem;
      letter-spacing: 0.06em;
      color: var(--paper-pure);
    }

    .toggle,
    .refresh {
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--paper-soft);
      cursor: pointer;
      transition: color var(--dur-quick) var(--ease-soft);

      &:hover {
        color: var(--paper-pure);
      }
    }

    .refresh {
      margin-left: auto;
      font-size: 0.9rem;
    }
  }

  .manage {
    margin-bottom: 10px;

    .add-form {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;

      input {
        background: var(--input-bg);
        border: 1px solid var(--input-border);
        border-radius: 4px;
        padding: 5px 8px;
        color: var(--paper-warm);
        font-family: var(--serif-cn);
        font-size: 0.8125rem;
        outline: none;
        transition: border-color var(--dur-quick) var(--ease-soft);

        &:focus {
          border-color: var(--input-border-focus);
        }

        &::placeholder {
          color: var(--paper-muted);
        }
      }

      .name-input {
        width: 130px;
        flex: none;
      }

      .url-input {
        flex: 1;
        min-width: 0;
      }

      .add-btn {
        font-size: 0.8125rem;
        color: var(--paper-soft);
        cursor: pointer;
        align-self: center;
        transition: color var(--dur-quick) var(--ease-soft);

        &:hover {
          color: var(--paper-pure);
        }

        &.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }

    .feed-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 2px;
      font-size: 0.8125rem;
      border-bottom: 1px solid var(--row-divider);

      .feed-name {
        color: var(--paper-warm);
        flex: none;
      }

      .feed-url {
        flex: 1;
        min-width: 0;
        color: var(--paper-muted);
        font-family: var(--mono);
        font-size: 0.7rem;
      }

      .del {
        color: var(--paper-muted);
        cursor: pointer;
        padding: 0 2px;

        &:hover {
          color: var(--cinnabar);
        }
      }
    }
  }

  .feed-tabs {
    display: flex;
    gap: var(--sp-xs);
    margin-bottom: 8px;
    flex-wrap: wrap;

    .feed-tab {
      font-size: var(--caption, 0.72rem);
      letter-spacing: 0.08em;
      color: var(--paper-soft);
      cursor: pointer;
      padding: 0 2px;
      border-bottom: 2px solid transparent;
      transition:
        color var(--dur-quick) var(--ease-soft),
        border-color var(--dur-quick) var(--ease-soft);

      &.active {
        color: var(--paper-pure);
        border-bottom-color: var(--cinnabar);
      }
    }
  }

  .status {
    font-size: 0.8125rem;
    color: var(--paper-soft);
    padding: 4px 0;
    line-height: 1.6;

    &.error {
      color: var(--paper-muted);
    }

    &.empty {
      color: var(--paper-muted);
    }
  }

  .list {
    display: flex;
    flex-direction: column;

    .item {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 5px 4px;
      text-decoration: none;
      border-bottom: 1px solid var(--row-divider);
      transition: background var(--dur-quick) var(--ease-soft);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--row-hover);

        .item-title {
          color: var(--paper-pure);
        }
      }

      .item-title {
        flex: 1;
        min-width: 0;
        font-size: 0.8438rem;
        color: var(--paper-warm);
        transition: color var(--dur-quick) var(--ease-soft);
      }

      .item-date {
        flex: none;
        font-family: var(--mono);
        font-size: 0.7rem;
        color: var(--paper-muted);
      }
    }
  }
}
</style>
