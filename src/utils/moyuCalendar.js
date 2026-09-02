/**
 * 摸鱼日历算法
 * 包含：法定节假日计算、倒计时、工作日统计等
 */

// 2026年法定节假日配置
export const HOLIDAYS_2026 = [
  { name: '元旦', date: '2026-01-01', duration: 1 },
  { name: '春节', date: '2026-02-17', duration: 7 },
  { name: '清明节', date: '2026-04-05', duration: 3 },
  { name: '劳动节', date: '2026-05-01', duration: 5 },
  { name: '端午节', date: '2026-05-31', duration: 3 },
  { name: '中秋节', date: '2026-09-25', duration: 3 },
  { name: '国庆节', date: '2026-10-01', duration: 7 },
];

// 2025年法定节假日配置
export const HOLIDAYS_2025 = [
  { name: '元旦', date: '2025-01-01', duration: 1 },
  { name: '春节', date: '2025-01-29', duration: 8 },
  { name: '清明节', date: '2025-04-04', duration: 3 },
  { name: '劳动节', date: '2025-05-01', duration: 5 },
  { name: '端午节', date: '2025-05-31', duration: 3 },
  { name: '中秋节', date: '2025-10-06', duration: 1 },
  { name: '国庆节', date: '2025-10-01', duration: 7 },
];

// 调休日期（需要上班的周末）
export const WORKDAYS_2026 = [
  '2026-02-15', // 春节调休
  '2026-02-23', // 春节调休
  '2026-04-26', // 劳动节调休
  '2026-05-09', // 劳动节调休
  '2026-09-27', // 国庆调休
  '2026-10-10', // 国庆调休
];

export const WORKDAYS_2025 = [
  '2025-01-26', // 春节调休
  '2025-02-08', // 春节调休
  '2025-04-27', // 劳动节调休
  '2025-05-28', // 端午调休
  '2025-09-28', // 国庆调休
  '2025-10-11', // 国庆调休
];

/**
 * 获取当前年份的节假日配置
 */
export const getHolidays = () => {
  const year = new Date().getFullYear();
  return year === 2026 ? HOLIDAYS_2026 : HOLIDAYS_2025;
};

/**
 * 获取当前年份的调休日期
 */
export const getWorkdays = () => {
  const year = new Date().getFullYear();
  return year === 2026 ? WORKDAYS_2026 : WORKDAYS_2025;
};

/**
 * 计算距离下一个节假日的天数
 */
export const getNextHoliday = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const holidays = getHolidays();

  for (const holiday of holidays) {
    const holidayDate = new Date(holiday.date);
    if (holiday.date > today) {
      const diffTime = holidayDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        name: holiday.name,
        date: holiday.date,
        until: diffDays,
        duration: holiday.duration
      };
    }
  }

  // 如果今年没有了，返回明年的第一个
  const nextYear = new Date().getFullYear() + 1;
  const nextYearHolidays = nextYear === 2026 ? HOLIDAYS_2026 : HOLIDAYS_2025;
  if (nextYearHolidays.length > 0) {
    const firstHoliday = nextYearHolidays[0];
    const holidayDate = new Date(firstHoliday.date);
    const diffTime = holidayDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      name: firstHoliday.name,
      date: firstHoliday.date,
      until: diffDays,
      duration: firstHoliday.duration
    };
  }

  return null;
};

/**
 * 计算距离周末的天数
 */
export const getDaysToWeekend = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  return dayOfWeek === 0 ? 0 : 6 - dayOfWeek;
};

/**
 * 计算下班倒计时
 */
export const getCountdownToOffWork = (offWorkTime = '18:00') => {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // 周末不计算
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }

  const [hours, minutes] = offWorkTime.split(':').map(Number);
  const offWorkDate = new Date(now);
  offWorkDate.setHours(hours, minutes, 0, 0);

  const diff = offWorkDate - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, passed: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hoursLeft = Math.floor(totalSeconds / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;

  return {
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
    passed: false
  };
};

/**
 * 计算上班倒计时（下班后显示明天上班时间）
 */
