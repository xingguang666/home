(function () {
  var originalTitle = document.title;
  var attractiveTitles = [
    "快回来看看吧",
    "我们想你了！",
    "精彩内容等着你",
    "别走开，精彩继续！",
  ];

  function getRandomTitle() {
    var randomIndex = Math.floor(Math.random() * attractiveTitles.length);
    return attractiveTitles[randomIndex];
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      document.title = getRandomTitle();
    } else if (document.visibilityState === "visible") {
      document.title = originalTitle;
    }
  });
})();
