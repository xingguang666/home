/**
 * AI聊天API服务 - 支持多模型切换
 */

// 每日请求限制
const DAILY_LIMIT = 90;
const REQUEST_STORAGE_KEY = 'ai_request_count';

// 获取今日请求次数
const getTodayRequestCount = () => {
  try {
    const data = localStorage.getItem(REQUEST_STORAGE_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data);
    // Check if it's today
    const today = new Date().toDateString();
    if (parsed.date === today) {
      return parsed.count || 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

// 增加请求次数
const incrementRequestCount = () => {
  try {
    const today = new Date().toDateString();
    const currentCount = getTodayRequestCount();
    localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify({
      date: today,
      count: currentCount + 1
    }));
  } catch {
    // Ignore errors
  }
};

// 检查是否超过限制
export const isRequestLimitExceeded = () => {
  return getTodayRequestCount() >= DAILY_LIMIT;
};

// 获取剩余请求次数
export const getRemainingRequests = () => {
  return Math.max(0, DAILY_LIMIT - getTodayRequestCount());
};

// 可用模型配置
export const AI_MODELS = [
  { id: 'glm-4-flash', name: 'GLM-4-Flash', provider: '智谱', free: true, api: 'old' },
  { id: 'glm-4-6', name: 'GLM-4.6', provider: '智谱', free: true, api: 'new' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', free: true, api: 'new' },
];

// 旧API地址（智谱）
const OLD_API_URL = "https://oiapi.net/api/BigModel";
// Proxied through Vite dev server / nginx to avoid SSL renegotiation issues
const NEW_API_URL = "/api/chat";

let currentAbortController = null;
let sessionId = null;

/**
 * 初始化会话ID
 */
const initSessionId = () => {
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  return sessionId;
};

/**
 * 取消当前请求
 */
export const cancelCurrentRequest = () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
};

/**
 * 重置会话（清除对话历史）
 */
export const resetSession = () => {
  sessionId = null;
  initSessionId();
};

/**
 * 使用旧API发送消息（oiapi.net格式）
 */
const sendToOldAPI = async (content, history, model, signal) => {
  const formData = new FormData();
  formData.append('message', content);
  formData.append('model', model);

  // Add conversation history for context
  if (history && history.length > 0) {
    const contextMessages = history.map(msg =>
      `${msg.type === 'ai' ? 'AI' : '用户'}: ${msg.content}`
    ).join('\n');
    formData.append('data', contextMessages);
  }

  const response = await fetch(OLD_API_URL, {
    method: "POST",
    body: formData,
    signal: signal,
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  const result = await response.json();

  if (result.code === 200 && result.data) {
    // Find assistant response in data array
    const assistantMsg = result.data.find(item => item.role === 'assistant');
    return assistantMsg?.content || result.message || "抱歉，没有获取到回复";
  }

  return result.message || "抱歉，发生了错误";
};

/**
 * 使用新API发送消息（OpenAI格式）
 */
const sendToNewAPI = async (content, history, model, signal) => {
  // Build messages in OpenAI format
  const messages = history.map(msg => ({
    role: msg.type === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));
  messages.push({ role: 'user', content: content.trim() });

  const response = await fetch(NEW_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false
    }),
    signal: signal,
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  const result = await response.json();

  if (result.choices && result.choices.length > 0) {
    return result.choices[0].message?.content || "";
  }

  return "抱歉，没有获取到回复";
};

/**
 * 发送消息到AI API
 * @param {string} content 用户消息
 * @param {Array} history 历史消息
 * @param {string} model 选择的模型ID
 * @param {Function} onChunk 流式回调
 */
export const sendToAPI = async (content, history = [], model = 'glm-4-flash', onChunk) => {
  // Check daily limit
  if (isRequestLimitExceeded()) {
    return {
      success: false,
      reply: `今日请求次数已达上限（${DAILY_LIMIT}次），请明天再试。`,
      limitExceeded: true
    };
  }

  try {
    cancelCurrentRequest();
    currentAbortController = new AbortController();

    // Find model config
    const modelConfig = AI_MODELS.find(m => m.id === model) || AI_MODELS[0];
    const useOldAPI = modelConfig.api === 'old';

    let replyText = "";

    if (useOldAPI) {
      // Use old API for GLM models
      replyText = await sendToOldAPI(content, history, model, currentAbortController.signal);
    } else {
      // Use new API for Claude and other models
      replyText = await sendToNewAPI(content, history, model, currentAbortController.signal);
    }

    // Increment request count on success
    incrementRequestCount();

    currentAbortController = null;

    // Notify completion
    if (onChunk) onChunk("", true);

    return {
      success: true,
      reply: replyText || "抱歉，没有获取到回复",
    };
  } catch (error) {
    currentAbortController = null;
    if (error.name === "AbortError") {
      return { success: true, reply: "", cancelled: true };
    }
    console.error("[AI] API请求失败:", error.message);
    return {
      success: false,
      reply: `请求失败：${error.message}`,
    };
  }
};

/**
 * 清除对话缓存并重置会话
 */
export const clearConversation = async () => {
  sessionId = null;
  initSessionId();
  return true;
};
