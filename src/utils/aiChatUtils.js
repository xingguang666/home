/**
 * AI聊天工具函数集合
 */

/**
 * 模拟打字效果
 * @param {Array} messages 消息数组
 * @param {Number} messageIndex 目标消息索引
 * @param {String} finalContent 最终显示内容
 * @returns {Promise} 完成后的Promise
 */
export const simulateTyping = async (messages, messageIndex, finalContent) => {
  if (messageIndex >= messages.length) throw new Error("消息索引无效");

  const message = messages[messageIndex];
  message.isTyping = true;
  message.partialContent = "";

  const typingSpeed = 30;
  let currentIndex = 0;

  return new Promise((resolve) => {
    let typingInterval = null;

    // 清理函数
    const cleanup = () => {
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
      }
    };

    // 检查组件是否已卸载
    const isComponentUnmounted = () => {
      return (
        !document.body.contains(document.querySelector(".ai-chat")) &&
        !document.body.contains(document.querySelector(".chat-dialog"))
      );
    };

    // 打字处理
    const typeCharacter = () => {
      if (messageIndex >= messages.length || isComponentUnmounted()) {
        cleanup();
        return resolve();
      }

      if (currentIndex < finalContent.length) {
        messages[messageIndex].partialContent += finalContent[currentIndex];
        currentIndex++;
      } else {
        cleanup();

        if (messageIndex < messages.length) {
          messages[messageIndex].isTyping = false;
          messages[messageIndex].content = finalContent;
        }

        resolve();
      }
    };

    // 启动打字动画
    typingInterval = setInterval(typeCharacter, typingSpeed);

    // 安全超时 - 最多8秒
    setTimeout(() => {
      if (typingInterval) {
        cleanup();
        if (messageIndex < messages.length && !isComponentUnmounted()) {
          messages[messageIndex].isTyping = false;
          messages[messageIndex].content = finalContent;
        }
        resolve();
      }
    }, 8000);
  });
};

/**
 * 滚动到消息容器底部
 * @param {Array<Element>} containers 容器元素数组
 */
export const scrollToBottom = (containers) => {
  if (!containers || !containers.length) return;

  containers.forEach((container) => {
    if (container) {
      try {
        // 尝试使用scrollIntoView（更可靠的滚动方法）
        const lastMessage = container.querySelector(".message:last-child");
        if (lastMessage) {
          lastMessage.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
          // 回退到传统方法
          container.scrollTop = container.scrollHeight;
        }
      } catch (e) {
        // 如果出错，使用最简单的方法
        container.scrollTop = container.scrollHeight;
      }
    }
  });
};

/**
 * 检查组件是否已卸载 - 通用检测
 * @returns {boolean} 组件是否已卸载
 */
export const isComponentUnmounted = () => {
  return (
    !document.body.contains(document.querySelector(".ai-chat")) &&
    !document.body.contains(document.querySelector(".chat-dialog"))
  );
};

/**
 * 防止音乐自动播放
 * @param {Object} store 存储对象
 * @param {Number} duration 持续阻止时间(毫秒)，默认300ms
 */
export const preventMusicAutoplay = (store, duration = 300) => {
  if (!store) return;

  const originalValue = store.playerAutoplay;
  store.playerAutoplay = false;

  // 设置延时恢复
  const restoreTimeout = setTimeout(() => {
    store.playerAutoplay = originalValue;
  }, duration);

  // 返回清理函数
  return () => {
    clearTimeout(restoreTimeout);
    store.playerAutoplay = originalValue;
  };
};

/**
 * 强制阻止音乐播放
 * @param {Object} store 存储对象
 * @param {Number} duration 持续阻止时间(毫秒)，默认1000ms
 * @returns {Function|null} 清理函数
 */
export const forcePreventMusicAutoplay = (store, duration = 1000) => {
  if (!store) return null;

  // 强制关闭播放器自动播放
  store.playerAutoplay = false;

  // 也阻止播放
  if (store.playerPlaying) {
    store.playerPlaying = false;
  }

  // 多次设置，确保生效
  const intervals = [];
  for (let i = 0; i < 5; i++) {
    intervals.push(
      setTimeout(() => {
        store.playerAutoplay = false;
      }, i * 50),
    );
  }

  // 延时恢复原始值
  const restoreTimeout = setTimeout(() => {
    intervals.forEach(clearTimeout);
    store.playerAutoplay = false; // 保持为false以防止误触发
  }, duration);

  // 返回清理函数
  return () => {
    intervals.forEach(clearTimeout);
    clearTimeout(restoreTimeout);
  };
};

/**
 * 检查是否是页面刷新
 * @param {Object} store 存储对象
 * @param {Array} messages 消息数组引用
 * @param {String} sessionId 会话ID引用
 */
export const checkForRefresh = (store, messages, sessionId) => {
  const hasPageLoaded = sessionStorage.getItem("chatPageLoaded");

  if (!hasPageLoaded) {
    store.chatHistory = [];
    messages.value = [{ type: "ai", content: "你好！我是AI助手，有什么可以帮你的吗？" }];

    const savedSessionId = localStorage.getItem("aiChatSessionId");
    if (savedSessionId && !window.location.search.includes("reset_session=true")) {
      sessionId.value = savedSessionId;
    } else {
      sessionId.value = "";
      localStorage.removeItem("aiChatSessionId");
    }

    sessionStorage.setItem("chatPageLoaded", "true");
  }
};

// 格式化消息内容，支持换行和简单的代码块
export const formatMessageContent = (content) => {
  if (!content) return "";
  // 替换换行符为 <br>
  let formattedContent = content.replace(/\n/g, "<br>");
  // 替换Markdown风格的代码块
  formattedContent = formattedContent.replace(/```([\s\S]*?)```/g, (match, code) => {
    // 对代码内容进行HTML转义，防止XSS
    const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre><code class="language-plaintext">${escapedCode.trim()}</code></pre>`;
  });
  return formattedContent;
};
