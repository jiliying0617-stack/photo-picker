import { useState, useCallback } from 'react';
import usePhotoStore from './store/usePhotoStore';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import FolderPanel from './components/FolderPanel';
import LightboxPreview from './components/LightboxPreview';
import DragOverlay from './components/DragOverlay';
import PhotoContextMenu from './components/PhotoContextMenu';
import SelectionToolbar from './components/SelectionToolbar';
import { getFileFormat, getFormatBadgeColor } from './utils/imageUtils';
import { PHOTO_DISPLAY } from './constants';
import {
  usePhotoDisplay,
  usePhotoSelection,
  useCompareMode,
  useObjectUrls,
  useKeyboardShortcuts,
  useDragAndDrop,
  useContextMenu,
  usePhotoPreview,
  useToast,
  usePhotoRefs,
} from './hooks';
import Toast from './components/Toast';

function App() {
  // Zustand store
  const photos = usePhotoStore((state) => state.photos);
  const folderMap = usePhotoStore((state) => state.folderMap);
  const columns = usePhotoStore((state) => state.columns);
  const setCategory = usePhotoStore((state) => state.setCategory);
  const setCategoryBatch = usePhotoStore((state) => state.setCategoryBatch);
  const selectedPhotoId = usePhotoStore((state) => state.selectedPhotoId);
  const setSelectedPhotoId = usePhotoStore((state) => state.setSelectedPhotoId);
  const groupBrowseMode = usePhotoStore((state) => state.groupBrowseMode);

  // 本地 UI 状态
  const [filter, setFilter] = useState({ category: null, folders: [] });
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [jumpToGroup, setJumpToGroup] = useState('');

  // 自定义 Hooks
  const { displayCount, setDisplayCount, filteredPhotos } = usePhotoDisplay(photos, filter);
  const { selectedPhotos, setSelectedPhotos, clearSelection } = usePhotoSelection();
  const { gridRef, setPhotoRef, scrollToPhoto, scrollToIndex } = usePhotoRefs();
  const { isCompareMode, compareColumns, displayPhotos } = useCompareMode(
    selectedFolders,
    filteredPhotos,
    folderMap,
    displayCount,
    columns,
    setSelectedPhotoId,
    scrollToPhoto
  );
  const displayPhotosWithUrls = useObjectUrls(displayPhotos, photos);
  const { isDragging } = useDragAndDrop();
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const {
    previewPhotos,
    currentPreviewGroupIndex,
    openPreview,
    closePreview,
    setCurrentPreviewGroupIndex,
  } = usePhotoPreview();
  const { toasts, closeToast, success, error, warning, info } = useToast();

  // 键盘快捷键
  useKeyboardShortcuts({
    selectedPhotoId,
    selectedPhotos,
    filteredPhotos,
    setCategory,
    setCategoryBatch,
    setSelectedPhotoId,
    clearSelection,
  });

  // 计算总组数 - 在对比模式或检索组模式下启用
  const enableGroupNavigation = isCompareMode || groupBrowseMode;
  const totalGroups = enableGroupNavigation
    ? Math.ceil(displayPhotosWithUrls.length / compareColumns)
    : 0;

  // 滚动到指定组（使用 O(1) refs 查找替代 O(n) querySelectorAll）
  const scrollToGroup = useCallback(
    (groupIndex) => {
      if (!enableGroupNavigation || groupIndex < 0 || groupIndex >= totalGroups) return;

      const photoIndex = groupIndex * compareColumns;
      const photo = displayPhotosWithUrls[photoIndex];

      if (photo && photo.id) {
        // 尝试使用 refs 滚动（O(1)）
        scrollToPhoto(photo.id, {
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
    [enableGroupNavigation, totalGroups, compareColumns, displayPhotosWithUrls, scrollToPhoto]
  );


  // 检测是否有分类数据但缺少图片文件
  const hasDataButNoImages = photos.length > 0 && photos.every(p => !p.file && !p.thumbnailUrl);

  // 空状态
  if (photos.length === 0 || hasDataButNoImages) {
    return (
      <div className="h-screen flex flex-col bg-[#e0e5ec]">
        <Toolbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 neu-card rounded-3xl flex items-center justify-center">
              <span className="text-5xl text-gray-400">⚡</span>
            </div>
            {hasDataButNoImages ? (
              <>
                <div className="text-xl font-light text-gray-500 mb-2">
                  检测到 {photos.length} 张图片的分类记录
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  刷新后需要重新导入文件夹才能查看图片
                </div>
                <div className="text-xs text-gray-400 neu-concave p-3 rounded-xl max-w-md mx-auto">
                  💡 提示: 您的分类数据已保存,重新导入相同文件夹后,<br />
                  之前的分类标记会自动恢复
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-light text-gray-500 mb-2">暂无图片</div>
                <div className="text-sm text-gray-400">点击上方 "导入文件夹" 开始筛图</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#e0e5ec] relative">
      <Toast toasts={toasts} onClose={closeToast} />
      <Toolbar toast={{ success, error, warning, info }} />

      {/* 拖放蒙层 */}
      <DragOverlay isDragging={isDragging} />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文件夹面板 */}
        <FolderPanel
          onFilterChange={setFilter}
          onSelectedFoldersChange={setSelectedFolders}
        />

        {/* 主内容区 */}
        <div id="photo-container" className="flex-1 overflow-auto p-4">
          {isCompareMode && (
            <div className="mb-4 neu-card p-4 rounded-xl">
              <div className="text-center text-sm font-medium text-blue-600">
                🔀 对比模式 · {compareColumns} 列对比 · 按文件名对齐
              </div>
              <div className="mt-2 flex gap-2 justify-center flex-wrap">
                {selectedFolders.map((folder, idx) => (
                  <div key={folder} className="text-xs px-3 py-1 neu-convex rounded-lg text-gray-600">
                    列 {idx + 1}: {folder.split('/').pop()}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${compareColumns}, 1fr)` }}
          >
            {displayPhotosWithUrls.map((photo, idx) => {
              // 处理占位符 - 支持点选和预览
              if (!photo) {
                const placeholderId = `placeholder-${idx}`;
                const isPlaceholderSelected = selectedPhotos.includes(placeholderId);

                const handlePlaceholderClick = (e) => {
                  if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    // 框选模式
                    e.preventDefault();
                    setSelectedPhotos(prev =>
                      prev.includes(placeholderId)
                        ? prev.filter(id => id !== placeholderId)
                        : [...prev, placeholderId]
                    );
                  }
                };

                const handlePlaceholderDoubleClick = () => {
                  // 双击打开预览整组（包括占位符）
                  // 保存当前组索引（对比模式下）
                  if (isCompareMode) {
                    const groupIndex = Math.floor(idx / compareColumns);
                    setCurrentPreviewGroupIndex(groupIndex);
                  }

                  if (selectedPhotos.length > 0) {
                    // 如果有框选的图片，预览所有框选的
                    const photosToPreview = displayPhotosWithUrls.filter((p, i) =>
                      p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
                    );
                    openPreview(photosToPreview);
                  } else {
                    // 否则预览当前组（对比模式下通常是一行）
                    const rowStartIdx = Math.floor(idx / compareColumns) * compareColumns;
                    const rowPhotos = displayPhotosWithUrls.slice(rowStartIdx, rowStartIdx + compareColumns);
                    openPreview(rowPhotos);
                  }
                };

                return (
                  <div
                    key={placeholderId}
                    className={`photo-item neu-card rounded-2xl overflow-hidden cursor-pointer transition-all ${
                      isPlaceholderSelected ? 'ring-4 ring-blue-500' : ''
                    }`}
                    onClick={handlePlaceholderClick}
                    onDoubleClick={handlePlaceholderDoubleClick}
                  >
                    {isPlaceholderSelected && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
                        ✓
                      </div>
                    )}
                    <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 neu-concave relative">
                      <div className="text-6xl mb-3 opacity-20">📷</div>
                      <div className="text-gray-400 text-xs font-medium">此文件夹无此图片</div>
                      <div className="absolute bottom-2 text-gray-300 text-[10px]">
                        点击选择 · 双击预览
                      </div>
                    </div>
                  </div>
                );
              }

              const isSelected = selectedPhotoId === photo.id;
              const isBoxSelected = selectedPhotos.includes(photo.id);
              const categoryIcons = {
                correct: { icon: '✓', color: 'text-green-600' },
                medium: { icon: '~', color: 'text-yellow-600' },
                wrong: { icon: '✕', color: 'text-red-600' },
              };
              const config = photo.category ? categoryIcons[photo.category] : null;

              // 获取文件格式信息
              const fileFormat = getFileFormat(photo.name);
              const formatColors = getFormatBadgeColor(fileFormat);

              const handlePhotoClick = (e) => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  // 框选模式
                  e.preventDefault();
                  setSelectedPhotos(prev =>
                    prev.includes(photo.id)
                      ? prev.filter(id => id !== photo.id)
                      : [...prev, photo.id]
                  );
                } else {
                  // 普通点击
                  setSelectedPhotoId(photo.id);
                }
              };

              const handleDoubleClick = () => {
                // 双击打开预览
                const photosToPreview = selectedPhotos.length > 0
                  ? displayPhotosWithUrls.filter(p => p && selectedPhotos.includes(p.id))
                  : [photo];
                // 保存当前组索引（对比模式下）
                if (isCompareMode) {
                  const groupIndex = Math.floor(idx / compareColumns);
                  setCurrentPreviewGroupIndex(groupIndex);
                }
                openPreview(photosToPreview);
              };

              const handleContextMenu = (e) => {
                e.preventDefault();
                openContextMenu(e.clientX, e.clientY, photo.id);
              };

              return (
                <div
                  key={photo.id}
                  ref={(el) => setPhotoRef(photo.id, el)}
                  data-photo-id={photo.id}
                  className={`photo-item neu-card rounded-2xl overflow-hidden ${isBoxSelected ? 'ring-4 ring-blue-500' : ''}`}
                >
                  {isCompareMode && (
                    <div className="p-2 bg-[#e0e5ec] border-b border-gray-300">
                      <div className="text-xs text-gray-600 truncate font-medium">
                        {photo.name}
                      </div>
                    </div>
                  )}
                  {isBoxSelected && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
                      ✓
                    </div>
                  )}
                  <div
                    onClick={handlePhotoClick}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={handleContextMenu}
                    className={`
                      relative group cursor-pointer
                      transition-all duration-200
                      ${isSelected ? 'scale-95' : 'hover:scale-105'}
                    `}
                  >
                    <div className="aspect-square neu-concave rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.name}
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* 文件格式角标 - 左上角 */}
                    {isCompareMode && (
                      <div
                        className={`
                          absolute top-2 left-2 px-2 py-1 rounded-md
                          text-xs font-bold shadow-lg
                          ${formatColors.bg} ${formatColors.text}
                        `}
                      >
                        {fileFormat}
                      </div>
                    )}

                    {config && (
                      <div
                        className={`
                          absolute top-3 right-3 w-8 h-8 rounded-full neu-convex
                          flex items-center justify-center ${config.color} font-bold text-lg
                        `}
                      >
                        {config.icon}
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="neu-card p-2 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategory(photo.id, 'correct');
                          }}
                          className="flex-1 neu-button rounded-lg py-2 text-green-600 text-xs font-medium"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategory(photo.id, 'medium');
                          }}
                          className="flex-1 neu-button rounded-lg py-2 text-yellow-600 text-xs font-medium"
                        >
                          ~
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategory(photo.id, 'wrong');
                          }}
                          className="flex-1 neu-button rounded-lg py-2 text-red-600 text-xs font-medium"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 加载提示和性能警告 */}
          {displayCount < filteredPhotos.length && (
            <div className="text-center py-8">
              {displayCount >= PHOTO_DISPLAY.MAX_RENDER_COUNT ? (
                <div className="neu-card p-6 rounded-xl max-w-2xl mx-auto">
                  <div className="text-yellow-600 text-2xl mb-3">⚠️</div>
                  <div className="text-gray-800 font-medium mb-2">
                    已达到最大显示数量 ({PHOTO_DISPLAY.MAX_RENDER_COUNT} 张)
                  </div>
                  <div className="text-gray-600 text-sm mb-3">
                    总共 {filteredPhotos.length} 张照片，还有 {filteredPhotos.length - displayCount} 张未显示
                  </div>
                  <div className="text-gray-500 text-xs">
                    💡 建议：使用左侧文件夹筛选或分类筛选来缩小范围
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  显示 {displayCount} / {filteredPhotos.length} 张 · 继续滚动加载更多...
                </div>
              )}
            </div>
          )}

          {/* 框选提示 */}
          <SelectionToolbar
            selectedPhotos={selectedPhotos}
            onPreview={() => {
              const photosToPreview = displayPhotosWithUrls.filter((p, i) =>
                p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
              );
              if (isCompareMode && selectedPhotos.length > 0) {
                const firstSelectedIndex = displayPhotosWithUrls.findIndex((p, i) =>
                  p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
                );
                if (firstSelectedIndex >= 0) {
                  const groupIndex = Math.floor(firstSelectedIndex / compareColumns);
                  setCurrentPreviewGroupIndex(groupIndex);
                }
              }
              openPreview(photosToPreview);
            }}
            onClear={() => setSelectedPhotos([])}
          />
        </div>
      </div>

      <StatusBar
        isCompareMode={isCompareMode}
        enableGroupNavigation={enableGroupNavigation}
        totalGroups={totalGroups}
        jumpToGroup={jumpToGroup}
        onJumpToGroupChange={setJumpToGroup}
        onJumpToGroup={scrollToGroup}
      />

      {/* 右键菜单 */}
      <PhotoContextMenu
        contextMenu={contextMenu}
        setCategory={setCategory}
        onClose={closeContextMenu}
      />

      {/* 大图预览 */}
      {previewPhotos && (
        <LightboxPreview
          photos={previewPhotos}
          initialIndex={0}
          onClose={() => {
            // 找到当前预览的第一张真实照片
            const firstRealPhoto = previewPhotos.find(p => p && p.id);

            closePreview();
            clearSelection();

            // 关闭预览后滚动到该照片位置（使用 O(1) refs 替代 O(n) querySelectorAll）
            if (firstRealPhoto) {
              setTimeout(() => {
                const success = scrollToPhoto(firstRealPhoto.id, {
                  behavior: 'smooth',
                  block: 'center',
                });

                // 选中该照片
                if (success) {
                  setSelectedPhotoId(firstRealPhoto.id);
                }
              }, 100);
            } else if (isCompareMode && currentPreviewGroupIndex >= 0) {
              // 如果没有真实照片（都是占位符），回退到组位置
              setTimeout(() => scrollToGroup(currentPreviewGroupIndex), 100);
            }
          }}
          allPhotos={displayPhotosWithUrls}
          onGroupChange={(newGroupPhotos) => {
            openPreview(newGroupPhotos);
          }}
        />
      )}
    </div>
  );
}

export default App;
