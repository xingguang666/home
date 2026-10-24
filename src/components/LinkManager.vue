<template>
  <div class="link-manager">
    <!-- 自定义链接列表 -->
    <div v-if="links.length" class="rows">
      <div v-for="item in links" :key="item.id" class="row">
        <el-select v-model="item.icon" size="small" class="icon-select" title="图标">
          <el-option v-for="opt in iconOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
        <el-input v-model="item.name" size="small" placeholder="名称" maxlength="6" class="name-input" />
        <el-input v-model="item.url" size="small" placeholder="网址 https://…" class="url-input" />
        <el-button size="small" type="danger" plain @click="removeItem(item.id)">删</el-button>
      </div>
    </div>
    <div v-else class="empty">
      未自定义链接，当前展示默认配置。添加后完全替换默认列表；名称填「音乐」「今日热榜」可触发对应功能面板。
    </div>

    <!-- 操作区 -->
    <div class="actions">
      <el-button size="small" @click="addItem">添加链接</el-button>
      <el-button size="small" :disabled="!links.length" @click="resetDefault">恢复默认</el-button>
    </div>
  </div>
</template>

<script setup>
const STORAGE_KEY = "custom_site_links";
const UPDATE_EVENT = "siteLinksUpdated";

// 图标选项与 Links.vue 的 siteIcon 映射保持一致
const iconOptions = [
  { value: "Blog", label: "博客" },
  { value: "Cloud", label: "云盘" },
  { value: "CompactDisc", label: "音乐" },
  { value: "Compass", label: "导航" },
  { value: "Book", label: "书籍" },
  { value: "Fire", label: "热门" },
  { value: "LaptopCode", label: "代码" },
  { value: "Link", label: "链接" },
];

const loadLinks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const links = ref(loadLinks());

// 行是否已填写完整（名称 + 合法网址）
const isComplete = (item) => item.name.trim() && /^https?:\/\/.+/.test(item.url.trim());

// 任意变更即时保存并通知首页 Links 组件热更新。
// 只持久化填写完整的行：避免「点了添加还没填完」的空行被保存，
// 用一条空记录把默认链接列表整个顶掉。
watch(
  links,
  (val) => {
    const complete = val.filter(isComplete);
    if (complete.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complete));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  },
  { deep: true },
);

const addItem = () => {
  links.value = [
    ...links.value,
    { id: Date.now(), icon: "Link", name: "", url: "" },
  ];
};

const removeItem = (id) => {
  links.value = links.value.filter((item) => item.id !== id);
};

const resetDefault = () => {
  links.value = [];
  ElMessage({ message: "已恢复默认网站列表", grouping: true });
};
</script>

<style lang="scss" scoped>
.link-manager {
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;

    .row {
      display: flex;
      gap: 6px;
      align-items: center;

      .icon-select {
        width: 92px;
        flex: none;
      }

      .name-input {
        width: 90px;
        flex: none;
      }

      .url-input {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .empty {
    font-size: 0.8125rem;
    line-height: 1.6;
    opacity: 0.65;
    margin-bottom: 10px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
}
</style>
