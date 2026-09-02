<template>
  <!-- AI聊天弹窗 -->
  <Transition name="fade" mode="out-in">
    <div class="chat-dialog" v-show="dialogVisible" @click.self="closeDialog">
      <Transition name="zoom">
        <div class="chat-container" v-show="dialogVisible" @click.stop>
          <!-- 左侧边栏 -->
          <div class="chat-sidebar">
            <div class="sidebar-header">
              <div class="logo">
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="logo-text">AI 助手</span>
              </div>
            </div>

            <div class="sidebar-content">
              <div class="section-title">模型选择</div>
              <div class="model-list">
                <div
                  v-for="model in availableModels"
                  :key="model.id"
                  class="model-card"
                  :class="{ active: selectedModel === model.id }"
                  @click="selectModel(model.id)"
                >
                  <div class="model-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="model-info">
                    <div class="model-name">{{ model.name }}</div>
                    <div class="model-meta">
                      <span class="provider">{{ model.provider }}</span>
                      <span v-if="model.free" class="badge free">免费</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="section-title section-gap">快捷操作</div>
              <div class="quick-list">
                <button class="quick-item" @click="quickAsk('写一首关于春天的诗')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                  </svg>
                  <span>写一首诗</span>
                </button>
                <button class="quick-item" @click="quickAsk('给我讲个笑话')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  <span>讲个笑话</span>
                </button>
                <button class="quick-item" @click="quickAsk('推荐几本好书')">
                  <read-book theme="filled" size="16" />
                  <span>推荐好书</span>
                </button>
              </div>
            </div>

            <div class="sidebar-footer">
              <button class="new-chat-btn" @click="resetConversation">
                <add-one theme="filled" size="16" />
                <span>新对话</span>
              </button>
            </div>
          </div>

          <!-- 右侧聊天区 -->
          <div class="chat-main">
            <!-- 头部 -->
            <div class="main-header">
              <div class="current-model">
                <span class="model-dot"></span>
                <span>{{ currentModel.name }}</span>
              </div>
              <button class="close-btn" @click="closeDialog">
                <close-one theme="filled" size="20" fill="currentColor" />
              </button>
            </div>

            <!-- 消息区域 -->
            <div class="messages-area" ref="messagesContainer">
              <!-- 欢迎界面 -->
              <div v-if="messages.length === 1 && messages[0].type === 'ai'" class="welcome-view">
                <div class="welcome-illustration">
                  <div class="illustration-circle">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="illustration-rings">
                    <div class="ring ring-1"></div>
                    <div class="ring ring-2"></div>
                    <div class="ring ring-3"></div>
                  </div>
                </div>
                <h2>AI 智能助手</h2>
                <p>选择左侧模型开始对话，我将竭诚为您服务</p>
              </div>

              <!-- 消息列表 -->
              <div v-else class="messages-list">
                <div
                  v-for="(message, index) in displayMessages"
                  :key="index"
                  class="message"
                  :class="message.type"
                >
                  <div class="message-avatar" :class="message.type">
                    <template v-if="message.type === 'ai'">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </template>
                    <template v-else>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </template>
                  </div>
                  <div class="message-body">
                    <div class="message-text" v-html="formatContent(message.content)"></div>
                  </div>
                </div>

                <!-- 加载中 -->
                <div v-if="isLoading" class="message ai loading">
                  <div class="message-avatar ai">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <div class="message-body">
                    <div class="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="input-area">
              <div class="input-box">
                <textarea
                  v-model="userInput"
                  :placeholder="`向 ${currentModel.name} 提问...`"
                  @keydown.enter.exact.prevent="sendMessage"
                  rows="1"
                  ref="inputRef"
                ></textarea>
                <button
                  class="send-btn"
                  :class="{ ready: canSend && !isLoading }"
                  :disabled="!canSend || isLoading"
                  @click="sendMessage"
                >
                  <send-one theme="filled" size="20" />
                </button>
              </div>
              <div class="input-hint">
                <span>Enter 发送</span>
                <span>·</span>
                <span>今日剩余 {{ remainingRequests }} 次</span>
                <span>·</span>
                <span>AI 可能会犯错，请核查重要信息</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { CloseOne, AddOne, SendOne, ReadBook } from "@icon-park/vue-next";
