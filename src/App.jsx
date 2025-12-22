import { useState, useCallback } from 'react';
import usePhotoStore from './store/usePhotoStore';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import FolderPanel from './components/FolderPanel';
import LightboxPreview from './components/LightboxPreview';
import DragOverlay from './components/DragOverlay';
import PhotoContextMenu from './components/PhotoContextMenu';
import SelectionToolbar from './components/SelectionToolbar';
import VirtualPhotoGrid from './components/VirtualPhotoGrid';
import {
  usePhotoDisplay,
  usePhotoSelection,
  useCompareMode,
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
  const [virtualGridRef, setVirtualGridRef] = useState(null); // 虚拟网格的引用

  // 自定义 Hooks
  const { filteredPhotos } = usePhotoDisplay(photos, filter);
  const { selectedPhotos, setSelectedPhotos, clearSelection } = usePhotoSelection();
  const { setPhotoRef, scrollToPhoto } = usePhotoRefs();
  const { isCompareMode, compareColumns, displayPhotos } = useCompareMode(
    selectedFolders,
    filteredPhotos,
    folderMap,
    filteredPhotos.length, // 不再限制显示数量
    columns,
    setSelectedPhotoId,
    scrollToPhoto,
    selectedPhotoId // 传递当前选中的照片ID，用于退出对比模式时跳转
  );
  // 不再使用 useObjectUrls - VirtualPhotoGrid 内部按需创建URL
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
    ? Math.ceil(displayPhotos.length / compareColumns)
    : 0;

  // 滚动到指定组（使用虚拟网格的 scrollToCell API）
  const scrollToGroup = useCallback(
    (groupIndex) => {
      if (!enableGroupNavigation || groupIndex < 0 || groupIndex >= totalGroups) return;

      // 使用虚拟网格的 scrollToCell API 直接滚动到指定行
      if (virtualGridRef) {
        const rowIndex = groupIndex;
        try {
          virtualGridRef.scrollToCell({
            rowIndex,
            columnIndex: 0,
            rowAlign: 'start',
            behavior: 'smooth',
          });

          // 滚动后，尝试选中该组的第一张真实照片（提升用户体验）
          setTimeout(() => {
            const photoIndex = groupIndex * compareColumns;
            const photo = displayPhotos[photoIndex];

            // 找到该组的第一张真实照片
            let firstRealPhoto = photo;
            if (!firstRealPhoto || !firstRealPhoto.id) {
              // 如果第一个是占位符，找该行的第一张真实照片
              for (let i = 0; i < compareColumns; i++) {
                const p = displayPhotos[photoIndex + i];
                if (p && p.id) {
                  firstRealPhoto = p;
                  break;
                }
              }
            }

            if (firstRealPhoto && firstRealPhoto.id) {
              setSelectedPhotoId(firstRealPhoto.id);
            }
          }, 300); // 等待滚动动画完成
        } catch (error) {
          console.warn('滚动到组失败:', error);
          // 回退：尝试使用 refs（仅当照片已渲染时有效）
          const photoIndex = groupIndex * compareColumns;
          const photo = displayPhotos[photoIndex];
          if (photo && photo.id) {
            scrollToPhoto(photo.id, {
              behavior: 'smooth',
              block: 'start',
            });
          }
        }
      }
    },
    [enableGroupNavigation, totalGroups, compareColumns, displayPhotos, scrollToPhoto, virtualGridRef, setSelectedPhotoId]
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {isCompareMode && (
            <div className="mx-4 mt-4 mb-2 neu-card p-4 rounded-xl flex-shrink-0">
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

          {/* 虚拟滚动网格 */}
          <VirtualPhotoGrid
            photos={displayPhotos}
            allPhotos={photos}
            columns={compareColumns}
            isCompareMode={isCompareMode}
            selectedPhotoId={selectedPhotoId}
            selectedPhotos={selectedPhotos}
            setSelectedPhotoId={setSelectedPhotoId}
            setSelectedPhotos={setSelectedPhotos}
            setCategory={setCategory}
            openPreview={openPreview}
            setCurrentPreviewGroupIndex={setCurrentPreviewGroupIndex}
            openContextMenu={openContextMenu}
            setPhotoRef={setPhotoRef}
            onGridRefReady={setVirtualGridRef}
          />

          {/* 框选提示 */}
          <SelectionToolbar
            selectedPhotos={selectedPhotos}
            onPreview={() => {
              const photosToPreview = displayPhotos.filter((p, i) =>
                p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
              );
              if (isCompareMode && selectedPhotos.length > 0) {
                const firstSelectedIndex = displayPhotos.findIndex((p, i) =>
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
          allPhotos={displayPhotos}
          onGroupChange={(newGroupPhotos) => {
            openPreview(newGroupPhotos);
          }}
        />
      )}
    </div>
  );
}

export default App;
