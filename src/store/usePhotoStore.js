import { create } from 'zustand';
import { getUserStorageKey } from '../utils/userIdentity';
import {
  loadPhotosFromDB,
  savePhotosToDB,
  updatePhotoCategoryInDB,
  clearPhotosDB
} from '../utils/indexedDB';

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

const usePhotoStore = create((set, get) => ({
  // State - 初始为空,等待从 IndexedDB 加载
  photos: [],
  columns: loadColumns(),
  selectedPhotoId: null,
  isLoading: true, // 加载状态

  // 从 IndexedDB 加载图片
  loadPhotos: async () => {
    try {
      set({ isLoading: true });
      const photos = await loadPhotosFromDB();
      set({ photos, isLoading: false });
      console.log(`✓ 从 IndexedDB 加载了 ${photos.length} 张图片`);
    } catch (error) {
      console.error('从 IndexedDB 加载图片失败:', error);
      set({ photos: [], isLoading: false });
    }
  },

  // Actions
  setPhotos: async (photos) => {
    set({ photos });
    // 异步保存到 IndexedDB (不阻塞 UI)
    try {
      await savePhotosToDB(photos);
      console.log(`✓ 保存了 ${photos.length} 张图片到 IndexedDB`);
    } catch (error) {
      console.error('保存图片到 IndexedDB 失败:', error);
    }
  },

  addPhotos: async (newPhotos) => {
    const updatedPhotos = [...get().photos, ...newPhotos];
    set({ photos: updatedPhotos });
    // 异步保存
    try {
      await savePhotosToDB(newPhotos);
    } catch (error) {
      console.error('保存新图片失败:', error);
    }
  },

  setCategory: async (photoId, category) => {
    const updatedPhotos = get().photos.map(p =>
      p.id === photoId ? { ...p, category } : p
    );
    set({ photos: updatedPhotos });
    // 异步更新 IndexedDB
    try {
      await updatePhotoCategoryInDB(photoId, category);
    } catch (error) {
      console.error('更新分类失败:', error);
    }
  },

  setColumns: (columns) => {
    set({ columns });
    const storageKey = getUserStorageKey('columns');
    localStorage.setItem(storageKey, columns.toString());
  },

  setSelectedPhotoId: (photoId) => set({ selectedPhotoId: photoId }),

  clearPhotos: async () => {
    set({ photos: [], selectedPhotoId: null });
    try {
      await clearPhotosDB();
      console.log('✓ 清空 IndexedDB');
    } catch (error) {
      console.error('清空 IndexedDB 失败:', error);
    }
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