import { ref, computed, nextTick, onMounted, onBeforeUnmount, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { useChatStore } from "@/store";
import { sendToAPI, clearConversation, AI_MODELS, getRemainingRequests, isRequestLimitExceeded } from "@/api/aiChat";

const store = useChatStore();
const dialogVisible = ref(false);
const userInput = ref("");
const isLoading = ref(false);
const messagesContainer = ref(null);
const inputRef = ref(null);

const selectedModel = ref('glm-4-flash');
const availableModels = AI_MODELS;

const currentModel = computed(() => {
  return AI_MODELS.find(m => m.id === selectedModel.value) || AI_MODELS[0];
});

// Each model has its own independent conversation history
const modelMessages = reactive({});
const DEFAULT_MESSAGE = { type: "ai", content: "你好！我是AI助手，有什么可以帮你的吗？" };

// Initialize history for a model if not exists
const initModelMessages = (modelId) => {
  if (!modelMessages[modelId]) {
    // Try to load from store (which is persisted to localStorage)
    const savedHistory = store.chatHistory?.[modelId];
    if (savedHistory && Array.isArray(savedHistory) && savedHistory.length > 0) {
      modelMessages[modelId] = [...savedHistory];
    } else {
      modelMessages[modelId] = [{ ...DEFAULT_MESSAGE }];
    }
  }
};

// Computed messages for current model
const messages = computed(() => {
  initModelMessages(selectedModel.value);
  return modelMessages[selectedModel.value];
});

const displayMessages = computed(() => {
  const msgs = messages.value;
  if (msgs.length === 1 && msgs[0].type === 'ai') {
    return [];
  }
  return msgs;
});

const canSend = computed(() => userInput.value.trim().length > 0);
const remainingRequests = ref(getRemainingRequests());

const selectModel = (modelId) => {
  selectedModel.value = modelId;
  // Initialize messages for this model
  initModelMessages(modelId);
  // Scroll to bottom when switching models
  scrollToBottom();
};

const quickAsk = (question) => {
  userInput.value = question;
  sendMessage();
};

const formatContent = (content) => {
  if (!content) return "";
  return content
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
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

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  // Check request limit
  if (isRequestLimitExceeded()) {
    ElMessage({ message: "今日请求次数已达上限，请明天再试", type: "warning", duration: 2000 });
    return;
  }

  const question = userInput.value.trim();
  userInput.value = "";

  // Push to current model's messages
  modelMessages[selectedModel.value].push({ type: "user", content: question });
  scrollToBottom();
  isLoading.value = true;

  try {
    const history = messages.value.slice(0, -1);
    const result = await sendToAPI(question, history, selectedModel.value, scrollToBottom);

    if (result.success && !result.cancelled) {
      modelMessages[selectedModel.value].push({ type: "ai", content: result.reply });
      // Update remaining count
      remainingRequests.value = getRemainingRequests();
    } else if (!result.success) {
      modelMessages[selectedModel.value].push({ type: "ai", content: result.reply || "抱歉，发生了错误" });
    }
    // Save to store with model-specific key
    saveCurrentModelHistory();
  } catch (err) {
    modelMessages[selectedModel.value].push({ type: "ai", content: "抱歉，发生了错误" });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

const saveCurrentModelHistory = () => {
  if (!store.chatHistory) {
    store.chatHistory = {};
  }
  store.chatHistory[selectedModel.value] = [...modelMessages[selectedModel.value]];
};

const resetConversation = async () => {
  await clearConversation();
  // Reset only current model's conversation
  modelMessages[selectedModel.value] = [{ type: "ai", content: "你好！我是AI助手，有什么可以帮你的吗？" }];
  saveCurrentModelHistory();
  ElMessage({ message: "已开始新对话", type: "success", duration: 1500 });
};

const openDialog = () => {
  dialogVisible.value = true;
  nextTick(() => {
    scrollToBottom();
    inputRef.value?.focus();
  });
};

const closeDialog = () => {
  dialogVisible.value = false;
};

onMounted(() => {
  window.$openAIChat = openDialog;
  // Initialize all models from persisted history
  if (store.chatHistory && typeof store.chatHistory === 'object') {
    Object.keys(store.chatHistory).forEach(modelId => {
      if (Array.isArray(store.chatHistory[modelId]) && store.chatHistory[modelId].length > 0) {
        modelMessages[modelId] = [...store.chatHistory[modelId]];
      }
    });
  }
  // Initialize current model if not loaded
  initModelMessages(selectedModel.value);

  // Save on page unload (handles refresh)
  window.addEventListener('beforeunload', saveAllHistory);
});

const saveAllHistory = () => {
  if (!store.chatHistory) {
    store.chatHistory = {};
  }
  Object.keys(modelMessages).forEach(modelId => {
    if (modelMessages[modelId] && modelMessages[modelId].length > 0) {
      store.chatHistory[modelId] = [...modelMessages[modelId]];
    }
  });
};

onBeforeUnmount(() => {
  saveAllHistory();
  window.removeEventListener('beforeunload', saveAllHistory);
});

defineExpose({ openDialog, closeDialog });
</script>

<style lang="scss" scoped>
.chat-dialog {
  position: fixed;
  inset: 0;
  background: rgba(5, 5, 20, 0.95);
  // 性能优化：blur 从 40px 降到 16px。原 40px 是全站最重的 backdrop-filter，
  // 覆盖整个视口的大半径模糊极其昂贵。且背景已是 0.95 不透明深色，背后几乎不可见，
  // 40px 的视觉收益微乎其微。16px 仍保留磨砂质感，计算量大幅降低。
  backdrop-filter: blur(16px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.chat-container {
  width: 100%;
  max-width: 1000px;
  height: 85vh;
  max-height: 800px;
  background: linear-gradient(160deg, rgba(20, 15, 45, 0.98), rgba(10, 8, 30, 0.99));
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6);
  display: flex;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 100%;
    height: 95vh;
    border-radius: 20px;
  }
}

// 左侧边栏
.chat-sidebar {
  width: 260px;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  svg {
    width: 24px;
    height: 24px;
  }
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 12px;
}

.section-gap {
  margin-top: 20px;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.3);
  }
}

.model-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);

  svg {
    width: 20px;
    height: 20px;
  }
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 0.9rem;
  color: #fff;
  font-weight: 500;
}

