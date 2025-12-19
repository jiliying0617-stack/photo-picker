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

// 清理文件名/文件夹名，移除不允许的字符
function sanitizeName(name, keepSpecialChars = true) {
  if (!name) return 'unnamed';

  // 移除或替换文件系统不允许的字符
  // Windows: < > : " / \ | ? *
  // macOS/Linux: / (null)
  let cleaned = name
    .replace(/[<>:"|?*]/g, '_')  // 替换为下划线
    .replace(/\//g, '-')          // 斜杠替换为横杠
    .replace(/\\/g, '-')          // 反斜杠替换为横杠
    .replace(/\x00/g, '')         // 移除 null 字符
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
    .trim();

  // 如果不保留特殊字符，进一步清理
  if (!keepSpecialChars) {
    // 保留中文、英文、数字、基本标点和空格
    cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s._\-()[\]{}!@#$%^&+=~`',；。，、！？—…（）【】]/g, '_');
  }

  // 确保文件名不以点开头（避免隐藏文件）
  cleaned = cleaned.replace(/^\.+/, '');

  // 限制长度（大多数文件系统限制为255字节）
  if (cleaned.length > 200) {
    const ext = cleaned.match(/\.[^.]+$/)?.[0] || '';
    const nameWithoutExt = cleaned.slice(0, -ext.length);
    cleaned = nameWithoutExt.slice(0, 200 - ext.length) + ext;
  }

  return cleaned || 'unnamed';
}

// Export photos to folder with original folder structure preserved
export async function exportPhotos(photos, selectedCategories, onProgress, options = {}) {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported. Please use Chrome or Edge.');
  }

  // 默认选项
  const {
    keepOriginalNames = true,  // 保留原文件名（只清理非法字符）
    keepFolderStructure = true // 保留文件夹结构
  } = options;

  try {
    // Open folder picker for export destination
    const targetDir = await window.showDirectoryPicker({
      mode: 'readwrite'
    });

    // Create category subfolders (使用英文名避免兼容性问题)
    const categoryDirs = {};
    const categoryNames = {
      correct: '正确_Correct',
      medium: '适中_Medium',
      wrong: '错误_Wrong',
      uncategorized: '未标记_Uncategorized'
    };

    if (selectedCategories.correct) {
      categoryDirs.correct = await targetDir.getDirectoryHandle(categoryNames.correct, { create: true });
    }
    if (selectedCategories.medium) {
      categoryDirs.medium = await targetDir.getDirectoryHandle(categoryNames.medium, { create: true });
    }
    if (selectedCategories.wrong) {
      categoryDirs.wrong = await targetDir.getDirectoryHandle(categoryNames.wrong, { create: true });
    }
    if (selectedCategories.uncategorized) {
      categoryDirs.uncategorized = await targetDir.getDirectoryHandle(categoryNames.uncategorized, { create: true });
    }

    let exported = 0;
    const errors = [];

    for (const photo of photos) {
      try {
        // Select target directory based on category
        const categoryKey = photo.category || 'uncategorized';
        const categoryDir = categoryDirs[categoryKey];
        if (!categoryDir) continue;

        let currentDir = categoryDir;

        // 如果保留文件夹结构
        if (keepFolderStructure) {
          // 解析原文件路径，保持文件夹结构
          const pathParts = photo.path.split('/');
          pathParts.pop(); // 移除文件名

          // 在分类文件夹下重建原文件夹结构
          for (const folderName of pathParts) {
            if (!folderName) continue;
            const sanitizedFolderName = sanitizeName(folderName, keepOriginalNames);
            currentDir = await currentDir.getDirectoryHandle(sanitizedFolderName, { create: true });
          }
        }

        // 确保文件对象存在
        if (!photo.file) {
          console.warn(`跳过没有文件对象的图片: ${photo.name}`);
          errors.push({ file: photo.name, error: '文件对象不存在' });
          continue;
        }

        // Read file content
        const arrayBuffer = await photo.file.arrayBuffer();

        // Write to target folder
        const sanitizedFileName = sanitizeName(photo.name, keepOriginalNames);

        // 检查文件是否已存在，如果存在则添加数字后缀
        let finalFileName = sanitizedFileName;
        let counter = 1;
        while (true) {
          try {
            const existingFile = await currentDir.getFileHandle(finalFileName);
            // 文件存在，添加数字后缀
            const ext = sanitizedFileName.match(/\.[^.]+$/)?.[0] || '';
            const nameWithoutExt = sanitizedFileName.slice(0, -ext.length);
            finalFileName = `${nameWithoutExt}_${counter}${ext}`;
            counter++;
          } catch {
            // 文件不存在，可以使用这个文件名
            break;
          }
        }

        const newFileHandle = await currentDir.getFileHandle(finalFileName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(arrayBuffer);
        await writable.close();

        exported++;
        if (onProgress) {
          onProgress({ current: exported, total: photos.length });
        }
      } catch (fileError) {
        console.error(`导出文件失败: ${photo.name}`, fileError);
        errors.push({ file: photo.name, error: fileError.message });
        // 继续处理其他文件
      }
    }

    return {
      exported,
      total: photos.length,
      folderName: targetDir.name,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { exported: 0, total: 0, folderName: null, cancelled: true };
    }
    throw error;
  }
}
