import { useReducer, useCallback } from 'react';

/**
 * Lightbox状态管理 Hook
 *
 * 使用useReducer替代12个useState，统一管理Lightbox的所有状态
 *
 * 状态包括:
 * - Transform: scale, pan, isPanning, startPan
 * - UI: contextMenu, isCompareMode, hoveredPhotoId
 * - Notifications: lastViewedPhotoId, copyPathNotification
 * - Image: rotations, imageDimensions, photosWithUrls
 */

// 初始状态
const initialState = {
  // Transform状态
  scale: 1,
  pan: { x: 0, y: 0 },
  isPanning: false,
  startPan: { x: 0, y: 0 },

  // UI状态
  contextMenu: null, // { x, y, photoId }
  isCompareMode: false,
  hoveredPhotoId: null,

  // 通知状态
  lastViewedPhotoId: null,
  copyPathNotification: false,

  // 图片属性
  rotations: {}, // { photoId: degree }
  imageDimensions: {}, // { photoId: { width, height } }
  photosWithUrls: { photos: [] },
};

// Action类型
export const ACTIONS = {
  // Transform actions
  SET_SCALE: 'SET_SCALE',
  SET_PAN: 'SET_PAN',
  SET_IS_PANNING: 'SET_IS_PANNING',
  SET_START_PAN: 'SET_START_PAN',
  RESET_TRANSFORM: 'RESET_TRANSFORM',

  // UI actions
  SET_CONTEXT_MENU: 'SET_CONTEXT_MENU',
  CLOSE_CONTEXT_MENU: 'CLOSE_CONTEXT_MENU',
  SET_IS_COMPARE_MODE: 'SET_IS_COMPARE_MODE',
  TOGGLE_COMPARE_MODE: 'TOGGLE_COMPARE_MODE',
  SET_HOVERED_PHOTO_ID: 'SET_HOVERED_PHOTO_ID',

  // Notification actions
  SET_LAST_VIEWED_PHOTO_ID: 'SET_LAST_VIEWED_PHOTO_ID',
  SHOW_COPY_PATH_NOTIFICATION: 'SHOW_COPY_PATH_NOTIFICATION',
  HIDE_COPY_PATH_NOTIFICATION: 'HIDE_COPY_PATH_NOTIFICATION',

  // Image actions
  SET_ROTATION: 'SET_ROTATION',
  SET_IMAGE_DIMENSION: 'SET_IMAGE_DIMENSION',
  SET_PHOTOS_WITH_URLS: 'SET_PHOTOS_WITH_URLS',

  // Batch actions
  RESET_ALL: 'RESET_ALL',
};

// Reducer函数
function lightboxReducer(state, action) {
  switch (action.type) {
    // Transform actions
    case ACTIONS.SET_SCALE:
      return { ...state, scale: action.payload };

    case ACTIONS.SET_PAN:
      return { ...state, pan: action.payload };

    case ACTIONS.SET_IS_PANNING:
      return { ...state, isPanning: action.payload };

    case ACTIONS.SET_START_PAN:
      return { ...state, startPan: action.payload };

    case ACTIONS.RESET_TRANSFORM:
      return {
        ...state,
        scale: 1,
        pan: { x: 0, y: 0 },
        isPanning: false,
        startPan: { x: 0, y: 0 },
      };

    // UI actions
    case ACTIONS.SET_CONTEXT_MENU:
      return { ...state, contextMenu: action.payload };

    case ACTIONS.CLOSE_CONTEXT_MENU:
      return { ...state, contextMenu: null };

    case ACTIONS.SET_IS_COMPARE_MODE:
      return { ...state, isCompareMode: action.payload };

    case ACTIONS.TOGGLE_COMPARE_MODE:
      return { ...state, isCompareMode: !state.isCompareMode };

    case ACTIONS.SET_HOVERED_PHOTO_ID:
      return { ...state, hoveredPhotoId: action.payload };

    // Notification actions
    case ACTIONS.SET_LAST_VIEWED_PHOTO_ID:
      return { ...state, lastViewedPhotoId: action.payload };

    case ACTIONS.SHOW_COPY_PATH_NOTIFICATION:
      return { ...state, copyPathNotification: true };

    case ACTIONS.HIDE_COPY_PATH_NOTIFICATION:
      return { ...state, copyPathNotification: false };

    // Image actions
    case ACTIONS.SET_ROTATION:
      return {
        ...state,
        rotations: {
          ...state.rotations,
          [action.payload.photoId]: action.payload.degree,
        },
      };

    case ACTIONS.SET_IMAGE_DIMENSION:
      return {
        ...state,
        imageDimensions: {
          ...state.imageDimensions,
          [action.payload.photoId]: {
            width: action.payload.width,
            height: action.payload.height,
          },
        },
      };

    case ACTIONS.SET_PHOTOS_WITH_URLS:
      return { ...state, photosWithUrls: action.payload };

    // Batch actions
    case ACTIONS.RESET_ALL:
      return initialState;

    default:
      return state;
  }
}

