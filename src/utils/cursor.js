/**
 * 自定义鼠标光标 - 优化版
 * 使用 requestAnimationFrame 实现平滑跟随
 */

let cursorInstance = null;

/**
 * 线性插值
 * @param {number} a - 起始值
 * @param {number} b - 目标值
 * @param {number} n - 插值系数 (0-1)
 */
const lerp = (a, b, n) => (1 - n) * a + n * b;

class Cursor {
  constructor() {
    this.mouseX = -100;
    this.mouseY = -100;
    this.cursorX = -100;
    this.cursorY = -100;
    this.isActive = false;
    this.isHidden = true;
    this.rafId = null;
    this.styleEl = null;

    this.createElements();
    this.bindEvents();
    this.startRender();
  }

  /**
   * 创建光标元素和样式
   */
  createElements() {
    // 光标主元素
    this.el = document.createElement("div");
    this.el.id = "cursor";
    document.body.appendChild(this.el);

    // 样式
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = `
      #cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.85);
        pointer-events: none;
        z-index: 99999;
        transition: opacity 0.3s, width 0.15s, height 0.15s, background 0.15s;
        opacity: 0;
        mix-blend-mode: difference;
        /* 关键性能优化：用 transform 定位而非 left/top。
           transform 只触发合成层(composite)，而 left/top 会触发
           整页布局重排(layout)，是滚动/卡顿的经典元凶。 */
        transform: translate3d(-100px, -100px, 0);
        will-change: transform;
      }
      #cursor.visible {
        opacity: 1;
      }
      #cursor.active {
        width: 10px;
        height: 10px;
        background: rgba(255, 255, 255, 1);
      }
      #cursor.hover {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.25);
        border: 2px solid rgba(255, 255, 255, 0.8);
      }
      @media (max-width: 768px) {
        #cursor { display: none !important; }
      }
    `;
    document.head.appendChild(this.styleEl);
  }

  /**
   * 绑定鼠标事件
   */
  bindEvents() {
    this.onMouseMove = (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      if (this.isHidden) {
        this.isHidden = false;
        this.el.classList.add("visible");
        this.cursorX = this.mouseX;
        this.cursorY = this.mouseY;
        this.updatePosition();
      }
      /* 鼠标移动时确保渲染循环在运行（可能因接近目标被暂停过） */
      this.ensureRendering();
    };

    this.onMouseDown = () => {
      this.isActive = true;
      this.el.classList.add("active");
    };

    this.onMouseUp = () => {
      this.isActive = false;
      this.el.classList.remove("active");
    };

    this.onMouseLeave = () => {
      this.isHidden = true;
      this.el.classList.remove("visible");
    };

    this.onMouseEnter = () => {
      this.isHidden = false;
      this.el.classList.add("visible");
    };

    document.addEventListener("mousemove", this.onMouseMove, { passive: true });
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("mouseleave", this.onMouseLeave);
    document.addEventListener("mouseenter", this.onMouseEnter);

    this.setupHoverObserver();
  }

  /**
   * 监听可交互元素，添加 hover 效果
   */
  setupHoverObserver() {
    const addHoverListeners = () => {
      const selectors = 'a, button, [role="button"], input, textarea, select, .cards, [data-cursor-hover]';
      document.querySelectorAll(selectors).forEach((el) => {
        if (el._cursorHoverBound) return;
        el._cursorHoverBound = true;
        el.addEventListener("mouseenter", () => this.el.classList.add("hover"));
        el.addEventListener("mouseleave", () => this.el.classList.remove("hover"));
      });
    };

    addHoverListeners();

    this.mutationObserver = new MutationObserver(addHoverListeners);
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * 更新光标位置 - 使用 transform: translate3d 硬件加速
   *
   * 性能要点：
   * - translate3d 只触发合成层(composite)，不触发布局(layout)和绘制(paint)
   * - 之前的 left/top 会触发整页布局重排，是卡顿元凶
   * - 末尾的 translate(-50%, -50%) 让元素中心对齐鼠标点，
   *   且基于元素自身宽高，hover/active 宽度变化时自动重新居中
   */
  updatePosition() {
    this.el.style.transform = `translate3d(${this.cursorX}px, ${this.cursorY}px, 0) translate(-50%, -50%)`;
  }

  /**
   * 渲染循环 - 按需运行，接近目标时自动暂停以省电省 CPU
   *
   * 优化要点：
   * - 之前的实现无条件每帧 requestAnimationFrame，即使鼠标静止也持续运算
   * - 现在：当光标位置与鼠标目标差距 < 0.5px 时暂停 RAF
   * - 鼠标再次移动时通过 onMouseMove → ensureRendering 重启 RAF
   * - 鼠标静止时零 CPU 开销（重要：移动设备/后台标签页省电）
   */
  ensureRendering() {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.render);
    }
  }

  startRender() {
    this.render = () => {
      if (!this.isHidden) {
        this.cursorX = lerp(this.cursorX, this.mouseX, 0.2);
        this.cursorY = lerp(this.cursorY, this.mouseY, 0.2);
        this.updatePosition();

        /* 接近目标位置时暂停 RAF，鼠标移动后会自动重启 */
        const dx = this.mouseX - this.cursorX;
        const dy = this.mouseY - this.cursorY;
        if (dx * dx + dy * dy < 0.25) {
          this.rafId = null;
          return;
        }
      }
      this.rafId = requestAnimationFrame(this.render);
    };
    this.rafId = requestAnimationFrame(this.render);
  }

  /**
   * 销毁光标
   */
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("mouseleave", this.onMouseLeave);
    document.removeEventListener("mouseenter", this.onMouseEnter);
    if (this.el) this.el.remove();
    if (this.styleEl) this.styleEl.remove();
    cursorInstance = null;
  }
}

const cursorInit = () => {
  if (cursorInstance) {
    cursorInstance.destroy();
  }
  cursorInstance = new Cursor();
  return cursorInstance;
};

export default cursorInit;
