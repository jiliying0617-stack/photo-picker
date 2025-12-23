import { create } from 'zustand';
import { getUserStorageKey } from '../utils/userIdentity';
import { devLog, devError } from '../utils/devLog';
import { debounce, runWhenIdle } from '../utils/debounce';

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

    // 🔍 诊断：验证并清理无效的分类值
    const invalidEntries = [];
    const cleanedCategories = {};

    Object.entries(categories).forEach(([path, category]) => {
      if (isValidCategory(category)) {
        cleanedCategories[path] = category;
      } else {
        invalidEntries.push({ path, category });
      }
    });

    if (invalidEntries.length > 0) {
      devError(`⚠️ 发现并移除了 ${invalidEntries.length} 个无效的分类标记:`, invalidEntries.slice(0, 5));
      // 保存清理后的数据
      localStorage.setItem(categoriesKey, JSON.stringify(cleanedCategories));
    }

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
}, 1000); // 1秒防抖，避免频繁写入

// 提取文件夹路径的辅助函数
function getFolderPath(photoPath) {
  const parts = photoPath.split('/');
  parts.pop(); // 移除文件名
  return parts.join('/');
}

// 生成照片的唯一标识符（用于分类标记）
// 使用 path + size + lastModified 来唯一标识一张照片
// 这样可以避免不同文件夹中的同名文件共享分类
function getPhotoKey(photo) {
  return `${photo.path}|${photo.size}|${photo.lastModified}`;
}

// 构建文件夹映射表 (使用预计算的 photo.folder)
function buildFolderMap(photos) {
  const folderMap = {};
  photos.forEach(photo => {
    const folder = photo.folder; // 使用预计算的文件夹路径
    if (!folderMap[folder]) {
      folderMap[folder] = [];
    }
    folderMap[folder].push(photo);
  });
  return folderMap;
}