/**
 * useLightboxState Hook
 *
 * @returns {Object} 状态和操作函数
 */
export function useLightboxState() {
  const [state, dispatch] = useReducer(lightboxReducer, initialState);

  // Transform操作
  const setScale = useCallback(scale => {
    dispatch({ type: ACTIONS.SET_SCALE, payload: scale });
  }, []);

  const setPan = useCallback(pan => {
    dispatch({ type: ACTIONS.SET_PAN, payload: pan });
  }, []);

  const setIsPanning = useCallback(isPanning => {
    dispatch({ type: ACTIONS.SET_IS_PANNING, payload: isPanning });
  }, []);

  const setStartPan = useCallback(startPan => {
    dispatch({ type: ACTIONS.SET_START_PAN, payload: startPan });
  }, []);

  const resetTransform = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_TRANSFORM });
  }, []);

  // UI操作
  const setContextMenu = useCallback(contextMenu => {
    dispatch({ type: ACTIONS.SET_CONTEXT_MENU, payload: contextMenu });
  }, []);

  const closeContextMenu = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_CONTEXT_MENU });
  }, []);

  const setIsCompareMode = useCallback(isCompareMode => {
    dispatch({ type: ACTIONS.SET_IS_COMPARE_MODE, payload: isCompareMode });
  }, []);

  const toggleCompareMode = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_COMPARE_MODE });
  }, []);

  const setHoveredPhotoId = useCallback(photoId => {
    dispatch({ type: ACTIONS.SET_HOVERED_PHOTO_ID, payload: photoId });
  }, []);

  // 通知操作
  const setLastViewedPhotoId = useCallback(photoId => {
    dispatch({ type: ACTIONS.SET_LAST_VIEWED_PHOTO_ID, payload: photoId });
  }, []);

  const showCopyPathNotification = useCallback(() => {
    dispatch({ type: ACTIONS.SHOW_COPY_PATH_NOTIFICATION });
  }, []);

  const hideCopyPathNotification = useCallback(() => {
    dispatch({ type: ACTIONS.HIDE_COPY_PATH_NOTIFICATION });
  }, []);

  // 图片操作
  const setRotation = useCallback((photoId, degree) => {
    dispatch({
      type: ACTIONS.SET_ROTATION,
      payload: { photoId, degree },
    });
  }, []);

  const setImageDimension = useCallback((photoId, width, height) => {
    dispatch({
      type: ACTIONS.SET_IMAGE_DIMENSION,
      payload: { photoId, width, height },
    });
  }, []);

  const setPhotosWithUrls = useCallback(photosWithUrls => {
    dispatch({ type: ACTIONS.SET_PHOTOS_WITH_URLS, payload: photosWithUrls });
  }, []);

  // 批量操作
  const resetAll = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_ALL });
  }, []);

  return {
    // 状态
    scale: state.scale,
    pan: state.pan,
    isPanning: state.isPanning,
    startPan: state.startPan,
    contextMenu: state.contextMenu,
    isCompareMode: state.isCompareMode,
    hoveredPhotoId: state.hoveredPhotoId,
    lastViewedPhotoId: state.lastViewedPhotoId,
    copyPathNotification: state.copyPathNotification,
    rotations: state.rotations,
    imageDimensions: state.imageDimensions,
    photosWithUrls: state.photosWithUrls,

    // 操作函数
    setScale,
    setPan,
    setIsPanning,
    setStartPan,
    resetTransform,
    setContextMenu,
    closeContextMenu,
    setIsCompareMode,
    toggleCompareMode,
    setHoveredPhotoId,
    setLastViewedPhotoId,
    showCopyPathNotification,
    hideCopyPathNotification,
    setRotation,
    setImageDimension,
    setPhotosWithUrls,
    resetAll,
  };
}
