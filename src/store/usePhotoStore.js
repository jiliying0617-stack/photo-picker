import { create } from 'zustand';
import { getUserStorageKey } from '../utils/userIdentity';
import { devLog, devError } from '../utils/devLog';
import { debounce, runWhenIdle } from '../utils/debounce';

/** @typedef {import('../types').Photo} Photo */
/** @typedef {import('../types').CategoryType} CategoryType */
/** @typedef {import('../types').FolderMap} FolderMap */

// 从 localStorage 加载列数配置
function loadColumns() {
  try {
    const columnsKey = getUserStorageKey('columns');
    const savedColumns = localStorage.getItem(columnsKey);
    return savedColumns ? parseInt(savedColumns) : 3;
  } catch (error) {
    devError('加载列数失败:', error);
    return 3;
  }
}

// 验证分类值是否有效
function isValidCategory(category) {
  const validCategories = ['correct', 'medium', 'wrong', null, undefined];
  return validCategories.includes(category);
}

// 从 localStorage 加载分类标记
function loadCategories() {
  try {
    const categoriesKey = getUserStorageKey('categories');
    const savedCategories = localStorage.getItem(categoriesKey);
    if (!savedCategories) return {};

    const categories = JSON.parse(savedCategories);

    // 验证并清理无效的分类值
    const cleanedCategories = {};
    Object.entries(categories).forEach(([path, category]) => {
      if (isValidCategory(category)) {
        cleanedCategories[path] = category;
      }
    });

    return cleanedCategories;
  } catch (error) {
    devError('加载分类标记失败:', error);
    return {};
  }
}

// 保存分类标记到 localStorage (防抖 + 异步)
const saveCategories = debounce((categories) => {
  runWhenIdle(() => {
    try {
      const categoriesKey = getUserStorageKey('categories');
      localStorage.setItem(categoriesKey, JSON.stringify(categories));
    } catch (error) {
      devError('保存分类标记失败:', error);
    }
  });
}, 1000);

// 提取文件夹路径的辅助函数
function getFolderPath(photoPath) {
  const parts = photoPath.split('/');
  parts.pop();
  return parts.join('/');
}

// 生成照片的唯一标识符（用于分类标记）
function getPhotoKey(photo) {
  return `${photo.path}|${photo.size}|${photo.lastModified}`;
}

// ========================================
// 🔥 LINUS 风格核心：自动同步引擎
// ========================================

/**
 * 核心同步函数：确保 photos、folderMap、categories 永远一致
 *
 * 工作原理：
 * 1. categories mapping 是唯一的 source of truth
 * 2. photos[].category 从 categories 实时计算
 * 3. folderMap 从 photos 实时计算
 * 4. 自动清理孤立的 category keys
 *
 * 调用时机：任何可能改变数据的操作后
 *
 * @param {Photo[]} rawPhotos - 原始照片数组
 * @param {Record<string, CategoryType>} categories - 分类映射
 * @returns {{photos: Photo[], folderMap: FolderMap, categories: Record<string, CategoryType>}}
 */
function syncState(rawPhotos, categories) {
  // Step 1: 去重（基于 path）
  const seenPaths = new Set();
  const uniquePhotos = rawPhotos.filter(photo => {
    if (seenPaths.has(photo.path)) return false;
    seenPaths.add(photo.path);
    return true;
  });

  // Step 2: 为每张照片附加 category（从 categories mapping 获取）
  const photosWithCategories = uniquePhotos.map(photo => ({
    ...photo,
    category: categories[getPhotoKey(photo)] || null,
    folder: getFolderPath(photo.path),
  }));

  // Step 3: 自动清理孤立的 category keys
  const validKeys = new Set(photosWithCategories.map(p => getPhotoKey(p)));
  const cleanedCategories = {};
  let orphanedCount = 0;

  Object.entries(categories).forEach(([key, value]) => {
    if (validKeys.has(key)) {
      cleanedCategories[key] = value;
    } else {
      orphanedCount++;
    }
  });

  if (orphanedCount > 0) {
    devLog(`🧹 自动清理了 ${orphanedCount} 个孤立的 category keys`);
    saveCategories(cleanedCategories);
  }

  // Step 4: 构建 folderMap
  const folderMap = {};
  photosWithCategories.forEach(photo => {
    const folder = photo.folder;
    if (!folderMap[folder]) {
      folderMap[folder] = [];
    }
    folderMap[folder].push(photo);
  });

  // Step 5: 统计信息
  const stats = {
    total: photosWithCategories.length,
    categorized: photosWithCategories.filter(p => p.category).length,
    mappingKeys: Object.keys(cleanedCategories).length,
    orphaned: orphanedCount,
  };

  devLog(`✓ 同步完成: ${stats.total} 张照片, ${stats.categorized} 已分类, ${stats.mappingKeys} 个 keys`);

  return {
    photos: photosWithCategories,
    folderMap,
    categories: cleanedCategories,
  };
}

