<template>
  <div class="search-card cards">
    <!-- 搜索引擎切换 -->
    <div class="engines">
      <span
        v-for="engine in engines"
        :key="engine.name"
        :class="['engine', { active: engine.name === currentEngine }]"
        @click="switchEngine(engine.name)"
      >
        {{ engine.label }}
      </span>
    </div>
    <!-- 搜索输入框 -->
    <div class="input-wrap" :class="{ focusing: isFocusing }">
      <Icon size="16">
        <Search />
      </Icon>
      <input
        ref="inputRef"
        v-model="keyword"
        type="text"
        :placeholder="`在${currentEngineLabel}搜索，按 / 快速聚焦`"
        @keydown.enter="doSearch"
        @focus="isFocusing = true"
        @blur="isFocusing = false"
      />
      <span class="go" @click="doSearch">搜索</span>
    </div>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { Search } from "@vicons/fa";

// 搜索引擎配置（URL 模板来自各引擎公开搜索参数）
const engines = [
  { name: "bing", label: "必应", url: "https://www.bing.com/search?q=" },
  { name: "baidu", label: "百度", url: "https://www.baidu.com/s?wd=" },
  { name: "google", label: "Google", url: "https://www.google.com/search?q=" },
  { name: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
];

const ENGINE_KEY = "search_engine";
const DEFAULT_ENGINE = "bing";

const inputRef = ref(null);
const keyword = ref("");
const isFocusing = ref(false);
const currentEngine = ref(localStorage.getItem(ENGINE_KEY) || DEFAULT_ENGINE);

// 若存储的引擎名无效则回退默认
if (!engines.some((e) => e.name === currentEngine.value)) {
  currentEngine.value = DEFAULT_ENGINE;
}

const currentEngineLabel = computed(
  () => engines.find((e) => e.name === currentEngine.value)?.label ?? "",
);

// 切换引擎（持久化）
const switchEngine = (name) => {
  currentEngine.value = name;
  localStorage.setItem(ENGINE_KEY, name);
};

// 执行搜索：新标签页打开
const doSearch = () => {
  const word = keyword.value.trim();
  if (!word) return;
  const engine = engines.find((e) => e.name === currentEngine.value);
  if (!engine) return;
  window.open(engine.url + encodeURIComponent(word), "_blank");
};

// 全局 "/" 快捷键聚焦（输入场景下不劫持）
const handleKeydown = (event) => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  const isTyping = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;
  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    inputRef.value?.focus();
  }
};

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<style lang="scss" scoped>
.search-card {
  padding: 14px 18px;
  margin-bottom: 0.75rem;
  font-family: var(--serif-cn);

  .engines {
    display: flex;
    gap: var(--sp-xs);
    margin-bottom: 10px;

    .engine {
      font-size: var(--caption, 0.72rem);
      line-height: 1.8;
      letter-spacing: 0.08em;
      color: var(--paper-soft);
      cursor: pointer;
      padding: 0 2px;
      border-bottom: 2px solid transparent;
      transition:
        color var(--dur-quick) var(--ease-soft),
        border-color var(--dur-quick) var(--ease-soft);

      &:hover {
        color: var(--paper-warm);
      }

      &.active {
        color: var(--paper-pure);
        border-bottom-color: var(--cinnabar);
      }
    }
  }

  .input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--input-border);
    border-radius: 4px;
    background: var(--input-bg);
    transition:
      border-color var(--dur-quick) var(--ease-soft),
      background var(--dur-quick) var(--ease-soft);

    &.focusing {
      border-color: var(--input-border-focus);
    }

    input {
      flex: 1;
      min-width: 0;
      background: none;
      border: none;
      outline: none;
      color: var(--paper-warm);
      font-family: var(--serif-cn);
      font-size: 0.875rem;

      &::placeholder {
        color: var(--paper-muted);
      }
    }

    .go {
      font-size: 0.8125rem;
      letter-spacing: 0.12em;
      color: var(--paper-soft);
      cursor: pointer;
      padding: 2px 6px;
      transition: color var(--dur-quick) var(--ease-soft);

      &:hover {
        color: var(--paper-pure);
      }
    }
  }
}
</style>
