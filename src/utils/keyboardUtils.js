/**
 * 键盘事件处理工具
 */

let spaceKeyHandler = null;
let spaceKeyBlocked = false;

/**
 * 检查是否应该阻止空格键
 * @param {boolean} dialogVisible 对话框是否可见
 * @param {boolean} chatOpenState 聊天界面是否打开
 * @returns {boolean} 是否应该阻止
 */
const shouldBlockSpace = (dialogVisible, chatOpenState) => {
  // 检查任何聊天相关输入框是否激活
  const activeElement = document.activeElement;
  const isInputActive =
    activeElement &&
    (activeElement.classList.contains("el-input__inner") ||
      activeElement.closest(".chat-input") ||
      activeElement.closest(".dialog-input"));

  return dialogVisible || chatOpenState || isInputActive;
};

/**
 * 阻止空格键触发音乐播放
 * @param {boolean} dialogVisible 对话框是否可见
 * @param {boolean} chatOpenState 聊天界面是否打开
 * @param {Function} preventMusicFn 阻止音乐播放的函数
 */
export const blockSpaceKeyForMusic = (dialogVisible, chatOpenState, preventMusicFn) => {
  // 设置阻止状态
  spaceKeyBlocked = true;

  // 移除之前的处理程序
  restoreSpaceKeyForMusic();

  // 创建新的处理程序
  spaceKeyHandler = (e) => {
    if (e.code === "Space" && shouldBlockSpace(dialogVisible, chatOpenState)) {
      e.stopPropagation();
      e.preventDefault();
      preventMusicFn();
    }
  };

  window.addEventListener("keydown", spaceKeyHandler, true);

  // 立即预防性调用一次
  preventMusicFn();

  // 返回阻止状态
  return spaceKeyBlocked;
};

/**
 * 恢复空格键正常功能
 */
export const restoreSpaceKeyForMusic = () => {
  if (spaceKeyHandler) {
    window.removeEventListener("keydown", spaceKeyHandler, true);
    spaceKeyHandler = null;
  }
  spaceKeyBlocked = false;
  return spaceKeyBlocked;
};

/**
 * 获取空格键拦截状态
 * @returns {boolean} 当前是否拦截空格键
 */
export const isSpaceKeyBlocked = () => {
  return spaceKeyBlocked;
};

/**
 * 设置页面可见性变化处理
 * @param {Function} handler 处理函数
 */
export const setupVisibilityChangeHandler = (handler) => {
  document.addEventListener("visibilitychange", handler);

  return () => {
    document.removeEventListener("visibilitychange", handler);
  };
};
