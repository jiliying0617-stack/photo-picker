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

    // 🧹 Linus 风格：自动清理孤立的 category keys (防止 localStorage 膨胀)
    const validKeys = new Set();
    photosWithCategories.forEach(photo => {
      const photoKey = getPhotoKey(photo);
      if (photo.category) {
        validKeys.add(photoKey);
      }
    });

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
      set({ categories: cleanedCategories });
      saveCategories(cleanedCategories);
    }

    // 构建文件夹映射
    const folderMap = buildFolderMap(photosWithCategories);

    set({ photos: photosWithCategories, folderMap });
    devLog(`✓ 加载了 ${uniquePhotos.length} 张图片（原始: ${photos.length}）,恢复了 ${Object.keys(cleanedCategories).length} 个分类标记`);
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

  // 🔍 Linus 风格深度诊断：找出所有数据不一致问题
  diagnose: () => {
    const photos = get().photos;
    const categories = get().categories;

    console.group('🔍 Linus 深度诊断报告');

    // 🚨 检查 localStorage 中的原始数据
    console.group('📦 localStorage 原始数据');
    const categoriesKey = getUserStorageKey('categories');
    const rawData = localStorage.getItem(categoriesKey);
    console.log('Raw JSON:', rawData);
    const parsedCategories = rawData ? JSON.parse(rawData) : {};
    console.log('Parsed categories:', parsedCategories);
    console.log('Categories keys count:', Object.keys(parsedCategories).length);

    // 检查 key 格式
    const oldFormatKeys = [];
    const newFormatKeys = [];
    Object.keys(parsedCategories).forEach(key => {
      if (key.includes('|')) {
        newFormatKeys.push({ key, value: parsedCategories[key] });
      } else {
        oldFormatKeys.push({ key, value: parsedCategories[key] });
      }
    });

    if (oldFormatKeys.length > 0) {
      console.warn('⚠️ 发现旧格式 key (path only):', oldFormatKeys.length);
      console.table(oldFormatKeys.slice(0, 10));
    }
    if (newFormatKeys.length > 0) {
      console.log('✅ 新格式 key (path|size|modified):', newFormatKeys.length);
      console.table(newFormatKeys.slice(0, 5));
    }
    console.groupEnd();

    console.group('🔍 数据诊断报告');

    // 1. 检查重复 ID
    const idMap = new Map();
    const duplicateIds = [];
    photos.forEach(photo => {
      if (idMap.has(photo.id)) {
        duplicateIds.push({
          id: photo.id,
          paths: [idMap.get(photo.id), photo.path]
        });
      } else {
        idMap.set(photo.id, photo.path);
      }
    });

    // 2. 检查重复 path
    const pathMap = new Map();
    const duplicatePaths = [];
    photos.forEach(photo => {
      if (pathMap.has(photo.path)) {
        duplicatePaths.push({
          path: photo.path,
          ids: [pathMap.get(photo.path), photo.id]
        });
      } else {
        pathMap.set(photo.path, photo.id);
      }
    });

    // 3. 按分类分组
    const byCategory = {
      correct: [],
      medium: [],
      wrong: [],
      uncategorized: []
    };
    photos.forEach(photo => {
      const cat = photo.category || 'uncategorized';
      if (byCategory[cat]) {
        byCategory[cat].push({
          id: photo.id,
          path: photo.path,
          name: photo.name,
          size: photo.size,
          lastModified: photo.lastModified
        });
      }
    });

    // 4. 检查 photos 和 categories 映射的匹配情况
    console.log('\n🔗 Photos vs Categories 匹配检查');
    const photosWithCategory = photos.filter(p => p.category);
    console.log(`  photos 中有 category 的: ${photosWithCategory.length}`);
    console.log(`  categories 映射中的 keys: ${Object.keys(categories).length}`);

    // 检查不匹配
    const mismatch = [];
    photosWithCategory.forEach(photo => {
      const photoKey = getPhotoKey(photo);
      if (!categories[photoKey]) {
        mismatch.push({
          id: photo.id,
          name: photo.name,
          category: photo.category,
          path: photo.path,
          photoKey,
          reason: 'photo 有 category 但 categories 中没有这个 key'
        });
      } else if (categories[photoKey] !== photo.category) {
        mismatch.push({
          id: photo.id,
          name: photo.name,
          photoCategory: photo.category,
          mappingCategory: categories[photoKey],
          photoKey,
          reason: 'photo.category 和 categories[key] 不一致'
        });
      }
    });

    if (mismatch.length > 0) {
      console.warn('⚠️ 发现数据不一致:', mismatch.length);
      console.table(mismatch);
    }

    // 检查孤立的 category keys（在 categories 中有但在 photos 中找不到）
    const orphanedKeys = [];
    Object.keys(categories).forEach(key => {
      const found = photos.some(photo => getPhotoKey(photo) === key);
      if (!found) {
        orphanedKeys.push({ key, value: categories[key] });
      }
    });

    if (orphanedKeys.length > 0) {
      console.warn('⚠️ 孤立的 category keys (在 categories 中但照片已删除):', orphanedKeys.length);
      console.table(orphanedKeys.slice(0, 10));
    }

    // 4. 输出报告
    console.log('\n📊 总览');
    console.log(`  总照片数: ${photos.length}`);
    console.log(`  photos 中有 category 的: ${photosWithCategory.length}`);
    console.log(`  categories 映射数: ${Object.keys(categories).length}`);
    console.log(`  不匹配项: ${mismatch.length}`);
    console.log(`  孤立 keys: ${orphanedKeys.length}`);

    console.log('\n📈 分类统计');
    console.log(`  ✓ 正确: ${byCategory.correct.length} 张`);
    console.log(`  ~ 适中: ${byCategory.medium.length} 张`);
    console.log(`  ✕ 错误: ${byCategory.wrong.length} 张`);
    console.log(`  ○ 未标记: ${byCategory.uncategorized.length} 张`);

    if (duplicateIds.length > 0) {
      console.log('\n⚠️ 重复的照片 ID:');
      console.table(duplicateIds);
    }

    if (duplicatePaths.length > 0) {
      console.log('\n⚠️ 重复的照片路径:');
      console.table(duplicatePaths);
    }

    console.log('\n📋 "正确" 分类的照片列表:');
    console.table(byCategory.correct);

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
        mismatchCount: mismatch.length,
        orphanedKeysCount: orphanedKeys.length,
        oldFormatKeysCount: oldFormatKeys.length,
        newFormatKeysCount: newFormatKeys.length,
      },
      duplicateIds,
      duplicatePaths,
      mismatch,
      orphanedKeys,
      oldFormatKeys,
      newFormatKeys,
      correctPhotos: byCategory.correct
    };
  },
}));

export default usePhotoStore;
