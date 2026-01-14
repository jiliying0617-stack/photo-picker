import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserId, getUserStorageKey, clearUserData } from './userIdentity';

describe('userIdentity', () => {
  let localStorageMock;
  let originalLocalStorage;

  beforeEach(() => {
    // Create a mock localStorage
    const store = {};
    localStorageMock = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: vi.fn(key => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };

    // Add Object.keys support for clearUserData
    Object.defineProperty(localStorageMock, 'keys', {
      get: () => Object.keys(store),
    });

    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock browser APIs for fingerprint generation
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Test)',
      language: 'en-US',
      platform: 'Test Platform',
    };

    global.screen = {
      width: 1920,
      height: 1080,
    };

    global.Intl = {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'UTC' }),
      }),
    };

    // Mock canvas
    global.document = {
      createElement: vi.fn(() => ({
        getContext: () => ({
          textBaseline: '',
          font: '',
          fillText: vi.fn(),
        }),
        toDataURL: () => 'data:image/png;base64,mock-canvas-data',
      })),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalLocalStorage) {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    }
  });

  describe('getUserId', () => {
    it('should generate and store a new user ID if none exists', () => {
      const userId = getUserId();

      expect(userId).toMatch(/^user_/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('photo-picker-user-id', userId);
    });

    it('should return existing user ID from localStorage', () => {
      const existingId = 'user_existing_123456';
      localStorageMock.getItem.mockReturnValue(existingId);

      const userId = getUserId();

      expect(userId).toBe(existingId);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should generate consistent ID format', () => {
      const userId = getUserId();

      // Should start with 'user_' and contain timestamp
      expect(userId).toMatch(/^user_[a-zA-Z0-9+/=]+_\d+$/);
    });
  });

  describe('getUserStorageKey', () => {
    it('should return prefixed storage key', () => {
      const existingId = 'user_test_123';
      localStorageMock.getItem.mockReturnValue(existingId);

      const key = getUserStorageKey('categories');

      expect(key).toBe('photo-picker_user_test_123_categories');
    });

    it('should work with different key names', () => {
      const existingId = 'user_test_456';
      localStorageMock.getItem.mockReturnValue(existingId);

      expect(getUserStorageKey('photos')).toBe('photo-picker_user_test_456_photos');
      expect(getUserStorageKey('settings')).toBe('photo-picker_user_test_456_settings');
      expect(getUserStorageKey('state')).toBe('photo-picker_user_test_456_state');
    });

    it('should handle special characters in key names', () => {
      const existingId = 'user_test_789';
      localStorageMock.getItem.mockReturnValue(existingId);

      const key = getUserStorageKey('my-key_123');

      expect(key).toBe('photo-picker_user_test_789_my-key_123');
    });
  });

  describe('clearUserData', () => {
    it('should remove all user-specific keys from localStorage', () => {
      const userId = 'user_test_999';
      localStorageMock.getItem.mockReturnValue(userId);

      // Add some mock data
      const store = {
        'photo-picker-user-id': userId,
        'photo-picker_user_test_999_categories': '{}',
        'photo-picker_user_test_999_photos': '[]',
        'photo-picker_other_user_data': 'should not be removed',
        'unrelated-key': 'should not be removed',
      };

      // Mock Object.keys to return our store keys
      const originalObjectKeys = Object.keys;
      const storeKeys = originalObjectKeys(store);
      Object.keys = vi.fn(obj => {
        if (obj === localStorage) {
          return storeKeys;
        }
        return originalObjectKeys(obj);
      });

      localStorageMock.getItem.mockImplementation(key => store[key] || null);

      clearUserData();

      // Restore Object.keys
      Object.keys = originalObjectKeys;

      // Should remove user-specific keys
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'photo-picker_user_test_999_categories'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('photo-picker_user_test_999_photos');

      // Should not remove other keys
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('photo-picker_other_user_data');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('unrelated-key');
    });

    it('should handle empty localStorage gracefully', () => {
      const userId = 'user_test_empty';
      localStorageMock.getItem.mockReturnValue(userId);
      Object.keys = vi.fn(() => []);

      expect(() => clearUserData()).not.toThrow();
    });
  });
});
