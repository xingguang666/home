/**
 * AI 消息处理服务 - 智谱 GLM-4-Flash
 */

import { sendToAPI, clearConversation } from "@/api/aiChat";

const HISTORY_KEY = "ai_chat_history";

/**
 * 加载历史记录
 */
export const loadChatHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) return data;
    return null;
  } catch {
    return null;
  }
};

/**
 * 保存历史记录
 */
export const saveChatHistory = (messages) => {
  try {
    // 只保存最近50条
    const toSave = messages.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
};

/**
 * 重置对话
 */
export const resetConversation = async (messages, updateStoreHistory) => {
  // 清除服务器端会话
  await clearConversation();

  const welcome = [
    {
      type: "ai",
      content: "你好！我是AI助手，有什么可以帮你的吗？",
      avatar: "🤖",
    },
  ];
  messages.value = welcome;
  saveChatHistory(welcome);
  if (updateStoreHistory) updateStoreHistory(welcome);
};

/**
 * 发送消息
 */
export const handleSendMessage = async (
  userQuestion,
  messages,
  setLoading,
  scrollToBottomFn,
  updateStoreHistory,
  updateMessageFn,
) => {
  // 添加用户消息
  messages.value.push({ type: "user", content: userQuestion, avatar: "👤" });
  saveChatHistory(messages.value);
  if (updateStoreHistory) updateStoreHistory(messages.value);
  scrollToBottomFn();

  setLoading(true);

  // 添加AI占位消息
  const aiIndex = messages.value.length;
  messages.value.push({
    type: "ai",
    content: "思考中...",
    avatar: "🤖",
    isStreaming: true,
  });
  scrollToBottomFn();

  // 调用API（新API通过id自动管理历史，不需要传历史）
  const result = await sendToAPI(userQuestion, []);

  if (result.success && result.reply) {
    // 成功获取回复
    if (messages.value[aiIndex]) {
      messages.value[aiIndex].content = result.reply;
      messages.value[aiIndex].isStreaming = false;
      saveChatHistory(messages.value);
      if (updateStoreHistory) updateStoreHistory(messages.value);
    }
  } else if (result.cancelled) {
    // 请求被取消
    if (messages.value[aiIndex]) {
      messages.value[aiIndex].content = "（已取消）";
      messages.value[aiIndex].isStreaming = false;
    }
  } else {
    // 请求失败
    if (messages.value[aiIndex]) {
      messages.value[aiIndex].content = result.reply || "抱歉，请求失败，请稍后重试。";
      messages.value[aiIndex].isStreaming = false;
      saveChatHistory(messages.value);
      if (updateStoreHistory) updateStoreHistory(messages.value);
    }
  }

  setLoading(false);
  scrollToBottomFn();
};
