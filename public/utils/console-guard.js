(function () {
  var methods = ["log", "info", "warn", "debug"];
  var keywords = [
    "明月浩空",
    "播放器：",
    "本站自豪",
    "控制面板",
    "歌单缓存",
    "界面数据",
    "播放数据",
    "myhkw.cn",
    "免费提供",
  ];
  var songPattern = /^\s*\d+-\d+\s/;

  methods.forEach(function (method) {
    var original = console[method];
    console[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      var str = args
        .map(function (a) {
          return typeof a === "string" ? a : "";
        })
        .join(" ");
      for (var i = 0; i < keywords.length; i++) {
        if (str.indexOf(keywords[i]) !== -1) return;
      }
      if (songPattern.test(str)) return;
      original.apply(console, args);
    };
  });
})();
