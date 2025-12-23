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
    // 注意: 浏览器 File System Access API 在所有平台（包括 Windows）上都使用 '/' 作为路径分隔符
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
        // 注意: 浏览器 File System Access API 在所有平台（包括 Windows）上都使用 '/' 作为路径分隔符
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
    // eslint-disable-next-line no-control-regex
    .replace(/\x00/g, '')         // 移除 null 字符
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
    .trim();

  // 如果不保留特殊字符，进一步清理
  if (!keepSpecialChars) {
    // 保留中文、英文、数字、基本标点和空格
    cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s._\-()[\]{}!@#$%^&+=~`',；。，、！？—…（）【】]/g, '_');
  }

  // 处理特殊的点开头情况（Linux 隐藏文件）
  // 只替换单独的 '.' 或 '..'，保留合法的隐藏文件名如 '.profile.jpg'
  if (cleaned === '.') cleaned = 'dot';
  else if (cleaned === '..') cleaned = 'dotdot';
  else if (cleaned.startsWith('.') && cleaned.length > 1) {
    // 保留以点开头的合法文件名（如 .config.jpg）
    // 但确保不是纯点号
    if (cleaned.replace(/\./g, '').length === 0) {
      cleaned = 'dots';
    }
  }

  // 限制长度（文件系统限制为 255 字节，而非字符数）
  // 使用 TextEncoder 来精确计算 UTF-8 字节数
  const encoder = new TextEncoder();
  let bytes = encoder.encode(cleaned);

  if (bytes.length > 255) {
    // 需要截断 - 保留扩展名
    const ext = cleaned.match(/\.[^.]+$/)?.[0] || '';
    const extBytes = encoder.encode(ext);
    const maxNameBytes = 255 - extBytes.length;

    // 逐字符截断直到字节数符合要求
    const nameWithoutExt = cleaned.slice(0, -ext.length || undefined);
    let truncated = nameWithoutExt;

    while (encoder.encode(truncated).length > maxNameBytes && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }

    cleaned = truncated + ext;
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
    const exportedByCategory = {
      correct: 0,
      medium: 0,
      wrong: 0,
      uncategorized: 0
    };

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
          // 注意: File System Access API 统一使用 '/' 作为分隔符（跨平台）
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
            // 尝试获取文件句柄，如果文件存在则不会抛出异常
            await currentDir.getFileHandle(finalFileName);
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
        // 统计每个分类的导出数量
        if (exportedByCategory[categoryKey] !== undefined) {
          exportedByCategory[categoryKey]++;
        }
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
      errors: errors.length > 0 ? errors : null,
      exportedByCategory // 新增：按分类的导出数量
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { exported: 0, total: 0, folderName: null, cancelled: true };
    }
    throw error;
  }
}
