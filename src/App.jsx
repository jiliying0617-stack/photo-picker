import { useEffect, useState } from 'react';
import usePhotoStore from './store/usePhotoStore';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import FolderPanel from './components/FolderPanel';
import LightboxPreview from './components/LightboxPreview';

function App() {
  const photos = usePhotoStore((state) => state.photos);
  const columns = usePhotoStore((state) => state.columns);
  const setCategory = usePhotoStore((state) => state.setCategory);
  const selectedPhotoId = usePhotoStore((state) => state.selectedPhotoId);
  const setSelectedPhotoId = usePhotoStore((state) => state.setSelectedPhotoId);
  const loadPhotos = usePhotoStore((state) => state.loadPhotos);
  const isLoading = usePhotoStore((state) => state.isLoading);

  const [displayCount, setDisplayCount] = useState(100);
  const [filterFn, setFilterFn] = useState(() => null);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // 框选的图片
  const [isSelecting, setIsSelecting] = useState(false); // 是否处于框选模式
  const [previewPhotos, setPreviewPhotos] = useState(null); // 预览的图片列表

  // 启动时从 IndexedDB 加载图片
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // 是否为对比模式 (2-8个文件夹)
  const isCompareMode = selectedFolders.length >= 2 && selectedFolders.length <= 8;
  const compareColumns = isCompareMode ? selectedFolders.length : columns;

  // 过滤后的图片列表
  const filteredPhotos = filterFn ? photos.filter(filterFn) : photos;

  // 对比模式下的图片排列
  let displayPhotos;
  if (isCompareMode) {
    // 按文件夹分组
    const folderPhotoGroups = selectedFolders.map(folderPath =>
      filteredPhotos.filter(p => {
        const pathParts = p.path.split('/');
        pathParts.pop();
        const photoFolderPath = pathParts.join('/');
        return photoFolderPath.startsWith(folderPath);
      }).sort((a, b) => a.name.localeCompare(b.name))
    );

    // 收集所有文件名
    const allNames = new Set();
    folderPhotoGroups.forEach(group => {
      group.forEach(p => allNames.add(p.name));
    });
    const sortedNames = Array.from(allNames).sort();

    // 构建对比列表 - 每个文件名在所有文件夹中对齐
    displayPhotos = [];
    sortedNames.forEach(name => {
      folderPhotoGroups.forEach(group => {
        const photo = group.find(p => p.name === name);
        if (photo) {
          displayPhotos.push(photo);
        } else {
          // 占位符 - 该文件夹没有这个文件
          displayPhotos.push(null);
        }
      });
    });

    // 过滤掉占位符并分页
    displayPhotos = displayPhotos.slice(0, displayCount * compareColumns);
  } else {
    displayPhotos = filteredPhotos.slice(0, displayCount);
  }

  // 滚动加载更多
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 500) {
        setDisplayCount(prev => Math.min(prev + 50, filteredPhotos.length));
      }
    };

    const container = document.getElementById('photo-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [filteredPhotos.length]);

  // 当过滤变化时重置显示数量
  useEffect(() => {
    setDisplayCount(100);
  }, [filterFn]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      let targetPhotoId = selectedPhotoId;
      if (!targetPhotoId && filteredPhotos.length > 0) {
        targetPhotoId = filteredPhotos[0].id;
        setSelectedPhotoId(targetPhotoId);
      }

      if (!targetPhotoId) return;

      if (e.key === '1') {
        e.preventDefault();
        setCategory(targetPhotoId, 'correct');
        moveToNext();
      } else if (e.key === '2') {
        e.preventDefault();
        setCategory(targetPhotoId, 'medium');
        moveToNext();
      } else if (e.key === '3') {
        e.preventDefault();
        setCategory(targetPhotoId, 'wrong');
        moveToNext();
      } else if (e.key === '0') {
        e.preventDefault();
        setCategory(targetPhotoId, null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveToNext();
      }
    };

    const moveToNext = () => {
      if (!selectedPhotoId || filteredPhotos.length === 0) return;
      const idx = filteredPhotos.findIndex(p => p.id === selectedPhotoId);
      if (idx < filteredPhotos.length - 1) setSelectedPhotoId(filteredPhotos[idx + 1].id);
    };

    const moveToPrev = () => {
      if (!selectedPhotoId || filteredPhotos.length === 0) return;
      const idx = filteredPhotos.findIndex(p => p.id === selectedPhotoId);
      if (idx > 0) setSelectedPhotoId(filteredPhotos[idx - 1].id);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, filteredPhotos, setCategory, setSelectedPhotoId]);

  // 检测是否有分类数据但缺少图片文件
  const hasDataButNoImages = photos.length > 0 && photos.every(p => !p.thumbnailUrl);

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
                <div className="text-sm text-gray-400">点击上方 "导入文件夹" 开始挑图</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#e0e5ec]">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文件夹面板 */}
        <FolderPanel
          onFilterChange={setFilterFn}
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
            {displayPhotos.map((photo, idx) => {
              // 处理占位符
              if (!photo) {
                return (
                  <div key={`placeholder-${idx}`} className="neu-concave rounded-2xl overflow-hidden opacity-30">
                    <div className="aspect-square flex items-center justify-center">
                      <div className="text-gray-400 text-sm">无此文件</div>
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

              const handlePhotoClick = (e) => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                  // 框选模式
                  e.preventDefault();
                  setIsSelecting(true);
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
                  ? displayPhotos.filter(p => p && selectedPhotos.includes(p.id))
                  : [photo];
                setPreviewPhotos(photosToPreview);
              };

              return (
                <div key={photo.id} className={`neu-card rounded-2xl overflow-hidden ${isBoxSelected ? 'ring-4 ring-blue-500' : ''}`}>
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
                    className={`
                      relative group cursor-pointer
                      transition-all duration-200
                      ${isSelected ? 'scale-95' : 'hover:scale-105'}
                    `}
                  >
                    <div className="aspect-square neu-concave rounded-xl overflow-hidden">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>

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

          {displayCount < filteredPhotos.length && (
            <div className="text-center py-8 text-gray-400 text-sm">
              显示 {displayCount} / {filteredPhotos.length} 张 · 继续滚动加载更多...
            </div>
          )}

          {/* 框选提示 */}
          {selectedPhotos.length > 0 && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 neu-card p-4 rounded-xl shadow-2xl z-40">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-700">
                  已选择 {selectedPhotos.length} 张图片
                </div>
                <button
                  onClick={() => {
                    const photosToPreview = displayPhotos.filter(p => p && selectedPhotos.includes(p.id));
                    setPreviewPhotos(photosToPreview);
                  }}
                  className="px-4 py-2 neu-button rounded-lg text-blue-600 text-sm font-medium"
                >
                  大图对比
                </button>
                <button
                  onClick={() => setSelectedPhotos([])}
                  className="px-4 py-2 neu-button rounded-lg text-red-600 text-sm font-medium"
                >
                  清除选择
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusBar />

      {/* 大图预览 */}
      {previewPhotos && (
        <LightboxPreview
          photos={previewPhotos}
          initialIndex={0}
          onClose={() => {
            setPreviewPhotos(null);
            setSelectedPhotos([]);
          }}
        />
      )}
    </div>
  );
}

export default App;
