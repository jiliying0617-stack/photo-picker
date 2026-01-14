import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportGroupAsPNG, exportGroupAsGIF, exportGroupAsSimpleGIF } from './exportUtils';

describe('exportUtils', () => {
  let mockCanvas;
  let mockContext;
  let mockURL;
  let mockImage;
  let alertSpy;
  let confirmSpy;
  let consoleSpy;

  beforeEach(() => {
    // Mock Canvas
    mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      font: '',
      fillText: vi.fn(),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn(callback => {
        const blob = new Blob(['mock-image-data'], { type: 'image/png' });
        callback(blob);
      }),
    };

    // Mock document.createElement
    global.document = {
      createElement: vi.fn(tag => {
        if (tag === 'canvas') return mockCanvas;
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
          };
        }
        return null;
      }),
    };

    // Mock URL
    mockURL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };
    global.URL = mockURL;

    // Mock Image
    mockImage = class {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        this.width = 100;
        this.height = 100;
      }

      set src(value) {
        this._src = value;
        // Simulate successful image load
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }

      get src() {
        return this._src;
      }
    };
    global.Image = mockImage;

    // Mock alert and confirm
    alertSpy = vi.fn();
    global.alert = alertSpy;

    confirmSpy = vi.fn(() => true);
    global.confirm = confirmSpy;

    // Mock console
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('exportGroupAsPNG', () => {
    it('should export photos as PNG collage', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
        { file: new Blob(['photo2'], { type: 'image/jpeg' }), name: 'photo2.jpg' },
      ];

      await exportGroupAsPNG(mockPhotos, 'test-group');

      // Should create canvas
      expect(global.document.createElement).toHaveBeenCalledWith('canvas');

      // Should draw images
      expect(mockContext.drawImage).toHaveBeenCalledTimes(2);

      // Should create download link
      expect(global.document.createElement).toHaveBeenCalledWith('a');

      // Should log success
      expect(consoleSpy).toHaveBeenCalledWith('✅ PNG拼图导出成功');
    });

    it('should filter out null placeholders', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
        null, // placeholder
        { file: new Blob(['photo2'], { type: 'image/jpeg' }), name: 'photo2.jpg' },
        null, // placeholder
      ];

      await exportGroupAsPNG(mockPhotos, 'test-group');

      // Should only draw 2 real photos
      expect(mockContext.drawImage).toHaveBeenCalledTimes(2);
    });

    it('should show alert when no photos to export', async () => {
      const mockPhotos = [null, null]; // all placeholders

      await exportGroupAsPNG(mockPhotos, 'test-group');

      expect(alertSpy).toHaveBeenCalledWith('本组没有可导出的照片');
      expect(mockContext.drawImage).not.toHaveBeenCalled();
    });

    it('should handle empty photo array', async () => {
      await exportGroupAsPNG([], 'test-group');

      expect(alertSpy).toHaveBeenCalledWith('本组没有可导出的照片');
    });

    it('should use group name in filename', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
      ];

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      global.document.createElement = vi.fn(tag => {
        if (tag === 'canvas') return mockCanvas;
        if (tag === 'a') return mockLink;
        return null;
      });

      await exportGroupAsPNG(mockPhotos, 'my-custom-group');

      // Check that download attribute contains group name
      expect(mockLink.download).toMatch(/^my-custom-group_拼图_\d+\.png$/);
    });
  });

  describe('exportGroupAsGIF', () => {
    it('should delegate to exportGroupAsSimpleGIF', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
      ];

      confirmSpy.mockReturnValue(false); // Don't convert to PNG

      await exportGroupAsGIF(mockPhotos, 'test-group');

      // Should show confirm dialog (from exportGroupAsSimpleGIF)
      expect(confirmSpy).toHaveBeenCalled();
    });
  });

  describe('exportGroupAsSimpleGIF', () => {
    it('should show confirmation dialog', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
        { file: new Blob(['photo2'], { type: 'image/jpeg' }), name: 'photo2.jpg' },
      ];

      confirmSpy.mockReturnValue(false);

      await exportGroupAsSimpleGIF(mockPhotos, 'test-group');

      // Should show confirm dialog with photo count
      expect(confirmSpy).toHaveBeenCalled();
      const confirmMessage = confirmSpy.mock.calls[0][0];
      expect(confirmMessage).toContain('2 张照片');
    });

    it('should call exportGroupAsPNG when user confirms', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
      ];

      confirmSpy.mockReturnValue(true);

      await exportGroupAsSimpleGIF(mockPhotos, 'test-group');

      // Should create canvas (from exportGroupAsPNG)
      expect(global.document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should not export when user cancels', async () => {
      const mockPhotos = [
        { file: new Blob(['photo1'], { type: 'image/jpeg' }), name: 'photo1.jpg' },
      ];

      confirmSpy.mockReturnValue(false);

      await exportGroupAsSimpleGIF(mockPhotos, 'test-group');

      // Should not create canvas
      expect(global.document.createElement).not.toHaveBeenCalledWith('canvas');
    });

    it('should show alert when no photos to export', async () => {
      const mockPhotos = [null, null];

      await exportGroupAsSimpleGIF(mockPhotos, 'test-group');

      expect(alertSpy).toHaveBeenCalledWith('本组没有可导出的照片');
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});
