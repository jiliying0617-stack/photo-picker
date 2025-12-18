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

// Import folder from drag & drop
export async function importFolderFromDrop(dataTransfer, onProgress) {
  const photos = [];
  let processedCount = 0;

  try {
    // 处理拖放的文件/文件夹
    for (const item of dataTransfer.items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isDirectory) {
            await processDirectoryEntry(entry, '', photos, onProgress, processedCount);
          } else if (entry.isFile) {
            const file = await getFileFromEntry(entry);
            if (file && isImageFile(file.name)) {
              photos.push({
                id: crypto.randomUUID(),
                name: file.name,
                path: file.name,
                file: file,
                fileHandle: null,
                thumbnailUrl: null,
                category: null,
                size: file.size,
                lastModified: file.lastModified,
              });
              processedCount++;
              if (onProgress) {
                onProgress({ current: processedCount, total: processedCount });
              }
            }
          }
        }
      }
    }

    return {
      photos,
      folderName: photos.length > 0 ? '拖放导入' : null
    };
  } catch (error) {
    console.error('拖放导入失败:', error);
    throw error;
  }
}

// 辅助函数：从 FileSystemEntry 获取 File 对象
function getFileFromEntry(entry) {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

// 辅助函数：递归处理目录
async function processDirectoryEntry(directoryEntry, path, photos, onProgress, processedCount) {
  const reader = directoryEntry.createReader();

  // 读取目录中的所有条目
  const entries = await new Promise((resolve, reject) => {
    const allEntries = [];

    function readEntries() {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve(allEntries);
        } else {
          allEntries.push(...entries);
          readEntries();
        }
      }, reject);
    }

    readEntries();
  });

  for (const entry of entries) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.isFile) {
      const file = await getFileFromEntry(entry);
      if (file && isImageFile(file.name)) {
        photos.push({
          id: crypto.randomUUID(),
          name: file.name,
          path: entryPath,
          file: file,
          fileHandle: null,
          thumbnailUrl: null,
          category: null,
          size: file.size,
          lastModified: file.lastModified,
        });

        processedCount++;
        if (onProgress) {
          onProgress({ current: processedCount, total: processedCount });
        }

        // 每 50 张图片暂停一下
        if (processedCount % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }
    } else if (entry.isDirectory) {
      await processDirectoryEntry(entry, entryPath, photos, onProgress, processedCount);
    }
  }
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
          // 关键优化: 延迟加载 - 只存储句柄,不读取文件
          // 先获取文件元数据(轻量级操作)
          const file = await entry.getFile();

          photos.push({
            id: crypto.randomUUID(),
            name: entry.name,
            path: entryPath,
            file: file, // File 对象 (需要供 IndexedDB 读取)
            fileHandle: entry, // FileHandle (备用)
            thumbnailUrl: null, // 延迟创建 (节省内存)
            category: null,
            size: file.size,
            lastModified: file.lastModified,
          });

          processedCount++;
          if (onProgress) {
            onProgress({ current: processedCount, total: processedCount });
          }

          // 每 50 张图片暂停一下,避免阻塞 UI
          if (processedCount % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 5));
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

// Export photos to folder with original folder structure preserved
export async function exportPhotos(photos, selectedCategories, onProgress) {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported. Please use Chrome or Edge.');
  }

  try {
    // Open folder picker for export destination
    const targetDir = await window.showDirectoryPicker({
      mode: 'readwrite'
    });

    // Create category subfolders
    const categoryDirs = {};
    if (selectedCategories.correct) {
      categoryDirs.correct = await targetDir.getDirectoryHandle('正确', { create: true });
    }
    if (selectedCategories.medium) {
      categoryDirs.medium = await targetDir.getDirectoryHandle('适中', { create: true });
    }
    if (selectedCategories.wrong) {
      categoryDirs.wrong = await targetDir.getDirectoryHandle('错误', { create: true });
    }
    if (selectedCategories.uncategorized) {
      categoryDirs.uncategorized = await targetDir.getDirectoryHandle('未打标', { create: true });
    }

    let exported = 0;

    for (const photo of photos) {
      // Select target directory based on category
      const categoryKey = photo.category || 'uncategorized';
      const categoryDir = categoryDirs[categoryKey];
      if (!categoryDir) continue;

      // 解析原文件路径,保持文件夹结构
      const pathParts = photo.path.split('/');
      pathParts.pop(); // 移除文件名

      // 在分类文件夹下重建原文件夹结构
      let currentDir = categoryDir;
      for (const folderName of pathParts) {
        currentDir = await currentDir.getDirectoryHandle(folderName, { create: true });
      }

      // Read file content
      const arrayBuffer = await photo.file.arrayBuffer();

      // Write to target folder (preserve original filename)
      const newFileHandle = await currentDir.getFileHandle(photo.name, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(arrayBuffer);
      await writable.close();

      exported++;
      if (onProgress) {
        onProgress({ current: exported, total: photos.length });
      }
    }

    return {
      exported,
      total: photos.length,
      folderName: targetDir.name
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { exported: 0, total: 0, folderName: null };
    }
    throw error;
  }
}
