import { useState, useCallback, useMemo } from 'react';
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
import { devLog } from './utils/devLog';
import { ANIMATION } from './constants';

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

  // 计算总组数 - 基于第一个文件夹的图片数量
  const enableGroupNavigation = isCompareMode || groupBrowseMode;
  const totalGroups = useMemo(() => {
    if (!enableGroupNavigation) return 0;

    // 获取第一个文件夹的图片数量
    const folderPaths = Object.keys(folderMap).sort();
    if (folderPaths.length === 0) return 0;

    const firstFolderPath = folderPaths[0];
    const firstFolderPhotos = folderMap[firstFolderPath] || [];
    return firstFolderPhotos.length;
  }, [enableGroupNavigation, folderMap]);

  // 自动检索组跳转：根据输入的组号，找到第一个文件夹的第N张图片，并跳转到该图片在主列表中的位置
  const scrollToGroup = useCallback(
    (photoNumber) => {
      // photoNumber 是用户输入的图片序号(从0开始)

      if (!enableGroupNavigation) {
        console.warn('⚠️ 组导航未启用');
        return;
      }

      // 1. 获取第一个文件夹
      const folderPaths = Object.keys(folderMap).sort();
      if (folderPaths.length === 0) {
        console.error('❌ 没有找到文件夹');
        return;
      }

      const firstFolderPath = folderPaths[0];
      const firstFolderPhotos = folderMap[firstFolderPath] || [];

      devLog('📁 第一个文件夹:', firstFolderPath, '共', firstFolderPhotos.length, '张图片');

      // 2. 检查图片序号是否有效
      if (photoNumber < 0 || photoNumber >= firstFolderPhotos.length) {
        console.warn('⚠️ 图片序号越界:', photoNumber + 1, '/', firstFolderPhotos.length);
        alert(`第一个文件夹只有 ${firstFolderPhotos.length} 张图片，请输入 1-${firstFolderPhotos.length} 之间的数字`);
        return;
      }

      // 3. 获取第N张图片
      const targetPhoto = firstFolderPhotos[photoNumber];
      if (!targetPhoto) {
        console.error('❌ 未找到目标图片');
        return;
      }

      devLog('🎯 目标图片:', targetPhoto.name, '(第一个文件夹的第', photoNumber + 1, '张)');

      // 4. 在 displayPhotos 中找到该图片的索引
      const photoIndexInDisplay = displayPhotos.findIndex(p => p && p.id === targetPhoto.id);
      if (photoIndexInDisplay < 0) {
        console.error('❌ 目标图片不在当前显示列表中(可能被过滤)');
        alert(`图片 "${targetPhoto.name}" 不在当前显示列表中，可能被分类过滤隐藏了`);
        return;
      }

      devLog('📍 图片在主列表中的位置:', photoIndexInDisplay + 1, '/', displayPhotos.length);

      // 5. 滚动到该图片
      if (!virtualGridRef) {
        console.warn('⚠️ virtualGridRef 未初始化，稍后重试...');
        setTimeout(() => scrollToGroup(photoNumber), 200);
        return;
      }

      try {
        if (typeof virtualGridRef.scrollToCell !== 'function') {
          console.error('❌ scrollToCell 方法不存在');
          return;
        }

        const rowIndex = Math.floor(photoIndexInDisplay / compareColumns);
        const columnIndex = photoIndexInDisplay % compareColumns;

        virtualGridRef.scrollToCell({
          rowIndex,
          columnIndex,
          rowAlign: 'center',
          columnAlign: 'center',
          behavior: 'smooth',
        });

        devLog('✓ 滚动到行', rowIndex, '列', columnIndex);

        // 选中该图片
        setTimeout(() => {
          setSelectedPhotoId(targetPhoto.id);
          devLog('✓ 已选中图片:', targetPhoto.name);
        }, 300);
      } catch (error) {
        console.error('❌ 滚动失败:', error);
        // 回退方案
        scrollToPhoto(targetPhoto.id, {
          behavior: 'smooth',
          block: 'center',
        });
      }
    },
    [enableGroupNavigation, folderMap, displayPhotos, compareColumns, virtualGridRef, setSelectedPhotoId, scrollToPhoto]
  );


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
          onClose={(lastViewedPhotoId) => {
            devLog('📥 App收到关闭请求，照片ID:', lastViewedPhotoId);

            // 关闭预览并清除选择
            closePreview();
            clearSelection();

            // 关闭预览后滚动到组的位置
            if (enableGroupNavigation && currentPreviewGroupIndex >= 0) {
              // 对比模式或分组浏览模式：滚动到组的位置
              devLog('📍 关闭预览，跳转到组:', currentPreviewGroupIndex);
              setTimeout(() => scrollToGroup(currentPreviewGroupIndex), ANIMATION.TRANSITION_DELAY);
            } else if (lastViewedPhotoId) {
              // 普通模式：滚动到具体照片
              const finalPhoto = displayPhotos.find(p => p && p.id === lastViewedPhotoId);
              if (finalPhoto) {
                setTimeout(() => {
                  const photoIndex = displayPhotos.findIndex(p => p && p.id === finalPhoto.id);

                  if (photoIndex >= 0 && virtualGridRef?.scrollToCell) {
                    const rowIndex = Math.floor(photoIndex / compareColumns);
                    const columnIndex = photoIndex % compareColumns;

                    devLog('📍 关闭预览，跳转到照片:', finalPhoto.id, '位置:', rowIndex, columnIndex);

                    virtualGridRef.scrollToCell({
                      rowIndex,
                      columnIndex,
                      rowAlign: 'center',
                      columnAlign: 'center',
                      behavior: 'smooth',
                    });

                    setTimeout(() => setSelectedPhotoId(finalPhoto.id), ANIMATION.SELECT_AFTER_SCROLL_DELAY);
                  } else {
                    // 备用方案：直接选中照片
                    setSelectedPhotoId(finalPhoto.id);
                  }
                }, ANIMATION.TRANSITION_DELAY);
              }
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
