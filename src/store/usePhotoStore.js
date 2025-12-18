import { create } from 'zustand';
import { getUserStorageKey } from '../utils/userIdentity';

// 从 localStorage 加载列数配置
function loadColumns() {
  try {
    const columnsKey = getUserStorageKey('columns');
    const savedColumns = localStorage.getItem(columnsKey);
    return savedColumns ? parseInt(savedColumns) : 3;
  } catch (error) {
    console.error('加载列数失败:', error);
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
    console.error('加载分类标记失败:', error);
    return {};
  }
}

// 保存分类标记到 localStorage
function saveCategories(categories) {
  try {
    const categoriesKey = getUserStorageKey('categories');
    localStorage.setItem(categoriesKey, JSON.stringify(categories));
  } catch (error) {
    console.error('保存分类标记失败:', error);
  }
}

const usePhotoStore = create((set, get) => ({
  // State
  photos: [],
  columns: loadColumns(),
  selectedPhotoId: null,
  categories: loadCategories(), // { path: category }

  // Actions
  setPhotos: (photos) => {
    // 恢复之前的分类标记
    const categories = get().categories;
    const photosWithCategories = photos.map(photo => ({
      ...photo,
      category: categories[photo.path] || photo.category || null
    }));
    set({ photos: photosWithCategories });
    console.log(`✓ 加载了 ${photos.length} 张图片,恢复了 ${Object.keys(categories).length} 个分类标记`);
  },

  addPhotos: (newPhotos) => {
    const categories = get().categories;
    const photosWithCategories = newPhotos.map(photo => ({
      ...photo,
      category: categories[photo.path] || photo.category || null
    }));
    const updatedPhotos = [...get().photos, ...photosWithCategories];
    set({ photos: updatedPhotos });
  },

  setCategory: (photoId, category) => {
    const photos = get().photos;
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    // 更新图片分类
    const updatedPhotos = photos.map(p =>
      p.id === photoId ? { ...p, category } : p
    );
    set({ photos: updatedPhotos });

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

  setColumns: (columns) => {
    set({ columns });
    const storageKey = getUserStorageKey('columns');
    localStorage.setItem(storageKey, columns.toString());
  },

  setSelectedPhotoId: (photoId) => set({ selectedPhotoId: photoId }),

  clearPhotos: () => {
    set({ photos: [], selectedPhotoId: null });
    console.log('✓ 清空图片列表 (分类标记已保留)');
  },

  clearCategories: () => {
    set({ categories: {} });
    const categoriesKey = getUserStorageKey('categories');
    localStorage.removeItem(categoriesKey);
    console.log('✓ 清空所有分类标记');
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
