/**
 * 核心类型定义（使用 JSDoc）
 * 提供类型安全和 IDE 智能提示，无需 TypeScript
 */

/**
 * @typedef {'correct' | 'medium' | 'wrong' | null} CategoryType
 * 照片分类类型
 */

/**
 * @typedef {Object} Photo
 * @property {string} id - 唯一标识符 (格式: `${name}-${size}-${lastModified}`)
 * @property {string} name - 文件名
 * @property {string} path - 文件完整路径
 * @property {string} folder - 所属文件夹路径
 * @property {number} size - 文件大小（字节）
 * @property {number} lastModified - 最后修改时间（时间戳）
 * @property {CategoryType} category - 分类标记
 * @property {File} [file] - 原始 File 对象
 * @property {string} [thumbnailUrl] - 缩略图 Blob URL
 */

/**
 * @typedef {Object} Filter
 * @property {CategoryType} [category] - 按分类过滤
 * @property {string[]} [folders] - 按文件夹过滤
 */

/**
 * @typedef {Object} FolderMap
 * @description 文件夹路径到照片数组的映射
 * @type {Record<string, Photo[]>}
 */

/**
 * @typedef {Object} CategoryStats
 * @property {number} total - 总照片数
 * @property {number} correct - 正确分类数量
 * @property {number} medium - 适中分类数量
 * @property {number} wrong - 错误分类数量
 * @property {number} uncategorized - 未分类数量
 */

/**
 * @typedef {Object} ExportOptions
 * @property {boolean} preserveOriginalFilename - 是否保留原文件名
 * @property {boolean} preserveFolderStructure - 是否保留文件夹结构
 * @property {boolean} exportCorrect - 是否导出"正确"分类
 * @property {boolean} exportMedium - 是否导出"适中"分类
 * @property {boolean} exportWrong - 是否导出"错误"分类
 * @property {boolean} exportUncategorized - 是否导出未分类
 */

/**
 * @typedef {Object} ExportProgress
 * @property {number} current - 当前进度
 * @property {number} total - 总数
 * @property {string} [currentFile] - 当前处理的文件名
 * @property {string} [status] - 状态描述
 */

/**
 * @typedef {Object} Toast
 * @property {string} id - Toast 唯一标识
 * @property {string} message - 消息内容
 * @property {'success' | 'error' | 'warning' | 'info'} type - 消息类型
 * @property {number} [duration] - 显示时长（毫秒）
 */

/**
 * @typedef {Object} ContextMenu
 * @property {number} x - X 坐标
 * @property {number} y - Y 坐标
 * @property {string} photoId - 关联的照片 ID
 */

/**
 * @typedef {Object} IndexedDBConfig
 * @property {string} dbName - 数据库名称
 * @property {number} version - 数据库版本
 * @property {string} storeName - 对象仓库名称
 */

/**
 * @typedef {Object} ThumbnailOptions
 * @property {number} maxSize - 最大尺寸（宽或高）
 * @property {number} quality - JPEG 质量 (0-1)
 */

/**
 * @typedef {Object} ScrollOptions
 * @property {'smooth' | 'auto' | 'instant'} behavior - 滚动行为
 * @property {'start' | 'center' | 'end'} [block] - 垂直对齐方式
 * @property {'start' | 'center' | 'end'} [inline] - 水平对齐方式
 */

/**
 * @typedef {Object} VirtualGridRef
 * @property {Function} scrollToCell - 滚动到指定单元格
 * @property {Function} scrollToRow - 滚动到指定行
 * @property {Function} resetAfterIndex - 重置缓存
 */

// ========================================
// Hook 返回值类型
// ========================================

/**
 * @typedef {Object} UsePhotoDisplayReturn
 * @property {Photo[]} filteredPhotos - 过滤后的照片列表
 */

/**
 * @typedef {Object} UsePhotoSelectionReturn
 * @property {string[]} selectedPhotos - 选中的照片 ID 列表
 * @property {Function} setSelectedPhotos - 设置选中照片
 * @property {Function} togglePhotoSelection - 切换照片选中状态
 * @property {Function} clearSelection - 清空选中
 */

/**
 * @typedef {Object} UseCompareModeReturn
 * @property {boolean} isCompareMode - 是否为对比模式
 * @property {number} compareColumns - 对比模式列数
 * @property {(Photo | null)[]} displayPhotos - 显示的照片列表（包含占位符）
 */

/**
 * @typedef {Object} UseToastReturn
 * @property {Toast[]} toasts - Toast 列表
 * @property {Function} closeToast - 关闭 Toast
 * @property {Function} success - 显示成功消息
 * @property {Function} error - 显示错误消息
 * @property {Function} warning - 显示警告消息
 * @property {Function} info - 显示信息消息
 */

// ========================================
// 事件处理器类型
// ========================================

/**
 * @callback PhotoClickHandler
 * @param {MouseEvent} event - 鼠标事件
 * @param {Photo} photo - 被点击的照片
 * @returns {void}
 */

/**
 * @callback CategorySetHandler
 * @param {string} photoId - 照片 ID
 * @param {CategoryType} category - 分类
 * @returns {void}
 */

/**
 * @callback PreviewOpenHandler
 * @param {(Photo | null)[]} photos - 要预览的照片列表
 * @returns {void}
 */

/**
 * @callback ProgressHandler
 * @param {ExportProgress} progress - 进度信息
 * @returns {void}
 */

// ========================================
// Store 类型
// ========================================

/**
 * @typedef {Object} PhotoStore
 * @property {Photo[]} photos - 照片列表
 * @property {FolderMap} folderMap - 文件夹映射
 * @property {Record<string, CategoryType>} categories - 分类映射（key: photoKey）
 * @property {number} columns - 网格列数
 * @property {string | null} selectedPhotoId - 当前选中的照片 ID
 * @property {boolean} groupBrowseMode - 组浏览模式
 * @property {Function} setPhotos - 设置照片列表
 * @property {Function} addPhotos - 添加照片
 * @property {CategorySetHandler} setCategory - 设置分类
 * @property {Function} setCategoryBatch - 批量设置分类
 * @property {Function} clearCategories - 清空所有分类
 * @property {Function} clearPhotos - 清空照片列表
 * @property {Function} setColumns - 设置列数
 * @property {Function} setSelectedPhotoId - 设置选中照片
 * @property {Function} setGroupBrowseMode - 设置组浏览模式
 * @property {Function} getStats - 获取统计信息
 * @property {Function} getCategorizedPhotos - 获取已分类照片
 * @property {Function} diagnose - 诊断工具
 */

// ========================================
// 导出所有类型（用于其他文件导入）
// ========================================

export {};
