/**
 * Application Constants
 * 集中管理所有魔术数字和配置项
 */

// 图片显示配置
export const PHOTO_DISPLAY = {
  INITIAL_COUNT: 100,      // 初始显示图片数量（已废弃，虚拟滚动不需要）
  LOAD_INCREMENT: 50,      // 每次滚动加载增量（已废弃）
  SCROLL_THRESHOLD: 500,   // 触发加载的滚动阈值(px)（已废弃）
  MAX_RENDER_COUNT: Infinity, // 无限制！虚拟滚动 + 按需URL创建解决了性能问题
  SAFE_RENDER_COUNT: 800,  // 已废弃
  VISIBLE_BUFFER: 10,      // 可见区域缓冲行数（预加载）
};

// 对比模式配置
export const COMPARE_MODE = {
  MIN_FOLDERS: 2,          // 对比模式最少文件夹数
  MAX_FOLDERS: 8,          // 对比模式最多文件夹数
};

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  // 分类标记
  CORRECT: '1',
  MEDIUM: '2',
  WRONG: '3',
  CLEAR: ['0', 'x', 'X', 'Delete', 'Backspace'],  // 🆕 添加 Delete/Backspace

  // 导航
  PREV: 'ArrowLeft',
  NEXT: 'ArrowRight',
  FIRST: 'Home',           // 🆕 跳到第一张
  LAST: 'End',             // 🆕 跳到最后一张

  // 选择（需要配合 Shift/Ctrl 键）
  // Shift+ArrowLeft/Right - 范围选择
  // Ctrl+A - 全选
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
  SCROLL_DELAY: 300,       // 模式切换后滚动延迟(ms) - 增加延迟确保 DOM 更新完成
  HIGHLIGHT_DURATION: 2000, // 高亮选中照片的时长(ms)
};
