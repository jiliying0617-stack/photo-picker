import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isFileSystemAccessSupported,
  isImageFile,
  importFolderFromDrop,
  importFolder,
} from './fileSystem';

describe('fileSystem', () => {
  describe('isFileSystemAccessSupported', () => {
    it('should return true when showDirectoryPicker is available', () => {
      global.window = { showDirectoryPicker: vi.fn() };

      expect(isFileSystemAccessSupported()).toBe(true);
    });

    it('should return false when showDirectoryPicker is not available', () => {
      global.window = {};

      expect(isFileSystemAccessSupported()).toBe(false);
    });
  });

  describe('isImageFile', () => {
    it('should identify common image files', () => {
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('photo.jpeg')).toBe(true);
      expect(isImageFile('photo.png')).toBe(true);
      expect(isImageFile('photo.gif')).toBe(true);
      expect(isImageFile('photo.webp')).toBe(true);
      expect(isImageFile('photo.bmp')).toBe(true);
    });

    it('should identify RAW image files', () => {
      expect(isImageFile('photo.raw')).toBe(true);
      expect(isImageFile('canon.cr2')).toBe(true);
      expect(isImageFile('nikon.nef')).toBe(true);
      expect(isImageFile('sony.arw')).toBe(true);
      expect(isImageFile('adobe.dng')).toBe(true);
    });

    it('should reject non-image files', () => {
      expect(isImageFile('document.pdf')).toBe(false);
      expect(isImageFile('video.mp4')).toBe(false);
      expect(isImageFile('document.docx')).toBe(false);
      expect(isImageFile('archive.zip')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isImageFile('PHOTO.JPG')).toBe(true);
      expect(isImageFile('Photo.PNG')).toBe(true);
      expect(isImageFile('IMAGE.CR2')).toBe(true);
    });

    it('should handle files without extension', () => {
      // When no extension is found, match returns null, and null && ... returns null (falsy)
      expect(isImageFile('noextension')).toBeFalsy();
      expect(isImageFile('')).toBeFalsy();
    });

    it('should handle special file names', () => {
      expect(isImageFile('.hidden.jpg')).toBe(true);
      expect(isImageFile('file.with.dots.png')).toBe(true);
      expect(isImageFile('file-with-dashes.jpg')).toBe(true);
    });
  });

  describe('importFolderFromDrop', () => {
    beforeEach(() => {
      // Mock crypto.randomUUID using vi.stubGlobal
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-123'),
      });
    });

    it('should import image files from drag and drop', async () => {
      const mockFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const mockEntry = {
        isFile: true,
        isDirectory: false,
        name: 'test.jpg',
        file: success => success(mockFile),
      };

      const mockDataTransfer = {
        items: [
          {
            kind: 'file',
            webkitGetAsEntry: () => mockEntry,
          },
        ],
      };

      const result = await importFolderFromDrop(mockDataTransfer);

      expect(result.photos).toHaveLength(1);
      expect(result.photos[0]).toMatchObject({
        id: 'test-uuid-123',
        name: 'test.jpg',
        path: 'test.jpg',
        category: null,
      });
      expect(result.folderName).toBe('拖放导入');
    });

    it('should filter out non-image files', async () => {
      const mockImageFile = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
      const mockTextFile = new File(['text'], 'document.txt', { type: 'text/plain' });

      const mockEntries = [
        {
          isFile: true,
          isDirectory: false,
          name: 'image.jpg',
          file: success => success(mockImageFile),
        },
        {
          isFile: true,
          isDirectory: false,
          name: 'document.txt',
          file: success => success(mockTextFile),
        },
      ];

      const mockDataTransfer = {
        items: mockEntries.map(entry => ({
          kind: 'file',
          webkitGetAsEntry: () => entry,
        })),
      };

      const result = await importFolderFromDrop(mockDataTransfer);

      expect(result.photos).toHaveLength(1);
      expect(result.photos[0].name).toBe('image.jpg');
    });

    it('should call onProgress callback', async () => {
      const mockFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const mockEntry = {
        isFile: true,
        isDirectory: false,
        name: 'test.jpg',
        file: success => success(mockFile),
      };

      const mockDataTransfer = {
        items: [
          {
            kind: 'file',
            webkitGetAsEntry: () => mockEntry,
          },
        ],
      };

      const onProgress = vi.fn();
      await importFolderFromDrop(mockDataTransfer, onProgress);

      expect(onProgress).toHaveBeenCalledWith({ current: 1, total: 1 });
    });

    it('should return empty result when no files are dropped', async () => {
      const mockDataTransfer = {
        items: [],
      };

      const result = await importFolderFromDrop(mockDataTransfer);

      expect(result.photos).toHaveLength(0);
      expect(result.folderName).toBe(null);
    });
  });

  describe('importFolder', () => {
    it('should throw error when File System Access API is not supported', async () => {
      global.window = {};

      await expect(importFolder()).rejects.toThrow(
        'File System Access API not supported. Please use Chrome or Edge.'
      );
    });

    it('should return empty result when user cancels', async () => {
      global.window = {
        showDirectoryPicker: vi.fn(() => {
          const error = new Error('User cancelled');
          error.name = 'AbortError';
          throw error;
        }),
      };

      const result = await importFolder();

      expect(result).toEqual({
        photos: [],
        folderName: null,
      });
    });

    it('should import photos from selected directory', async () => {
      // Mock crypto
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-456'),
      });

      const mockFile = {
        size: 2048,
        lastModified: Date.now(),
      };

      const mockFileHandle = {
        kind: 'file',
        name: 'photo.png',
        getFile: vi.fn(async () => mockFile),
      };

      const mockDirHandle = {
        name: 'TestFolder',
        values: async function* () {
          yield mockFileHandle;
        },
      };

      global.window = {
        showDirectoryPicker: vi.fn(async () => mockDirHandle),
      };

      const result = await importFolder();

      expect(result.photos).toHaveLength(1);
      expect(result.photos[0]).toMatchObject({
        id: 'test-uuid-456',
        name: 'photo.png',
        path: 'photo.png',
        file: null, // Memory optimization
        category: null,
      });
      expect(result.folderName).toBe('TestFolder');
    });

    it('should call onProgress callback during import', async () => {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-789'),
      });

      const mockFile = {
        size: 1024,
        lastModified: Date.now(),
      };

      const mockFileHandle = {
        kind: 'file',
        name: 'image.jpg',
        getFile: vi.fn(async () => mockFile),
      };

      const mockDirHandle = {
        name: 'TestFolder',
        values: async function* () {
          yield mockFileHandle;
        },
      };

      global.window = {
        showDirectoryPicker: vi.fn(async () => mockDirHandle),
      };

      const onProgress = vi.fn();
      await importFolder(onProgress);

      expect(onProgress).toHaveBeenCalledWith({ current: 1, total: 1 });
    });

    it('should filter out non-image files during import', async () => {
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => 'test-uuid-999'),
      });

      const mockImageFile = { size: 1024, lastModified: Date.now() };
      const mockTextFile = { size: 512, lastModified: Date.now() };

      const mockImageHandle = {
        kind: 'file',
        name: 'image.jpg',
        getFile: vi.fn(async () => mockImageFile),
      };

      const mockTextHandle = {
        kind: 'file',
        name: 'document.txt',
        getFile: vi.fn(async () => mockTextFile),
      };

      const mockDirHandle = {
        name: 'TestFolder',
        values: async function* () {
          yield mockImageHandle;
          yield mockTextHandle;
        },
      };

      global.window = {
        showDirectoryPicker: vi.fn(async () => mockDirHandle),
      };

      const result = await importFolder();

      expect(result.photos).toHaveLength(1);
      expect(result.photos[0].name).toBe('image.jpg');
    });
  });

  describe('exportPhotos', () => {
    it('should throw error when File System Access API is not supported', async () => {
      global.window = {};
      const { exportPhotos } = await import('./fileSystem.js');

      const photos = [];
      const categories = { correct: true };

      await expect(exportPhotos(photos, categories)).rejects.toThrow(
        'File System Access API not supported. Please use Chrome or Edge.'
      );
    });

    it('should return cancelled result when user cancels directory picker', async () => {
      global.window = {
        showDirectoryPicker: vi.fn(() => {
          const error = new Error('User cancelled');
          error.name = 'AbortError';
          throw error;
        }),
      };

      const { exportPhotos } = await import('./fileSystem.js');
      const photos = [];
      const categories = { correct: true };

      const result = await exportPhotos(photos, categories);

      expect(result).toEqual({
        exported: 0,
        total: 0,
        folderName: null,
        cancelled: true,
      });
    });

    it('should create category directories and export photos', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn(),
      };

      const mockFileHandle = {
        createWritable: vi.fn(async () => mockWritable),
      };

      let fileHandleCallCount = 0;
      const mockCategoryDir = {
        getDirectoryHandle: vi.fn(async (_name, _options) => mockCategoryDir),
        getFileHandle: vi.fn(async (_name, _options) => {
          fileHandleCallCount++;
          // First call throws (file doesn't exist), second call returns handle
          if (fileHandleCallCount === 1) {
            throw new Error('File not found');
          }
          return mockFileHandle;
        }),
      };

      const mockTargetDir = {
        name: 'ExportFolder',
        getDirectoryHandle: vi.fn(async (_name, _options) => mockCategoryDir),
      };

      global.window = {
        showDirectoryPicker: vi.fn(async () => mockTargetDir),
      };

      global.TextEncoder = class TextEncoder {
        encode(str) {
          return new Uint8Array([...str].map(c => c.charCodeAt(0)));
        }
      };

      const mockFile = {
        arrayBuffer: vi.fn(async () => new ArrayBuffer(100)),
      };

      const photos = [
        {
          name: 'test.jpg',
          path: 'folder/test.jpg',
          category: 'correct',
          file: mockFile,
        },
      ];

      const categories = {
        correct: true,
        medium: false,
        wrong: false,
        uncategorized: false,
      };

      const onProgress = vi.fn();

      const { exportPhotos } = await import('./fileSystem.js');
      const result = await exportPhotos(photos, categories, onProgress);

      expect(result.exported).toBe(1);
      expect(result.total).toBe(1);
      expect(result.folderName).toBe('ExportFolder');
      expect(onProgress).toHaveBeenCalledWith({ current: 1, total: 1 });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockWritable.close).toHaveBeenCalled();
    });
  });
});
