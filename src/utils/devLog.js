/**
 * 开发环境日志工具
 * 生产环境下自动禁用，避免性能损耗
 */

const isDev = import.meta.env.DEV;

export function devLog(...args) {
  if (isDev) {
    console.log(...args);
  }
}

export function devWarn(...args) {
  if (isDev) {
    console.warn(...args);
  }
}

export function devError(...args) {
  if (isDev) {
    console.error(...args);
  }
}
