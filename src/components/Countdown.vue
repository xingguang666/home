<template>
  <div class="countdown cards">
    <div class="line">
      <Icon size="18">
        <CalendarAlt />
      </Icon>
      <span class="title">倒数日</span>
      <span class="toggle" @click="showAdd = !showAdd">{{ showAdd ? "收起" : "添加" }}</span>
    </div>

    <!-- 添加表单 -->
    <div v-if="showAdd" class="add-form">
      <input v-model="newName" class="name-input" type="text" placeholder="名称，如：新番开播" maxlength="12" />
      <input v-model="newDate" class="date-input" type="date" />
      <label class="repeat">
        <input v-model="newRepeat" type="checkbox" />
        每年
      </label>
      <span class="add-btn" :class="{ disabled: !canAdd }" @click="addItem">记下</span>
    </div>

    <!-- 倒数列表 -->
    <div v-if="items.length" class="list">
      <div v-for="item in sortedItems" :key="item.id" class="item">
        <span class="name text-hidden">{{ item.name }}</span>
        <span class="meta">
          <span class="date">{{ item.date.slice(5).replace("-", " / ") }}</span>
          <span class="days">{{ formatDays(item.daysLeft) }}</span>
        </span>
        <span class="del" title="删除" @click.stop="removeItem(item.id)">×</span>
      </div>
    </div>
    <!-- 空态 -->
    <div v-else class="empty">还没有倒数日，点「添加」记一个日子吧</div>
  </div>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { CalendarAlt } from "@vicons/fa";

const STORAGE_KEY = "countdown_items";

// 日期差值（按自然日计算，不含时分秒）
const daysUntil = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
};

// 每年重复的日期，取下一次出现（今年过了就取明年）
const nextOccurrence = (dateStr) => {
  const now = new Date();
  const [, m, d] = dateStr.split("-").map(Number);
  const thisYear = new Date(now.getFullYear(), m - 1, d);
  if (thisYear >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return `${now.getFullYear()}-${dateStr.slice(5)}`;
  }
  return `${now.getFullYear() + 1}-${dateStr.slice(5)}`;
};

// 读取列表并计算剩余天数
const loadItems = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.map((item) => {
      const date = item.repeat ? nextOccurrence(item.date) : item.date;
      return { ...item, date, daysLeft: daysUntil(date) };
    });
  } catch {
    return [];
  }
};

const items = ref(loadItems());
const showAdd = ref(false);
const newName = ref("");
const newDate = ref("");
const newRepeat = ref(false);

const canAdd = computed(() => newName.value.trim() && /^\d{4}-\d{2}-\d{2}$/.test(newDate.value));

const sortedItems = computed(() => [...items.value].sort((a, b) => a.daysLeft - b.daysLeft));

const persist = () => {
  // 只存原始字段，剩余天数每次载入时重算
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.value.map(({ id, name, date, repeat }) => ({ id, name, date, repeat }))),
  );
};

const addItem = () => {
  if (!canAdd.value) return;
  items.value = [
    ...items.value,
    {
      id: Date.now(),
      name: newName.value.trim(),
      date: newDate.value,
      repeat: newRepeat.value,
      daysLeft: daysUntil(newDate.value),
    },
  ];
  persist();
  newName.value = "";
  newDate.value = "";
  newRepeat.value = false;
  showAdd.value = false;
};

const removeItem = (id) => {
  items.value = items.value.filter((item) => item.id !== id);
  persist();
};

const formatDays = (days) => {
  if (days === 0) return "就是今天";
  if (days === 1) return "明天";
  if (days < 0) return "已过";
  return `${days} 天`;
};

// 跨天时刷新剩余天数（如页面过夜挂着）
let refreshTimer = null;
onMounted(() => {
  refreshTimer = setInterval(() => {
    items.value = loadItems();
  }, 60 * 60 * 1000);
});
onBeforeUnmount(() => clearInterval(refreshTimer));
</script>

<style lang="scss" scoped>
.countdown {
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

    .toggle {
      margin-left: auto;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--paper-soft);
      cursor: pointer;
      transition: color var(--dur-quick) var(--ease-soft);

      &:hover {
        color: var(--paper-pure);
      }
    }
  }

  .add-form {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;

    input[type="text"],
    input[type="date"] {
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
      flex: 1;
      min-width: 120px;
    }

    .repeat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--paper-soft);
      cursor: pointer;
      user-select: none;

      input {
        accent-color: var(--bamboo);
      }
    }

    .add-btn {
      font-size: 0.8125rem;
      letter-spacing: 0.12em;
      color: var(--paper-soft);
      cursor: pointer;
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

  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 4px;
      border-bottom: 1px solid var(--row-divider);
      transition: background var(--dur-quick) var(--ease-soft);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--row-hover);

        .del {
          opacity: 1;
        }
      }

      .name {
        font-size: 0.875rem;
        color: var(--paper-warm);
      }

      .meta {
        margin-left: auto;
        display: flex;
        align-items: baseline;
        gap: 10px;

        .date {
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--paper-muted);
          letter-spacing: 0.06em;
        }

        .days {
          font-family: var(--mono);
          font-size: 0.82rem;
          color: var(--paper-pure);
        }
      }

      .del {
        font-size: 1rem;
        color: var(--paper-muted);
        cursor: pointer;
        opacity: 0;
        padding: 0 2px;
        transition:
          opacity var(--dur-quick) var(--ease-soft),
          color var(--dur-quick) var(--ease-soft);

        &:hover {
          color: var(--cinnabar);
        }
      }
    }
  }

  .empty {
    font-size: 0.8125rem;
    color: var(--paper-muted);
    padding: 4px 0;
  }
}
</style>
