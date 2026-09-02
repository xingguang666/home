<template>
  <div class="messages" ref="messagesContainer">
    <div
      v-for="(message, index) in messages"
      :key="index"
      class="message-row"
      :class="message.type"
    >
      <div class="avatar">{{ message.avatar || (message.type === 'ai' ? '🤖' : '👤') }}</div>
      <div class="message-bubble">
        <div class="message-content" v-html="formatContent(message.content)"></div>
        <div v-if="message.type === 'ai' && message.isStreaming" class="streaming-indicator">
          <span class="pulse-dot"></span>
          <span class="pulse-dot"></span>
          <span class="pulse-dot"></span>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading && !hasStreamingMessage" class="message-row ai loading">
      <div class="avatar">🤖</div>
      <div class="message-bubble">
        <div class="streaming-indicator">
          <span class="pulse-dot"></span>
          <span class="pulse-dot"></span>
          <span class="pulse-dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from "vue";

const props = defineProps({
  messages: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
});

const messagesContainer = ref(null);

const hasStreamingMessage = computed(() => {
  return props.messages.some((m) => m.isStreaming);
});

const formatContent = (content) => {
  if (!content) return "";
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

watch(() => props.messages.length, scrollToBottom);
watch(
  () => props.messages.map((m) => m.content),
  scrollToBottom,
  { deep: true }
);

defineExpose({ messagesContainer });
</script>

<style lang="scss" scoped>
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25);
  }
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: messageIn 0.3s ease;

  &.ai {
    .avatar {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .message-bubble {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px 16px 16px 4px;

      :deep(.code-block) {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 10px;
        padding: 14px;
        margin: 8px 0;
        overflow-x: auto;
        font-size: 0.85rem;
        line-height: 1.6;
        color: #e0e0e0;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      :deep(.inline-code) {
        background: rgba(255, 255, 255, 0.12);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.88em;
        color: #ffd700;
      }
    }
  }

  &.user {
    flex-direction: row-reverse;

    .avatar {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .message-bubble {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
      border-radius: 16px 16px 4px 16px;
      color: #fff;
    }
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .message-bubble {
    max-width: 75%;
    padding: 12px 16px;
    font-size: 0.95rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.92);
    word-break: break-word;
  }
}

.streaming-indicator {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  padding: 4px 0;

  .pulse-dot {
    width: 7px;
    height: 7px;
    background: #667eea;
    border-radius: 50%;
    animation: pulse 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
