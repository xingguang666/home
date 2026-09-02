function debounce(func, wait = 300, immediate = false) {
  let timeout = null;
  return function (...args) {
    const context = this;
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow) func.apply(context, args);
    } else {
      timeout = setTimeout(() => func.apply(context, args), wait);
    }
  };
}

export default debounce;
