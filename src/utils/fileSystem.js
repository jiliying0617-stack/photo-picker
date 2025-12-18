/**
 * File System Access API utilities
 * Chrome/Edge only - for folder import/export
 */

// Check if browser supports File System Access API
export function isFileSystemAccessSupported() {
  return 'showDirectoryPicker' in window;
}

// Check if file is an image
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.tiff', '.tif', '.svg', '.ico',
  '.raw', '.cr2', '.nef', '.arw', '.dng', // RAW formats
];

export function isImageFile(filename) {
  const ext = filename.toLowerCase().match(/\.[^/.]+$/);
  return ext && IMAGE_EXTENSIONS.includes(ext[0]);
}

// Import folder - returns array of photo objects
export async function importFolder(onProgress) {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported. Please use Chrome or Edge.');
  }

  try {
    // Open folder picker
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    });

    const photos = [];
    let processedCount = 0;

    // Recursively read files
    async function processDirectory(directoryHandle, path = '') {
      for await (const entry of directoryHandle.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name;

        if (entry.kind === 'file' && isImageFile(entry.name)) {
          const file = await entry.getFile();

          photos.push({
            id: crypto.randomUUID(),
            name: entry.name,
            path: entryPath,
            file: file,
            fileHandle: entry,
            thumbnailUrl: URL.createObjectURL(file),
            category: null,
            size: file.size,
            lastModified: file.lastModified,
          });

          processedCount++;
          if (onProgress) {
            onProgress({ current: processedCount, total: processedCount });
          }
        } else if (entry.kind === 'directory') {
          // Recursively process subdirectories
          await processDirectory(entry, entryPath);
        }
      }
    }

    await processDirectory(dirHandle);

    return {
      photos,
      folderName: dirHandle.name
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled the picker
      return { photos: [], folderName: null };
    }
    throw error;
  }
}

// Export photos to folder
export async function exportPhotos(photos, onProgress) {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported. Please use Chrome or Edge.');
  }

  try {
    // Open folder picker for export destination
    const targetDir = await window.showDirectoryPicker({
      mode: 'readwrite'
    });

    // Create subfolders
    const correctDir = await targetDir.getDirectoryHandle('正确', { create: true });
    const mediumDir = await targetDir.getDirectoryHandle('适中', { create: true });
    const wrongDir = await targetDir.getDirectoryHandle('错误', { create: true });

    const categorized = photos.filter(p => p.category);
    let exported = 0;

    for (const photo of categorized) {
      // Select target directory based on category
      let targetSubDir;
      if (photo.category === 'correct') targetSubDir = correctDir;
      else if (photo.category === 'medium') targetSubDir = mediumDir;
      else if (photo.category === 'wrong') targetSubDir = wrongDir;

      if (!targetSubDir) continue;

      // Read file content
      const arrayBuffer = await photo.file.arrayBuffer();

      // Write to target folder (preserve original filename)
      const newFileHandle = await targetSubDir.getFileHandle(photo.name, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(arrayBuffer);
      await writable.close();

      exported++;
      if (onProgress) {
        onProgress({ current: exported, total: categorized.length });
      }
    }

    return {
      exported,
      total: categorized.length,
      folderName: targetDir.name
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { exported: 0, total: 0, folderName: null };
    }
    throw error;
  }
}
