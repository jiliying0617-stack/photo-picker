/**
 * IndexedDB utilities for storing photo data persistently
 * Stores binary image data and metadata
 * Supports multi-user data isolation using browser fingerprinting
 */

import { getUserId } from './userIdentity';

const DB_NAME = 'PhotoPickerDB';
const DB_VERSION = 2; // 升级版本以支持新的索引
const STORE_NAME = 'photos';

// Open or create database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('path', 'path', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('userId', 'userId', { unique: false }); // 新增用户索引
      } else {
        // 如果已存在，检查是否需要添加 userId 索引
        const transaction = event.target.transaction;
        const store = transaction.objectStore(STORE_NAME);
        if (!store.indexNames.contains('userId')) {
          store.createIndex('userId', 'userId', { unique: false });
        }
      }
    };
  });
}

// Save a single photo to IndexedDB
export async function savePhotoToDB(photo) {
  // 检查 file 是否存在
  if (!photo.file) {
    console.warn(`Photo ${photo.name} has no file object, skipping save`);
    return Promise.resolve();
  }

  // 先读取 File 为 ArrayBuffer
  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(photo.file);
  });

  // 然后在新的事务中保存
  const db = await openDB();
  const userId = getUserId(); // 获取当前用户 ID

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const photoData = {
      id: photo.id,
      userId: userId, // 添加用户 ID
      name: photo.name,
      path: photo.path,
      category: photo.category,
      size: photo.size,
      lastModified: photo.lastModified,
      imageData: arrayBuffer,
    };

    const request = store.put(photoData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save multiple photos in batch with memory optimization
export async function savePhotosToDB(photos, onProgress) {
  const total = photos.length;
  let saved = 0;
  let skipped = 0;
  const BATCH_SIZE = 50; // 每批保存50张图片

  console.log(`[IndexedDB] 开始保存 ${total} 张图片...`);

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    if (photo.file) {
      try {
        await savePhotoToDB(photo);
        saved++;
      } catch (error) {
        console.error(`保存图片失败 [${i + 1}/${total}]:`, photo.name, error);
        skipped++;
      }
    } else {
      skipped++;
    }

    // 每处理 BATCH_SIZE 张图片后,暂停一下让浏览器释放内存
    if ((saved + skipped) % BATCH_SIZE === 0) {
      console.log(`[IndexedDB] 进度: ${saved + skipped}/${total} (${Math.round((saved + skipped) / total * 100)}%)`);
      // 使用 setTimeout 让浏览器有机会释放内存和渲染
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (onProgress) {
      onProgress({ current: saved + skipped, total });
    }
  }

  console.log(`[IndexedDB] 保存完成: ${saved} 张成功, ${skipped} 张跳过`);
  return { saved, skipped };
}

// Load all photos from IndexedDB (only current user's photos)
export async function loadPhotosFromDB() {
  const db = await openDB();
  const userId = getUserId(); // 获取当前用户 ID

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    // 检查是否存在 userId 索引 (向后兼容)
    let request;
    if (store.indexNames.contains('userId')) {
      // 新版本: 使用索引只读取当前用户数据
      const index = store.index('userId');
      request = index.getAll(userId);
    } else {
      // 旧版本: 读取所有数据 (兼容旧数据库)
      request = store.getAll();
      console.warn('[IndexedDB] 旧版本数据库，读取所有数据（无用户隔离）');
    }

    request.onsuccess = () => {
      let photosData = request.result;

      // 如果是旧版本数据，手动过滤当前用户数据
      if (!store.indexNames.contains('userId')) {
        photosData = photosData.filter(data => data.userId === userId || !data.userId);
      }

      console.log(`[IndexedDB] 用户 ${userId} 从数据库读取到 ${photosData.length} 条记录`);

      // Convert ArrayBuffer back to blob URL for display
      const photos = photosData.map(data => {
        const blob = new Blob([data.imageData], { type: 'image/*' });
        return {
          id: data.id,
          name: data.name,
          path: data.path,
          category: data.category,
          size: data.size,
          lastModified: data.lastModified,
          thumbnailUrl: URL.createObjectURL(blob),
          file: new File([data.imageData], data.name, {
            type: 'image/*',
            lastModified: data.lastModified
          }),
        };
      });

      console.log(`[IndexedDB] 成功转换 ${photos.length} 张图片`);
      resolve(photos);
    };

    request.onerror = () => {
      console.error('[IndexedDB] 读取失败:', request.error);
      reject(request.error);
    };
  });
}

// Update photo category
export async function updatePhotoCategoryInDB(photoId, category) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(photoId);

    request.onsuccess = () => {
      const photo = request.result;
      if (photo) {
        photo.category = category;
        const updateRequest = store.put(photo);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve(); // Photo not found, ignore
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// Clear all photos (only current user's photos)
export async function clearPhotosDB() {
  const db = await openDB();
  const userId = getUserId(); // 获取当前用户 ID

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 检查是否存在 userId 索引 (向后兼容)
    let request;
    if (store.indexNames.contains('userId')) {
      // 新版本: 使用索引游标删除
      const index = store.index('userId');
      request = index.openCursor(userId);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete(); // 删除当前记录
          cursor.continue(); // 继续下一条
        } else {
          console.log(`[IndexedDB] 已清除用户 ${userId} 的所有数据`);
          resolve(); // 全部删除完成
        }
      };
    } else {
      // 旧版本: 清空所有数据
      request = store.clear();
      request.onsuccess = () => {
        console.log(`[IndexedDB] 已清空所有数据（旧版本数据库）`);
        resolve();
      };
    }

    request.onerror = () => reject(request.error);
  });
}

// Get database size (for display)
export async function getDBSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / 1024 / 1024).toFixed(2),
      quotaInMB: (estimate.quota / 1024 / 1024).toFixed(2),
    };
  }
  return null;
}
