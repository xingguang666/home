import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// Meting API 获取播放列表
export const getPlayerList = async (server, type, id) => {
  const apiUrl = import.meta.env.VITE_SONG_API;

  if (!apiUrl) {
    throw new Error("请配置 VITE_SONG_API");
  }

  const res = await fetch(`${apiUrl}?server=${server}&type=${type}&id=${id}`);
  const data = await res.json();

  if (!data || !data[0]) {
    throw new Error("获取歌单失败");
  }

  // QQ 音乐特殊处理：JSONP 解析
  if (data[0].url && data[0].url.startsWith("@")) {
    const urlParts = data[0].url.split("@").slice(1);
    if (urlParts.length >= 4) {
      const jsonpUrl = urlParts[3];
      try {
        const jsonpData = await fetchJsonp(jsonpUrl).then((res) => res.json());
        const sip = jsonpData.req_0?.data?.sip || [];
        const midurlinfo = jsonpData.req_0?.data?.midurlinfo || [];

        const domain = (sip.find((i) => !i.startsWith("http://ws")) || sip[0] || "")
          .replace("http://", "https://");

        return data.map((v, i) => ({
          name: v.name || v.title,
          artist: v.artist || v.author,
          url: domain + (midurlinfo[i]?.purl || ""),
          cover: v.cover || v.pic,
          lrc: v.lrc,
        }));
      } catch {
        // JSONP 解析失败，继续返回原始数据
      }
    }
  }

  // 标准格式
  return data.map((v) => ({
    name: v.name || v.title,
    artist: v.artist || v.author,
    url: v.url,
    cover: v.cover || v.pic,
    lrc: v.lrc,
  }));
};

// 网易云歌单解析 API - 缓存一天
const NETEASE_CACHE_KEY = 'netease_playlist_cache';
const NETEASE_CACHE_TTL = 24 * 60 * 60 * 1000; // 1天

export const getNeteasePlaylist = async (id) => {
  if (!id) {
    throw new Error("请提供歌单ID");
  }

  // 检查缓存
  try {
    const cacheKey = `${NETEASE_CACHE_KEY}_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < NETEASE_CACHE_TTL) {
        return data;
      }
    }
  } catch {
    // 缓存读取失败，继续请求
  }

  // 请求 API
  const res = await fetch(`https://oiapi.net/api/NeteasePlaylistDetail?id=${id}`);
  const result = await res.json();

  if (result.code !== 1 || !result.data) {
    throw new Error(result.message || "获取网易云歌单失败");
  }

  // 转换格式
  const playlist = result.data.map((item) => ({
    name: item.name,
    artist: item.artists?.map((a) => a.name).join(" / ") || "未知歌手",
    url: item.url,
    cover: item.cover || item.album?.cover,
    lrc: null,
    id: item.id,
  }));

  // 存储缓存
  try {
    const cacheKey = `${NETEASE_CACHE_KEY}_${id}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data: playlist,
      timestamp: Date.now(),
    }));
  } catch {
    // 缓存存储失败，忽略
  }

  return playlist;
};

/**
 * 一言
 */

export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 问候语
 */

export const getGreetingMessage = async () => {
  try {
    const res = await fetch("https://api.kuleu.com/api/getGreetingMessage?type=json");
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * 天气 API
 */

const AMAP_KEY = import.meta.env.VITE_WEATHER_KEY;
const DEFAULT_CITY = import.meta.env.VITE_DEFAULT_CITY || "北京";

const getBrowserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("浏览器不支持地理定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let msg = "定位失败";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "用户拒绝了定位权限";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "位置信息不可用";
            break;
          case error.TIMEOUT:
            msg = "定位超时";
            break;
        }
        reject(new Error(msg));
      },
      { timeout: 15000, enableHighAccuracy: false }
    );
  });
};

const getAmapRegeo = async (longitude, latitude) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}&extensions=base&output=JSON`
  );
  const data = await res.json();

  if (data && data.status === "1" && data.regeocode) {
    const address = data.regeocode.addressComponent;
    const city = address.city || address.district || address.province;
    return String(city).replace(/[省市]/g, "");
  }
  throw new Error("逆地理编码失败");
};

const jsonpRequest = (url) => {
  return new Promise((resolve, reject) => {
    const callbackName = "_amap_callback_" + Date.now();
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP 请求超时"));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callbackName];
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP 加载失败"));
    };

    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}callback=${callbackName}`;
    document.head.appendChild(script);
  });
};

const getAmapWeather = async (city) => {
  const data = await jsonpRequest(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${encodeURIComponent(city)}&extensions=base&output=JSON`
  );

  const statusOk = data && (data.status === "1" || data.status === 1);
  if (statusOk && data.lives && data.lives.length > 0) {
    const live = data.lives[0];
    return {
      code: 1,
      data: {
        city: String(live.city).replace(/市$/, ""),
        current: {
          weather: live.weather,
          temp: live.temperature,
          wind: live.winddirection ? live.winddirection + "风" : "",
          windSpeed: live.windpower,
          icon: null,
        },
      },
    };
  }
  throw new Error("高德天气返回数据异常");
};

export const getIpAddress = async () => {
  try {
    const data = await jsonpRequest(
      `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}&output=JSON`
    );

    if (data && data.status === "1" && data.city) {
      let city = Array.isArray(data.city) ? data.city[0] : data.city;
      city = String(city).replace(/[省市]/g, "");
      if (!city || city === "undefined" || city === "null") {
        throw new Error("高德IP定位返回无效城市");
      }
      let province = Array.isArray(data.province) ? data.province[0] : data.province;
      province = String(province || city);
      if (province === "undefined" || province === "null") {
        province = city;
      }
      return { city, region: province, country: "中国" };
    }
    throw new Error("高德 IP 定位返回数据异常");
  } catch {
    return { city: DEFAULT_CITY, region: DEFAULT_CITY, country: "中国" };
  }
};

export const getWeather = async (city) => {
  try {
    if (city) {
      return await getAmapWeather(city);
    }
    const pos = await getBrowserLocation();
    const cityName = await getAmapRegeo(pos.longitude, pos.latitude);
    return await getAmapWeather(cityName);
  } catch {
    try {
      const ipData = await getIpAddress();
      const ipCity = String(ipData.city).replace(/[省市]/g, "");
      return await getAmapWeather(ipCity);
    } catch {
      return null;
    }
  }
};
