/**
 * 樱花飘落特效
 * 通过 API 请求获取
 */

let sakuraInstance = null;

class SakuraEffect {
  constructor() {
    this.scriptElement = null;
    this.isRunning = false;
    this.stopFunction = null;
    this.canvas = null;
  }

  /**
   * 初始化樱花特效
   */
  init() {
    if (this.isRunning) return;

    const requestUrl = 'https://yunzhiapi.cn/API/js/yinghua.js';

    fetch(requestUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('请求失败');
        }
        return response.text();
      })
      .then(code => {
        // 创建脚本元素执行代码
        this.scriptElement = document.createElement('script');
        this.scriptElement.type = 'text/javascript';
        this.scriptElement.textContent = code;
        document.body.appendChild(this.scriptElement);

        // 保存停止函数引用
        this.stopFunction = window.stop;
        this.isRunning = true;

        // 查找并保存 canvas 元素
        this.findAndSaveCanvas();
      })
      .catch(error => {
        console.error('樱花特效加载失败:', error);
        ElMessage({
          message: '樱花特效加载失败，请稍后重试',
          type: 'error',
          duration: 3000
        });
        // 重置状态
        if (sakuraInstance) {
          const store = window.__PINIA_STORE__;
          if (store) {
            store.snowShow = false;
          }
          sakuraInstance = null;
        }
      });
  }

  /**
   * 查找并保存 canvas 元素
   */
  findAndSaveCanvas() {
    // 尝试查找 canvas 元素
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      if (!this.canvas) {
        this.canvas = canvas;
        canvas.setAttribute('data-sakura', 'true');
      }
    });
  }

  /**
   * 停止特效并延迟刷新页面
   */
  destroy() {
    this.isRunning = false;

    // 清理定时器
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // 尝试使用 API 提供的 stop 函数
    if (typeof this.stopFunction === 'function') {
      try {
        this.stopFunction();
      } catch (e) {
        // 忽略错误
      }
    }

    // 清理脚本元素
    if (this.scriptElement) {
      this.scriptElement.remove();
      this.scriptElement = null;
    }

    // 清理 canvas 元素
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }

    // 清理所有标记的 canvas
    const canvases = document.querySelectorAll('canvas[data-sakura="true"]');
    canvases.forEach(el => el.remove());

    // 清理可能的全局变量
    if (window.stop) {
      window.stop = null;
    }
    if (window.staticx) {
      window.staticx = null;
    }

    sakuraInstance = null;

    // 提示用户后延迟5秒刷新
    ElMessage({
      message: '樱花特效已关闭，5秒后将自动刷新页面',
      type: 'info',
      duration: 4500
    });

    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }
}

/**
 * 启动樱花特效
 */
export const startSnow = () => {
  if (sakuraInstance) return;
  sakuraInstance = new SakuraEffect();
  sakuraInstance.init();
};

/**
 * 停止樱花特效
 */
export const stopSnow = () => {
  if (sakuraInstance) {
    sakuraInstance.destroy();
  }
};

/**
 * 切换樱花特效
 */
export const toggleSnow = (enabled) => {
  if (enabled) {
    startSnow();
  } else {
    stopSnow();
  }
};

export default SakuraEffect;
