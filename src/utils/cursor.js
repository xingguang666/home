/**
 * 自定义鼠标光标 - 最简可靠版
 *
 * 设计原则：可靠性 > 花哨特性
 *
 * 之前版本用了 transform translate + mix-blend-mode + 双层/伪元素，
 * 每层都有合成层冲突风险。这个版本回归最基础方案：
 *
 * - 定位：position: fixed + left/top（单个 fixed 小元素性能无忧，浏览器有优化）
 * - 居中：margin: -8px -8px（固定偏移，让 16px 圆心对齐鼠标点）
 * - hover 放大：transform: scale（独立变换，不影响定位）
 * - 颜色：固定高对比色（不用 mix-blend-mode，避免所有混合模式问题）
 * - 跟随：lerp 0.5（紧跟鼠标，保留轻微平滑质感）
 *
 * hover 检测用事件委托（mouseover/mouseout 冒泡），零 DOM 扫描。
 */

let cursorInstance = null;

const lerp = (a, b, n) => (1 - n) * a + n * b;

class Cursor {
  constructor() {
    this.mouseX = -100;
    this.mouseY = -100;
    this.cursorX = -100;
    this.cursorY = -100;
    this.isHidden = true;
    this.rafId = null;

    this.createElements();
    this.bindEvents();
    this.startRender();
  }

  createElements() {
    this.el = document.createElement("div");
    this.el.className = "cursor";
    document.body.appendChild(this.el);

    this.styleEl = document.createElement("style");
    this.styleEl.textContent = `
      .cursor {
        position: fixed;
        /* 锚点在左上角，用 margin 把圆心偏移到锚点 */
        top: 0;
        left: 0;
        width: 16px;
        height: 16px;
        margin-left: -8px;
        margin-top: -8px;
        border-radius: 50%;
        /* 固定高对比色：不用 mix-blend-mode，避免合成层冲突 */
        background: #ffffff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 99999;
        opacity: 0;
        /* hover 放大用 scale，从圆心放大自动居中，不影响 left/top 定位 */
        transform: scale(1);
        transition: transform 0.15s ease, opacity 0.2s ease, background 0.15s ease;
      }
      .cursor.visible {
        opacity: 0.9;
      }
      .cursor.active {
        transform: scale(0.6);
        background: #ffffff;
      }
      .cursor.hover {
        transform: scale(2.4);
        background: rgba(255, 255, 255, 0.4);
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
      }
      .cursor.hover.active {
        transform: scale(2);
      }
      @media (max-width: 768px) {
        .cursor { display: none !important; }
      }
    `;
    document.head.appendChild(this.styleEl);
  }

  bindEvents() {
    this.onMouseMove = (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      if (this.isHidden) {
        this.isHidden = false;
        this.el.classList.add("visible");
        /* 首次显示直接定位，避免从左上角飘来 */
        this.cursorX = this.mouseX;
        this.cursorY = this.mouseY;
        this.updatePosition();
      }
    };

    this.onMouseDown = () => this.el.classList.add("active");
    this.onMouseUp = () => this.el.classList.remove("active");
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

    this.setupHoverDelegation();
  }

  /**
   * hover 检测 - 事件委托
   * mouseover/mouseout 冒泡到 document，closest 判断是否在可交互元素上。
   * 一次绑定永久有效，动态元素自动支持，零 DOM 扫描。
   */
  setupHoverDelegation() {
    const selectors = 'a, button, [role="button"], input, textarea, select, .cards, [data-cursor-hover]';

    this.onMouseOver = (e) => {
      if (e.target.closest && e.target.closest(selectors)) {
        this.el.classList.add("hover");
      }
    };
    this.onMouseOut = (e) => {
      const related = e.relatedTarget;
      if (!related || !related.closest || !related.closest(selectors)) {
        this.el.classList.remove("hover");
      }
    };

    document.addEventListener("mouseover", this.onMouseOver);
    document.addEventListener("mouseout", this.onMouseOut);
  }

  /**
   * 更新位置 - 用 left/top 直接定位
   * 单个 fixed 小元素的性能无忧，浏览器会优化，不会真的触发整页重排。
   * 避免 transform 与 hover scale 冲突。
   */
  updatePosition() {
    this.el.style.left = this.cursorX + "px";
    this.el.style.top = this.cursorY + "px";
  }

  /**
   * 持续渲染 - lerp 0.5 紧跟鼠标，不做暂停优化（流畅优先）
   */
  startRender() {
    this.render = () => {
      if (!this.isHidden) {
        this.cursorX = lerp(this.cursorX, this.mouseX, 0.5);
        this.cursorY = lerp(this.cursorY, this.mouseY, 0.5);
        this.updatePosition();
      }
      this.rafId = requestAnimationFrame(this.render);
    };
    this.rafId = requestAnimationFrame(this.render);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("mouseleave", this.onMouseLeave);
    document.removeEventListener("mouseenter", this.onMouseEnter);
    document.removeEventListener("mouseover", this.onMouseOver);
    document.removeEventListener("mouseout", this.onMouseOut);
    if (this.el) this.el.remove();
    if (this.styleEl) this.styleEl.remove();
    cursorInstance = null;
  }
}

const cursorInit = () => {
  if (cursorInstance) cursorInstance.destroy();
  cursorInstance = new Cursor();
  return cursorInstance;
};

export default cursorInit;
