import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoSelection } from './usePhotoSelection';

describe('usePhotoSelection', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => usePhotoSelection());

    expect(result.current.selectedPhotos).toEqual([]);
  });

  it('should toggle photo selection - add photo', () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.togglePhotoSelection('photo1');
    });

    expect(result.current.selectedPhotos).toEqual(['photo1']);
  });

  it('should toggle photo selection - remove photo', () => {
    const { result } = renderHook(() => usePhotoSelection());

    // Add photo
    act(() => {
      result.current.togglePhotoSelection('photo1');
    });

    expect(result.current.selectedPhotos).toContain('photo1');

    // Toggle again to remove
    act(() => {
      result.current.togglePhotoSelection('photo1');
    });

    expect(result.current.selectedPhotos).toEqual([]);
  });

  it('should add multiple photos', () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.togglePhotoSelection('photo1');
      result.current.togglePhotoSelection('photo2');
      result.current.togglePhotoSelection('photo3');
    });

    expect(result.current.selectedPhotos).toEqual(['photo1', 'photo2', 'photo3']);
  });

  it('should toggle specific photo without affecting others', () => {
    const { result } = renderHook(() => usePhotoSelection());

    // Add 3 photos
    act(() => {
      result.current.togglePhotoSelection('photo1');
      result.current.togglePhotoSelection('photo2');
      result.current.togglePhotoSelection('photo3');
    });

    // Remove middle photo
    act(() => {
      result.current.togglePhotoSelection('photo2');
    });

    expect(result.current.selectedPhotos).toEqual(['photo1', 'photo3']);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => usePhotoSelection());

    // Add multiple photos
    act(() => {
      result.current.togglePhotoSelection('photo1');
      result.current.togglePhotoSelection('photo2');
      result.current.togglePhotoSelection('photo3');
    });

    expect(result.current.selectedPhotos).toHaveLength(3);

    // Clear all
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedPhotos).toEqual([]);
  });

  it('should directly set selections using setSelectedPhotos', () => {
    const { result } = renderHook(() => usePhotoSelection());

    act(() => {
      result.current.setSelectedPhotos(['photo1', 'photo2', 'photo3']);
    });

    expect(result.current.selectedPhotos).toEqual(['photo1', 'photo2', 'photo3']);
  });

  it('should replace selections when using setSelectedPhotos', () => {
    const { result } = renderHook(() => usePhotoSelection());

    // Set initial selection
    act(() => {
      result.current.setSelectedPhotos(['photo1', 'photo2']);
    });

    expect(result.current.selectedPhotos).toEqual(['photo1', 'photo2']);

    // Replace with new selection
    act(() => {
      result.current.setSelectedPhotos(['photo3', 'photo4', 'photo5']);
    });

    expect(result.current.selectedPhotos).toEqual(['photo3', 'photo4', 'photo5']);
  });

  it('should handle toggle after direct set', () => {
    const { result } = renderHook(() => usePhotoSelection());

    // Direct set
    act(() => {
      result.current.setSelectedPhotos(['photo1', 'photo2']);
    });

    // Toggle existing photo
    act(() => {
      result.current.togglePhotoSelection('photo1');
    });

    expect(result.current.selectedPhotos).toEqual(['photo2']);

    // Toggle new photo
    act(() => {
      result.current.togglePhotoSelection('photo3');
    });

    expect(result.current.selectedPhotos).toEqual(['photo2', 'photo3']);
  });

  it('should handle toggling the same photo multiple times', () => {
    const { result } = renderHook(() => usePhotoSelection());

    // Add
    act(() => {
      result.current.togglePhotoSelection('photo1');
    });
    expect(result.current.selectedPhotos).toEqual(['photo1']);

    // Remove
    act(() => {
      result.current.togglePhotoSelection('photo1');
    });
    expect(result.current.selectedPhotos).toEqual([]);

    // Add again
    act(() => {
      result.current.togglePhotoSelection('photo1');
    });
    expect(result.current.selectedPhotos).toEqual(['photo1']);
  });
});