// ========================================
// 🎯 Zustand Store
// ========================================

const usePhotoStore = create((set, get) => ({
  // State
  photos: [],
  folderMap: {},
  columns: loadColumns(),
  selectedPhotoId: null,
  categories: loadCategories(), // 唯一的 source of truth
  groupBrowseMode: false,

  // ========================================
  // 🔥 核心 API：所有修改都通过这些函数
  // ========================================

  /**
   * 设置照片列表（导入时调用）
   * @param {Photo[]} rawPhotos - 原始照片数组
   */
  setPhotos: (rawPhotos) => {
    const categories = get().categories;
    const synced = syncState(rawPhotos, categories);
    set(synced);
  },

  /**
   * 添加照片
   */
  addPhotos: (newPhotos) => {
    const currentPhotos = get().photos;
    const categories = get().categories;
    const allPhotos = [...currentPhotos, ...newPhotos];
    const synced = syncState(allPhotos, categories);
    set(synced);
  },

  /**
   * 设置单张照片的分类
   * @param {string} photoId - 照片 ID
   * @param {CategoryType} category - 分类
   */
  setCategory: (photoId, category) => {
    // 验证分类值
    if (category && !isValidCategory(category)) {
      devError(`⚠️ 无效的分类值: ${category}`);
      return;
    }

    const photos = get().photos;
    const photo = photos.find(p => p.id === photoId);
    if (!photo) {
      devError(`Photo not found: ${photoId}`);
      return;
    }

    // 🔥 关键：只修改 categories mapping，然后触发同步
    const categories = { ...get().categories };
    const photoKey = getPhotoKey(photo);

    if (category) {
      categories[photoKey] = category;
    } else {
      delete categories[photoKey];
    }

    // 触发同步（自动更新 photos 和 folderMap）
    const synced = syncState(photos, categories);
    set(synced);
    saveCategories(synced.categories);
  },

  /**
   * 批量设置分类（性能优化版）
   * @param {string[]} photoIds - 照片 ID 数组
   * @param {CategoryType} category - 分类
   */
  setCategoryBatch: (photoIds, category) => {
    if (!photoIds || photoIds.length === 0) return;

    // 验证分类值
    if (category && !isValidCategory(category)) {
      devError(`⚠️ 无效的分类值: ${category}`);
      return;
    }

    const photos = get().photos;
    const categories = { ...get().categories };
    const photoIdSet = new Set(photoIds);

    // 🔥 批量更新 categories mapping
    photos.forEach(photo => {
      if (photoIdSet.has(photo.id)) {
        const photoKey = getPhotoKey(photo);
        if (category) {
          categories[photoKey] = category;
        } else {
          delete categories[photoKey];
        }
      }
    });

    // 触发同步
    const synced = syncState(photos, categories);
    set(synced);
    saveCategories(synced.categories);

    devLog(`✓ 批量更新 ${photoIds.length} 张图片的分类`);
  },

  /**
   * 清空所有分类
   */
  clearCategories: () => {
    const photos = get().photos;

    // 🔥 直接清空 categories mapping，触发同步
    const synced = syncState(photos, {});
    set(synced);

    const categoriesKey = getUserStorageKey('categories');
    localStorage.removeItem(categoriesKey);

    devLog(`✓ 清空所有分类标记 (${photos.length} 张照片)`);
  },

  /**
   * 清空照片列表
   */
  clearPhotos: () => {
    set({ photos: [], folderMap: {}, selectedPhotoId: null });
    devLog('✓ 清空图片列表 (分类标记已保留)');
  },

  // ========================================
  // 🔧 其他 Actions
  // ========================================

  setColumns: (columns) => {
    set({ columns });
    const storageKey = getUserStorageKey('columns');
    localStorage.setItem(storageKey, columns.toString());
  },

  setSelectedPhotoId: (photoId) => set({ selectedPhotoId: photoId }),

  setGroupBrowseMode: (enabled) => set({ groupBrowseMode: enabled }),

  // ========================================
  // 📊 计算属性
  // ========================================

  getStats: () => {
    const photos = get().photos;
    return {
      total: photos.length,
      correct: photos.filter(p => p.category === 'correct').length,
      medium: photos.filter(p => p.category === 'medium').length,
      wrong: photos.filter(p => p.category === 'wrong').length,
      uncategorized: photos.filter(p => !p.category).length,
    };
  },

  getCategorizedPhotos: () => {
    const photos = get().photos;
    return photos.filter(p => p.category);
  },

  // ========================================
  // 🔍 诊断工具
  // ========================================

  diagnose: () => {
    const photos = get().photos;
    const categories = get().categories;

    console.group('🔍 Linus 深度诊断报告');

    // localStorage 原始数据
    console.group('📦 localStorage 原始数据');
    const categoriesKey = getUserStorageKey('categories');
    const rawData = localStorage.getItem(categoriesKey);
    const parsedCategories = rawData ? JSON.parse(rawData) : {};

    const oldFormatKeys = [];
    const newFormatKeys = [];
    Object.keys(parsedCategories).forEach(key => {
      if (key.includes('|')) {
        newFormatKeys.push({ key, value: parsedCategories[key] });
      } else {
        oldFormatKeys.push({ key, value: parsedCategories[key] });
      }
    });

    console.log('Categories keys count:', Object.keys(parsedCategories).length);
    console.log('✅ 新格式 key (path|size|modified):', newFormatKeys.length);
    if (oldFormatKeys.length > 0) {
      console.warn('⚠️ 发现旧格式 key:', oldFormatKeys.length);
    }
    console.groupEnd();

    // 数据一致性检查
    const photosWithCategory = photos.filter(p => p.category);
    const photoKeys = new Set(photos.map(p => getPhotoKey(p)));

    const orphanedKeys = [];
    Object.keys(categories).forEach(key => {
      if (!photoKeys.has(key)) {
        orphanedKeys.push({ key, value: categories[key] });
      }
    });

    // 分类统计
    const byCategory = {
      correct: photos.filter(p => p.category === 'correct'),
      medium: photos.filter(p => p.category === 'medium'),
      wrong: photos.filter(p => p.category === 'wrong'),
      uncategorized: photos.filter(p => !p.category),
    };

    // 输出报告
    console.log('\n📊 数据一致性检查');
    console.log(`  ✅ 总照片数: ${photos.length}`);
    console.log(`  ✅ photos 中有 category 的: ${photosWithCategory.length}`);
    console.log(`  ✅ categories 映射数: ${Object.keys(categories).length}`);
    console.log(`  ${orphanedKeys.length === 0 ? '✅' : '⚠️'} 孤立 keys: ${orphanedKeys.length}`);

    if (orphanedKeys.length > 0) {
      console.warn('⚠️ 发现孤立的 keys:');
      console.table(orphanedKeys.slice(0, 10));
    }

    console.log('\n📈 分类统计');
    console.log(`  ✓ 正确: ${byCategory.correct.length} 张`);
    console.log(`  ~ 适中: ${byCategory.medium.length} 张`);
    console.log(`  ✕ 错误: ${byCategory.wrong.length} 张`);
    console.log(`  ○ 未标记: ${byCategory.uncategorized.length} 张`);

    console.groupEnd();

    return {
      summary: {
        totalPhotos: photos.length,
        photosWithCategory: photosWithCategory.length,
        categoriesCount: Object.keys(categories).length,
        correct: byCategory.correct.length,
        medium: byCategory.medium.length,
        wrong: byCategory.wrong.length,
        uncategorized: byCategory.uncategorized.length,
        orphanedKeysCount: orphanedKeys.length,
        oldFormatKeysCount: oldFormatKeys.length,
        newFormatKeysCount: newFormatKeys.length,
      },
      orphanedKeys,
      oldFormatKeys,
      newFormatKeys,
    };
  },
}));

export default usePhotoStore;