export const getCountdownToOnWork = (onWorkTime = '09:00') => {
  const now = new Date();
  let dayOfWeek = now.getDay();

  // 计算下一个工作日
  let targetDate = new Date(now);

  // 如果今天是工作日且已下班，或者今天是周末
  if (dayOfWeek === 6) {
    // 周六 -> 周一
    targetDate.setDate(now.getDate() + 2);
  } else if (dayOfWeek === 0) {
    // 周日 -> 周一
    targetDate.setDate(now.getDate() + 1);
  } else if (dayOfWeek === 5) {
    // 周五 -> 下周一
    targetDate.setDate(now.getDate() + 3);
  } else {
    // 其他工作日 -> 明天
    targetDate.setDate(now.getDate() + 1);
  }

  const [hours, minutes] = onWorkTime.split(':').map(Number);
  targetDate.setHours(hours, minutes, 0, 0);

  const diff = targetDate - now;

  if (diff <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hoursLeft = Math.floor((totalSeconds % 86400) / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);

  return {
    days,
    hours: hoursLeft,
    minutes: minutesLeft,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5
  };
};

/**
 * 获取当前工作状态
 */
export const getWorkStatus = (onWorkTime = '09:00', offWorkTime = '18:00') => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeNum = currentHour * 60 + currentMinute;

  const [onHour, onMin] = onWorkTime.split(':').map(Number);
  const [offHour, offMin] = offWorkTime.split(':').map(Number);
  const onTimeNum = onHour * 60 + onMin;
  const offTimeNum = offHour * 60 + offMin;

  // 周末
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      status: 'weekend',
      label: '周末休息',
      message: '好好享受周末'
    };
  }

  // 检查是否是节假日
  const today = now.toISOString().split('T')[0];
  const holidays = getHolidays();
  for (const holiday of holidays) {
    const holidayStart = new Date(holiday.date);
    const holidayEnd = new Date(holidayStart);
    holidayEnd.setDate(holidayStart.getDate() + holiday.duration - 1);
    if (today >= holiday.date && today <= holidayEnd.toISOString().split('T')[0]) {
      return {
        status: 'holiday',
        label: `${holiday.name}假期`,
        message: '享受假期'
      };
    }
  }

  // 上班前
  if (currentTimeNum < onTimeNum) {
    return {
      status: 'beforeWork',
      label: '距离上班',
      message: '准备开始新的一天'
    };
  }

  // 工作中
  if (currentTimeNum >= onTimeNum && currentTimeNum < offTimeNum) {
    return {
      status: 'working',
      label: '距离下班',
      message: '努力工作中'
    };
  }

  // 下班后
  return {
    status: 'afterWork',
    label: '已下班',
    message: '好好休息'
  };
};

/**
 * 检查今天是否是调休工作日
 */
export const isAdjustmentWorkday = () => {
  const today = new Date().toISOString().split('T')[0];
  const workdays = getWorkdays();
  return workdays.includes(today);
};

/**
 * 检查今天是否是工作日
 */
export const isWorkday = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // 周末
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // 检查是否是调休工作日
    return isAdjustmentWorkday();
  }

  // 工作日，检查是否是法定节假日
  const today = now.toISOString().split('T')[0];
  const holidays = getHolidays();

  for (const holiday of holidays) {
    const holidayStart = new Date(holiday.date);
    const holidayEnd = new Date(holidayStart);
    holidayEnd.setDate(holidayStart.getDate() + holiday.duration - 1);

    if (today >= holiday.date && today <= holidayEnd.toISOString().split('T')[0]) {
      return false; // 是节假日，不是工作日
    }
  }

  return true;
};

/**
 * 计算本周已工作天数
 */
export const getWorkedDaysThisWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  let workedDays = 0;
  for (let i = 1; i < currentDay; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() - currentDay + i);
    const day = checkDate.getDay();

    if (day !== 0 && day !== 6) {
      workedDays++;
    }
  }

  // 今天如果是工作日也算
  if (isWorkday()) {
    const hour = now.getHours();
    if (hour >= 9) { // 9点后算已工作
      workedDays++;
    }
  }

  return workedDays;
};

/**
 * 计算本月工作日总数
 */
export const getTotalWorkdaysThisMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let workdays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const checkDate = new Date(year, month, day);
    const dayOfWeek = checkDate.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workdays++;
    }
  }

  return workdays;
};

/**
 * 计算时段进度
 */
export const calculateProgress = () => {
  const now = new Date();
  const year = now.getFullYear();

  // 年进度
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);
  const yearProgress = ((now - startOfYear) / (endOfYear - startOfYear) * 100);

  // 月进度
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 1);
  const monthProgress = ((now - startOfMonth) / (endOfMonth - startOfMonth) * 100);

  // 周进度
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const weekProgress = ((now - startOfWeek) / (endOfWeek - startOfWeek) * 100);

  // 日进度（假设工作时间为 9:00 - 18:00）
  const dayStart = new Date(now);
  dayStart.setHours(9, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(18, 0, 0, 0);
  let dayProgress = 0;
  if (now >= dayStart && now <= dayEnd) {
    dayProgress = ((now - dayStart) / (dayEnd - dayStart) * 100);
  } else if (now > dayEnd) {
    dayProgress = 100;
  }

  return {
    year: Math.round(yearProgress),
    month: Math.round(monthProgress),
    week: Math.round(weekProgress),
    day: Math.round(dayProgress)
  };
};

/**
 * 农历相关
 */
const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
const zodiacs = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊'];

/**
 * 获取生肖
 */
export const getZodiac = (year) => {
  return zodiacs[year % 12];
};

/**
 * 简化农历显示
 */
export const getSimpleLunarDate = (date) => {
  const day = date.getDate();
  const month = date.getMonth();
  return `${lunarMonths[month]}月${lunarDays[Math.min(day - 1, 29)]}`;
};

/**
 * 摸鱼格言
 */
export const MOYU_QUOTES = [
  '摸鱼一时爽，一直摸鱼一直爽',
  '工作是老板的，身体是自己的',
  '适当摸鱼，有益身心',
  '认真工作是为了更好地摸鱼',
  '摸鱼是打工人的自我修养',
  '不是为了摸鱼而工作，而是为了工作而摸鱼',
  '只要我摸得够快，老板就追不上我',
  '一天不摸鱼，浑身难受',
  '工作不如摸鱼，摸鱼不如摸鱼',
  '人生苦短，及时摸鱼',
  '今日事今日毕，哪怕摸鱼到天黑',
  '工作只是副业，摸鱼才是正业',
  '我不是在偷懒，我是在充电',
  '忙碌只是假象，摸鱼才是真相'
];