.model-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.provider {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.badge.free {
  font-size: 0.6rem;
  padding: 2px 6px;
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  border-radius: 8px;
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    transform: translateX(4px);
  }
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
    color: #fff;
  }
}

// 右侧聊天区
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.current-model {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.model-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
}

.welcome-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.welcome-illustration {
  position: relative;
  margin-bottom: 24px;
}

.illustration-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  color: #fff;

  svg {
    width: 50px;
    height: 50px;
  }
}

.illustration-rings {
  position: absolute;
  inset: -20px;
}

.ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 50%;

  &.ring-1 {
    animation: ring-pulse 3s ease-out infinite;
  }
  &.ring-2 {
    animation: ring-pulse 3s ease-out infinite 1s;
  }
  &.ring-3 {
    animation: ring-pulse 3s ease-out infinite 2s;
  }
}

.welcome-view h2 {
  font-size: 1.5rem;
  color: #fff;
  margin: 0 0 8px;
  font-weight: 600;
}

.welcome-view p {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  max-width: 300px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message {
  display: flex;
  gap: 12px;
  animation: message-in 0.3s ease;

  &.user {
    flex-direction: row-reverse;

    .message-body {
      align-items: flex-end;
    }

    .message-text {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
      border-radius: 20px 20px 4px 20px;
    }
  }

  &.ai {
    .message-text {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px 20px 20px 4px;
    }
  }

  &.loading .message-body .message-text {
    padding: 16px 24px;
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
  }

  &.ai {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
  }

  &:not(.ai) {
    background: rgba(240, 147, 251, 0.3);
    color: #f093fb;
  }
}

.message-body {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-text {
  padding: 14px 18px;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;

  :deep(.code-block) {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 10px;
    padding: 14px;
    margin: 10px 0;
    overflow-x: auto;
    font-size: 0.85rem;
  }

  :deep(.inline-code) {
    background: rgba(255, 215, 0, 0.15);
    color: #ffd700;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.88em;
  }
}

.input-area {
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.input-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 16px;
  transition: all 0.2s;

  &:focus-within {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(102, 126, 234, 0.4);
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 0.95rem;
    line-height: 1.5;
    resize: none;
    max-height: 120px;
    font-family: inherit;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

.send-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &.ready {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;

    &:hover {
      transform: scale(1.05);
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.input-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.25);
}

// 动画
.typing-dots {
  display: flex;
  gap: 4px;

  span {
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    animation: typing 1.4s ease-in-out infinite;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes message-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}
</style>
