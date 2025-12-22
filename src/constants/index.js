/**
 * Application Constants
 * 集中管理所有魔术数字和配置项
 */

// 图片显示配置
export const PHOTO_DISPLAY = {
  INITIAL_COUNT: 100,      // 初始显示图片数量
  LOAD_INCREMENT: 50,      // 每次滚动加载增量
  SCROLL_THRESHOLD: 500,   // 触发加载的滚动阈值(px)
  MAX_RENDER_COUNT: 500,   // 最大渲染数量（防止内存溢出和崩溃）
  SAFE_RENDER_COUNT: 800,  // 安全渲染上限（超过此值会有性能警告）
};

// 对比模式配置
export const COMPARE_MODE = {
  MIN_FOLDERS: 2,          // 对比模式最少文件夹数
  MAX_FOLDERS: 8,          // 对比模式最多文件夹数
};

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  CORRECT: '1',
  MEDIUM: '2',
  WRONG: '3',
  CLEAR: ['0', 'x', 'X'],
  PREV: 'ArrowLeft',
  NEXT: 'ArrowRight',
};

// 分类类型
export const CATEGORY = {
  CORRECT: 'correct',
  MEDIUM: 'medium',
  WRONG: 'wrong',
};

// 分类图标配置
export const CATEGORY_ICONS = {
  correct: { icon: '✓', color: 'text-green-600' },
  medium: { icon: '~', color: 'text-yellow-600' },
  wrong: { icon: '✕', color: 'text-red-600' },
};

// Toast 配置
export const TOAST = {
  DURATION: 3000,          // Toast 显示时长(ms)
  MAX_COUNT: 5,            // 最多同时显示的 Toast 数量
};

// 滚动行为配置
export const SCROLL_BEHAVIOR = {
  SMOOTH: 'smooth',
  AUTO: 'auto',
  INSTANT: 'instant',
};

// 预览模式配置
export const PREVIEW = {
  SCROLL_DELAY: 100,       // 预览关闭后滚动延迟(ms)
};

// 对比模式切换配置
export const COMPARE_TRANSITION = {
  SCROLL_DELAY: 100,       // 模式切换后滚动延迟(ms)
};
