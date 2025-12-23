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

// 从 localStorage 加载分类标记
function loadCategories() {
  try {
    const categoriesKey = getUserStorageKey('categories');
    const savedCategories = localStorage.getItem(categoriesKey);
    return savedCategories ? JSON.parse(savedCategories) : {};
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
    // 恢复之前的分类标记并预计算文件夹路径（性能优化）
    const categories = get().categories;
    const photosWithCategories = photos.map(photo => ({
      ...photo,
      category: categories[photo.path] || photo.category || null,
      folder: getFolderPath(photo.path), // 预计算文件夹路径，避免重复 split/join
    }));

    // 构建文件夹映射
    const folderMap = buildFolderMap(photosWithCategories);

    set({ photos: photosWithCategories, folderMap });
    devLog(`✓ 加载了 ${photos.length} 张图片,恢复了 ${Object.keys(categories).length} 个分类标记`);
  },

  addPhotos: (newPhotos) => {
    const categories = get().categories;
    const photosWithCategories = newPhotos.map(photo => ({
      ...photo,
      category: categories[photo.path] || photo.category || null,
      folder: getFolderPath(photo.path), // 预计算文件夹路径
    }));
    const updatedPhotos = [...get().photos, ...photosWithCategories];

    // 重建文件夹映射
    const folderMap = buildFolderMap(updatedPhotos);

    set({ photos: updatedPhotos, folderMap });
  },

  setCategory: (photoId, category) => {
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

    // 更新分类标记映射
    const categories = { ...get().categories };
    if (category) {
      categories[photo.path] = category;
    } else {
      delete categories[photo.path];
    }
    set({ categories });

    // 保存到 localStorage
    saveCategories(categories);
  },

  // 批量设置分类 - 性能优化版本 O(n) 而不是 O(n²)
  setCategoryBatch: (photoIds, category) => {
    if (!photoIds || photoIds.length === 0) return;

    const photoIdSet = new Set(photoIds); // O(1) 查找
    const photos = get().photos;
    const folderMap = get().folderMap;
    const categories = { ...get().categories };

    // 单次遍历更新所有图片 - O(n)
    const updatedPhotos = photos.map(p => {
      if (photoIdSet.has(p.id)) {
        // 更新分类标记映射
        if (category) {
          categories[p.path] = category;
        } else {
          delete categories[p.path];
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
    set({ categories: {} });
    const categoriesKey = getUserStorageKey('categories');
    localStorage.removeItem(categoriesKey);
    devLog('✓ 清空所有分类标记');
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
