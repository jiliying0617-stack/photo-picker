import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePhotoDisplay } from './usePhotoDisplay';

describe('usePhotoDisplay', () => {
  const mockPhotos = [
    { id: '1', name: 'photo1.jpg', category: 'correct', folder: 'folder1/sub1' },
    { id: '2', name: 'photo2.jpg', category: 'medium', folder: 'folder1/sub2' },
    { id: '3', name: 'photo3.jpg', category: 'wrong', folder: 'folder2' },
    { id: '4', name: 'photo4.jpg', category: 'correct', folder: 'folder2/sub' },
    { id: '5', name: 'photo5.jpg', category: null, folder: 'folder3' },
  ];

  it('should return all photos when no filter is applied', () => {
    const filter = {};
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    expect(result.current.filteredPhotos).toHaveLength(5);
    expect(result.current.displayCount).toBe(5);
  });

  it('should filter photos by category', () => {
    const filter = { category: 'correct' };
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    expect(result.current.filteredPhotos).toHaveLength(2);
    expect(result.current.filteredPhotos[0].id).toBe('1');
    expect(result.current.filteredPhotos[1].id).toBe('4');
    expect(result.current.displayCount).toBe(2);
  });

  it('should filter photos by single folder', () => {
    const filter = { folders: ['folder1'] };
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    expect(result.current.filteredPhotos).toHaveLength(2);
    expect(result.current.filteredPhotos[0].id).toBe('1');
    expect(result.current.filteredPhotos[1].id).toBe('2');
  });

  it('should filter photos by multiple folders', () => {
    const filter = { folders: ['folder1', 'folder2'] };
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    expect(result.current.filteredPhotos).toHaveLength(4);
  });

  it('should filter by both category and folders', () => {
    const filter = { category: 'correct', folders: ['folder2'] };
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    expect(result.current.filteredPhotos).toHaveLength(1);
    expect(result.current.filteredPhotos[0].id).toBe('4');
  });

  it('should return empty array when no photos match filter', () => {
    const filter = { category: 'nonexistent' };
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    expect(result.current.filteredPhotos).toHaveLength(0);
    expect(result.current.displayCount).toBe(0);
  });

  it('should handle empty photos array', () => {
    const filter = {};
    const { result } = renderHook(() => usePhotoDisplay([], filter));

    expect(result.current.filteredPhotos).toHaveLength(0);
    expect(result.current.displayCount).toBe(0);
  });

  it('should provide backward-compatible setDisplayCount', () => {
    const filter = {};
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    // Should be a function
    expect(typeof result.current.setDisplayCount).toBe('function');

    // Should not throw when called
    expect(() => result.current.setDisplayCount(10)).not.toThrow();
  });

  it('should match folders by startsWith (subfolder matching)', () => {
    const filter = { folders: ['folder2'] };
    const { result } = renderHook(() => usePhotoDisplay(mockPhotos, filter));

    // Should match both 'folder2' and 'folder2/sub'
    expect(result.current.filteredPhotos).toHaveLength(2);
    expect(result.current.filteredPhotos.some(p => p.id === '3')).toBe(true);
    expect(result.current.filteredPhotos.some(p => p.id === '4')).toBe(true);
  });

  it('should update filteredPhotos when filter changes', () => {
    const filter1 = { category: 'correct' };
    const { result, rerender } = renderHook(
      ({ photos, filter }) => usePhotoDisplay(photos, filter),
      { initialProps: { photos: mockPhotos, filter: filter1 } }
    );

    expect(result.current.filteredPhotos).toHaveLength(2);

    // Change filter
    const filter2 = { category: 'medium' };
    rerender({ photos: mockPhotos, filter: filter2 });

    expect(result.current.filteredPhotos).toHaveLength(1);
    expect(result.current.filteredPhotos[0].id).toBe('2');
  });
});
