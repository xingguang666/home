(function () {
  var TIMEOUT_MS = 15000;
  var CHECK_INTERVAL = 300;
  var started = Date.now();

  // 修复：阻止 myhkw 播放器进站自动播放。
  // myhkw 后台开启「自动播放」后，脚本加载即调 audio.play()，
  // 在有媒体参与记录的浏览器里会直接出声。
  // 策略：用户首次交互（点击/按键/触摸）前，拦截 myhkw 音频的播放；
  // 站内 APlayer 的自动播放开关（settings 可配）不受影响。
  var userInteracted = false;
  ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
    document.addEventListener(
      evt,
      function () {
        userInteracted = true;
      },
      { passive: true }
    );
  });
  var isMyhkAudio = function (audio) {
    if (audio.closest && audio.closest("#myhkplayer")) return true;
    var src = audio.currentSrc || audio.src || "";
    return src.indexOf("myhkw.cn") !== -1;
  };

  var injectStyle = function () {
    var style = document.createElement("style");
    // Only hide tips/watermarks, preserve main player UI
    style.textContent =
      "#myhk-left-top,.myhk-left-top,.myhk-notice,.myhk-tip,.player-tip,.myhk-watermark{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}" +
      // 播放器装饰层（封面图/封面容器/模糊背景）不拦截指针事件：
      // 容器 fixed 且 z-index 最大，会挡住底下页面元素的点击。
      // 播放器自身的控制条（.myhkcontrol 等）不受影响。
      "#myhkplayer img,#myhkplayer .myhkcover,#myhkplayer .myhkblur-img{pointer-events:none!important}";
    document.head.appendChild(style);
  };

  var notifyPlay = function () {
    window.dispatchEvent(new CustomEvent("player:play"));
  };

  var notifyPause = function () {
    window.dispatchEvent(new CustomEvent("player:pause"));
  };

  // Audio mutual exclusion: pause all other <audio> elements when one starts playing
  var pauseOthers = function (current) {
    var allAudios = document.querySelectorAll("audio");
    for (var i = 0; i < allAudios.length; i++) {
      if (allAudios[i] !== current && !allAudios[i].paused) {
        allAudios[i].pause();
      }
    }
  };

  var hookAudio = function (audio) {
    if (audio.__hooked) return;
    audio.__hooked = true;
    audio.addEventListener("play", function () {
      // 用户交互前拦截 myhkw 的自动播放（见文件头注释）
      if (!userInteracted && isMyhkAudio(audio)) {
        audio.pause();
        return;
      }
      pauseOthers(audio);
      notifyPlay();
    });
    audio.addEventListener("pause", notifyPause);
    audio.addEventListener("ended", notifyPause);
    if (!audio.paused) notifyPlay();
  };

  var scan = function () {
    var audios = document.querySelectorAll("audio");
    for (var i = 0; i < audios.length; i++) {
      hookAudio(audios[i]);
    }
  };

  // 注入样式立即执行
  injectStyle();

  // 轮询扫描 audio 元素
  var tid = setInterval(function () {
    scan();
    if (Date.now() - started > TIMEOUT_MS) {
      clearInterval(tid);
    }
  }, CHECK_INTERVAL);

  // 也监听 DOM 变化
  if (window.MutationObserver) {
    var observer = new MutationObserver(function () {
      scan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
