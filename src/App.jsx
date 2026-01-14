import { useState } from 'react';
import usePhotoStore from './store/usePhotoStore';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import FolderPanel from './components/FolderPanel';
import LightboxPreview from './components/LightboxPreview';
import DragOverlay from './components/DragOverlay';
import PhotoContextMenu from './components/PhotoContextMenu';
import SelectionToolbar from './components/SelectionToolbar';
import VirtualPhotoGrid from './components/VirtualPhotoGrid';
import CompareModePanel from './components/CompareModePanel';
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
  useGroupNavigation,
  usePreviewCloseHandler,
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
  const deletePhoto = usePhotoStore((state) => state.deletePhoto);

  // 本地 UI 状态
  const [filter, setFilter] = useState({ category: null, folders: [] });
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [jumpToGroup, setJumpToGroup] = useState('');
  const [virtualGridRef, setVirtualGridRef] = useState(null); // 虚拟网格的引用

  // 自定义 Hooks
  const { filteredPhotos } = usePhotoDisplay(photos, filter);
  const { selectedPhotos, setSelectedPhotos, togglePhotoSelection, clearSelection } = usePhotoSelection();
  const { setPhotoRef, scrollToPhoto } = usePhotoRefs();
  const { isCompareMode, compareColumns, displayPhotos } = useCompareMode(
    selectedFolders,
    filteredPhotos,
    folderMap,
    filteredPhotos.length, // 不再限制显示数量
    columns,
    setSelectedPhotoId,
    scrollToPhoto,
    selectedPhotoId, // 传递当前选中的照片ID，用于退出对比模式时跳转
    virtualGridRef // 传递虚拟网格引用，用于滚动定位
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
    togglePhotoSelection,
    setSelectedPhotos,
    previewPhotos, // 🔥 传递 previewPhotos，Lightbox 打开时禁用全局处理器
  });

  // 组导航逻辑
  const enableGroupNavigation = isCompareMode || groupBrowseMode;
  const { totalGroups, scrollToGroup } = useGroupNavigation({
    enableGroupNavigation,
    folderMap,
    displayPhotos,
    compareColumns,
    virtualGridRef,
    setSelectedPhotoId,
    scrollToPhoto,
  });

  // 预览关闭处理
  const handlePreviewClose = usePreviewCloseHandler({
    enableGroupNavigation,
    currentPreviewGroupIndex,
    displayPhotos,
    compareColumns,
    virtualGridRef,
    setSelectedPhotoId,
    closePreview,
    clearSelection,
    scrollToGroup,
  });

  // 检测是否有分类数据但缺少图片文件
  const hasDataButNoImages = photos.length > 0 && photos.every(p => !p.file && !p.thumbnailUrl);

  // 空状态
  if (photos.length === 0 || hasDataButNoImages) {
    return (
      <div className="h-screen flex flex-col bg-[#e0e5ec]">
        <Toast toasts={toasts} onClose={closeToast} />
        <Toolbar toast={{ success, error, warning, info }} />
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
          <CompareModePanel
            isCompareMode={isCompareMode}
            compareColumns={compareColumns}
            selectedFolders={selectedFolders}
          />

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
              const photosToPreview = displayPhotos.filter(p =>
                p && selectedPhotos.includes(p.id)
              );
              if (isCompareMode && selectedPhotos.length > 0) {
                const firstSelectedIndex = displayPhotos.findIndex(p =>
                  p && selectedPhotos.includes(p.id)
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
        isCompareMode={isCompareMode}
        displayPhotos={displayPhotos}
        compareColumns={compareColumns}
        allPhotos={photos}
        onDelete={deletePhoto}
      />

      {/* 大图预览 */}
      {previewPhotos && (
        <LightboxPreview
          photos={previewPhotos}
          initialIndex={0}
          onClose={handlePreviewClose}
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
