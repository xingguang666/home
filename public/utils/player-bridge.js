(function () {
  var TIMEOUT_MS = 15000;
  var CHECK_INTERVAL = 300;
  var started = Date.now();

  var injectStyle = function () {
    var style = document.createElement("style");
    // Only hide tips/watermarks, preserve main player UI
    style.textContent =
      "#myhk-left-top,.myhk-left-top,.myhk-notice,.myhk-tip,.player-tip,.myhk-watermark{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}";
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
