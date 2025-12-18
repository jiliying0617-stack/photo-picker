/**
 * IndexedDB utilities for storing photo data persistently
 * Stores binary image data and metadata
 */

const DB_NAME = 'PhotoPickerDB';
const DB_VERSION = 1;
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
      }
    };
  });
}

// Save a single photo to IndexedDB
export async function savePhotoToDB(photo) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Convert File to ArrayBuffer for storage
    const reader = new FileReader();
    reader.onload = async () => {
      const photoData = {
        id: photo.id,
        name: photo.name,
        path: photo.path,
        category: photo.category,
        size: photo.size,
        lastModified: photo.lastModified,
        imageData: reader.result, // ArrayBuffer
      };

      const request = store.put(photoData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(photo.file);
  });
}

// Save multiple photos in batch
export async function savePhotosToDB(photos, onProgress) {
  const total = photos.length;
  let saved = 0;

  for (const photo of photos) {
    await savePhotoToDB(photo);
    saved++;
    if (onProgress) {
      onProgress({ current: saved, total });
    }
  }
}

// Load all photos from IndexedDB
export async function loadPhotosFromDB() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const photosData = request.result;

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

      resolve(photos);
    };

    request.onerror = () => reject(request.error);
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

// Clear all photos
export async function clearPhotosDB() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
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
