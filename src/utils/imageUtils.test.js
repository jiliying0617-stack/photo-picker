import { describe, it, expect } from 'vitest';
import { getFileFormat, getFormatBadgeColor } from './imageUtils';

describe('imageUtils', () => {
  describe('getFileFormat', () => {
    it('should detect RAW formats', () => {
      expect(getFileFormat('photo.raw')).toBe('RAW');
      expect(getFileFormat('canon.cr2')).toBe('RAW');
      expect(getFileFormat('nikon.nef')).toBe('RAW');
      expect(getFileFormat('sony.arw')).toBe('RAW');
      expect(getFileFormat('adobe.dng')).toBe('RAW');
    });

    it('should detect common formats', () => {
      expect(getFileFormat('photo.jpg')).toBe('JPG');
      expect(getFileFormat('image.jpeg')).toBe('JPG');
      expect(getFileFormat('picture.png')).toBe('PNG');
      expect(getFileFormat('graphic.gif')).toBe('GIF');
      expect(getFileFormat('photo.webp')).toBe('WEBP');
    });

    it('should return uppercase format for other files', () => {
      expect(getFileFormat('file.pdf')).toBe('PDF');
      expect(getFileFormat('file.tiff')).toBe('TIFF');
    });

    it('should return UNKNOWN for files without extension', () => {
      expect(getFileFormat('noext')).toBe('UNKNOWN');
      expect(getFileFormat('')).toBe('UNKNOWN');
    });
  });

  describe('getFormatBadgeColor', () => {
    it('should return correct colors for formats', () => {
      const rawColors = getFormatBadgeColor('RAW');
      expect(rawColors).toHaveProperty('bg');
      expect(rawColors).toHaveProperty('text');
      expect(rawColors.bg).toBeTruthy();
      expect(rawColors.text).toBeTruthy();

      const jpgColors = getFormatBadgeColor('JPG');
      expect(jpgColors).toHaveProperty('bg');
      expect(jpgColors).toHaveProperty('text');
    });

    it('should handle all supported formats', () => {
      const formats = ['RAW', 'JPG', 'PNG', 'GIF', 'WEBP', 'TIFF', 'BMP', 'SVG'];
      formats.forEach(format => {
        const colors = getFormatBadgeColor(format);
        expect(colors).toBeDefined();
        expect(colors.bg).toBeTruthy();
        expect(colors.text).toBeTruthy();
      });
    });

    it('should return default colors for unknown formats', () => {
      const colors = getFormatBadgeColor('UNKNOWN');
      expect(colors).toEqual({ bg: 'bg-gray-400', text: 'text-white' });
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      const { formatFileSize } = require('./imageUtils');

      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      const { formatFileSize } = require('./imageUtils');

      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('getImageDimensions', () => {
    let mockImage;
    let mockURL;

    beforeEach(() => {
      // Mock Image
      mockImage = class {
        constructor() {
          this.onload = null;
          this.onerror = null;
          this.src = '';
          this.naturalWidth = 800;
          this.naturalHeight = 600;
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

      // Mock URL
      mockURL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      };
      global.URL = mockURL;
    });

    it('should return image dimensions on successful load', async () => {
      const { getImageDimensions } = require('./imageUtils');
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const dimensions = await getImageDimensions(mockFile);

      expect(dimensions).toEqual({
        width: 800,
        height: 600,
      });
      expect(mockURL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(mockURL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should reject on image load error', async () => {
      const { getImageDimensions } = require('./imageUtils');

      // Override Image to trigger error
      global.Image = class {
        constructor() {
          this.onload = null;
          this.onerror = null;
          this.src = '';
        }

        set src(value) {
          this._src = value;
          // Simulate error
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }

        get src() {
          return this._src;
        }
      };

      const mockFile = new File(['invalid'], 'bad.jpg', { type: 'image/jpeg' });

      await expect(getImageDimensions(mockFile)).rejects.toThrow('Failed to load image');
      expect(mockURL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
