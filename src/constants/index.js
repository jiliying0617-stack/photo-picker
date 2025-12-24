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

// ========================================
// 布局相关常量
// ========================================

export const LAYOUT = {
  GRID_GAP: 16,            // 网格间距 (px) - Tailwind gap-4 = 1rem = 16px
  GRID_PADDING: 16,        // 网格内边距 (px) - Tailwind p-4 = 1rem = 16px
  OVERSCAN_COUNT: 5,       // 虚拟滚动预渲染行/列数，平衡性能和滚动体验
  DEFAULT_COLUMNS: 3,      // 普通模式默认列数
};

// ========================================
// 动画和过渡时长
// ========================================

export const ANIMATION = {
  SCROLL_DELAY: 300,              // 滚动动画时长 (ms)
  TRANSITION_DELAY: 150,          // 一般过渡动画时长 (ms)
  DEBOUNCE_DELAY: 1000,           // 防抖延迟 (ms) - 用于 localStorage 保存
  IDLE_DELAY: 5,                  // requestIdleCallback 超时 (ms)
  PREVIEW_CLOSE_SCROLL_DELAY: 150, // 关闭预览后滚动延迟 (ms)
  SELECT_DELAY: 100,              // 选中照片延迟 (ms)
  SELECT_AFTER_SCROLL_DELAY: 200, // 滚动后选中延迟 (ms)
};

// ========================================
// LRU 缓存配置
// ========================================

export const CACHE = {
  MAX_OBJECT_URLS: 200,    // LRU 缓存最大 Object URL 数量
};

// ========================================
// 文件格式配置
// ========================================

export const FILE_FORMATS = {
  RAW: ['raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf'],
  JPEG: ['jpg', 'jpeg'],
  PNG: ['png'],
  WEBP: ['webp'],
  HEIC: ['heic', 'heif'],
  TIFF: ['tif', 'tiff'],
};

export const FORMAT_COLORS = {
  RAW: { bg: 'bg-purple-600', text: 'text-white' },
  JPG: { bg: 'bg-blue-500', text: 'text-white' },
  PNG: { bg: 'bg-green-500', text: 'text-white' },
  WEBP: { bg: 'bg-orange-500', text: 'text-white' },
  HEIC: { bg: 'bg-pink-500', text: 'text-white' },
  TIFF: { bg: 'bg-indigo-500', text: 'text-white' },
  default: { bg: 'bg-gray-500', text: 'text-white' },
};

// ========================================
// 导出配置
// ========================================

export const EXPORT = {
  DEFAULT_FOLDER_NAMES: {
    correct: '正确_Correct',
    medium: '适中_Medium',
    wrong: '错误_Wrong',
    uncategorized: '未标记_Uncategorized',
  },
  ILLEGAL_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1F]/g, // Windows/macOS 非法文件名字符
  MAX_FILENAME_LENGTH: 255,                         // 最大文件名长度
};

// ========================================
// 性能监控阈值
// ========================================

export const PERFORMANCE = {
  SLOW_OPERATION_THRESHOLD: 100,              // 慢操作警告阈值 (ms)
  MEMORY_WARNING_THRESHOLD: 500 * 1024 * 1024, // 内存警告阈值 (500MB)
};