const usePhotoStore = create((set, get) => ({
  // State
  photos: [],
  folderMap: {}, // { '/folder/path': [photo1, photo2] }
  columns: loadColumns(),
  selectedPhotoId: null,
  categories: loadCategories(), // { path: category }
  groupBrowseMode: false, // 检索组模式

  // Actions
  setPhotos: (photos) => {
    // 🔍 诊断：检查并去除重复照片（基于 path）
    const seenPaths = new Map();
    const uniquePhotos = [];
    const duplicatePaths = [];

    photos.forEach(photo => {
      if (seenPaths.has(photo.path)) {
        duplicatePaths.push(photo.path);
        // 保留第一次出现的照片，跳过重复的
        return;
      }
      seenPaths.set(photo.path, true);
      uniquePhotos.push(photo);
    });

    if (duplicatePaths.length > 0) {
      devError(`⚠️ 发现并移除了 ${duplicatePaths.length} 张重复照片:`, duplicatePaths.slice(0, 5));
    }

    // 恢复之前的分类标记并预计算文件夹路径（性能优化）
    const categories = get().categories;
    const photosWithCategories = uniquePhotos.map(photo => {
      const photoKey = getPhotoKey(photo);
      return {
        ...photo,
        category: categories[photoKey] || photo.category || null,
        folder: getFolderPath(photo.path), // 预计算文件夹路径，避免重复 split/join
      };
    });

    // 构建文件夹映射
    const folderMap = buildFolderMap(photosWithCategories);

    set({ photos: photosWithCategories, folderMap });
    devLog(`✓ 加载了 ${uniquePhotos.length} 张图片（原始: ${photos.length}）,恢复了 ${Object.keys(categories).length} 个分类标记`);
  },

  addPhotos: (newPhotos) => {
    const categories = get().categories;
    const photosWithCategories = newPhotos.map(photo => {
      const photoKey = getPhotoKey(photo);
      return {
        ...photo,
        category: categories[photoKey] || photo.category || null,
        folder: getFolderPath(photo.path), // 预计算文件夹路径
      };
    });
    const updatedPhotos = [...get().photos, ...photosWithCategories];

    // 重建文件夹映射
    const folderMap = buildFolderMap(updatedPhotos);

    set({ photos: updatedPhotos, folderMap });
  },

  setCategory: (photoId, category) => {
    // 🔍 验证分类值
    if (category && !isValidCategory(category)) {
      devError(`⚠️ 无效的分类值: ${category}，已忽略`);
      return;
    }

    const photos = get().photos;
    const folderMap = get().folderMap;
    const photo = photos.find(p => p.id === photoId);
    if (!photo) {
      devError(`Photo not found: ${photoId}`);
      return;
    }

    // 更新图片分类
    const updatedPhotos = photos.map(p =>
      p.id === photoId ? { ...p, category } : p
    );

    // 增量更新 folderMap - 只更新受影响的文件夹
    const folder = photo.folder; // 使用预计算的文件夹路径
    const newFolderMap = { ...folderMap };
    if (newFolderMap[folder]) {
      newFolderMap[folder] = newFolderMap[folder].map(p =>
        p.id === photoId ? { ...p, category } : p
      );
    }

    set({ photos: updatedPhotos, folderMap: newFolderMap });

    // 更新分类标记映射（使用唯一 key）
    const categories = { ...get().categories };
    const photoKey = getPhotoKey(photo);
    if (category) {
      categories[photoKey] = category;
    } else {
      delete categories[photoKey];
    }
    set({ categories });

    // 保存到 localStorage
    saveCategories(categories);
  },

  // 批量设置分类 - 性能优化版本 O(n) 而不是 O(n²)
  setCategoryBatch: (photoIds, category) => {
    if (!photoIds || photoIds.length === 0) return;

    // 🔍 验证分类值
    if (category && !isValidCategory(category)) {
      devError(`⚠️ 无效的分类值: ${category}，已忽略`);
      return;
    }

    const photoIdSet = new Set(photoIds); // O(1) 查找
    const photos = get().photos;
    const folderMap = get().folderMap;
    const categories = { ...get().categories };

    // 单次遍历更新所有图片 - O(n)
    const updatedPhotos = photos.map(p => {
      if (photoIdSet.has(p.id)) {
        // 更新分类标记映射（使用唯一 key）
        const photoKey = getPhotoKey(p);
        if (category) {
          categories[photoKey] = category;
        } else {
          delete categories[photoKey];
        }
        return { ...p, category };
      }
      return p;
    });

    // 更新 folderMap
    const newFolderMap = {};
    Object.keys(folderMap).forEach(folder => {
      newFolderMap[folder] = folderMap[folder].map(p => {
        if (photoIdSet.has(p.id)) {
          return { ...p, category };
        }
        return p;
      });
    });

    set({ photos: updatedPhotos, folderMap: newFolderMap, categories });
    saveCategories(categories);

    devLog(`✓ 批量更新 ${photoIds.length} 张图片的分类`);
  },

  setColumns: (columns) => {
    set({ columns });
    const storageKey = getUserStorageKey('columns');
    localStorage.setItem(storageKey, columns.toString());
  },

  setSelectedPhotoId: (photoId) => set({ selectedPhotoId: photoId }),

  setGroupBrowseMode: (enabled) => set({ groupBrowseMode: enabled }),

  clearPhotos: () => {
    set({ photos: [], folderMap: {}, selectedPhotoId: null });
    devLog('✓ 清空图片列表 (分类标记已保留)');
  },

  clearCategories: () => {
    const photos = get().photos;
    const folderMap = get().folderMap;

    // 清空所有照片的分类字段
    const clearedPhotos = photos.map(p => ({ ...p, category: null }));

    // 更新 folderMap 中的照片分类
    const newFolderMap = {};
    Object.keys(folderMap).forEach(folder => {
      newFolderMap[folder] = folderMap[folder].map(p => ({ ...p, category: null }));
    });

    // 清空 categories 映射
    set({
      photos: clearedPhotos,
      folderMap: newFolderMap,
      categories: {}
    });

    // 清空 localStorage
    const categoriesKey = getUserStorageKey('categories');
    localStorage.removeItem(categoriesKey);

    devLog(`✓ 清空所有分类标记 (${photos.length} 张照片)`);
  },

  // Computed
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
}));

export default usePhotoStore;
