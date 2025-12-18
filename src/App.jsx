import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import usePhotoStore from './store/usePhotoStore';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import FolderPanel from './components/FolderPanel';
import LightboxPreview from './components/LightboxPreview';

function App() {
  const photos = usePhotoStore((state) => state.photos);
  const folderMap = usePhotoStore((state) => state.folderMap);
  const columns = usePhotoStore((state) => state.columns);
  const setCategory = usePhotoStore((state) => state.setCategory);
  const setCategoryBatch = usePhotoStore((state) => state.setCategoryBatch);
  const selectedPhotoId = usePhotoStore((state) => state.selectedPhotoId);
  const setSelectedPhotoId = usePhotoStore((state) => state.setSelectedPhotoId);

  const [displayCount, setDisplayCount] = useState(100);
  const [filter, setFilter] = useState({ category: null, folders: [] }); // 简化：用对象代替函数
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // 框选的图片
  const [isSelecting, setIsSelecting] = useState(false); // 是否处于框选模式
  const [previewPhotos, setPreviewPhotos] = useState(null); // 预览的图片列表
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖放
  const [objectUrls, setObjectUrls] = useState(new Map()); // 管理 Object URLs 生命周期
  const [contextMenu, setContextMenu] = useState(null); // 右键菜单状态 { x, y, photoId }

  // 是否为对比模式 (2-8个文件夹)
  const isCompareMode = selectedFolders.length >= 2 && selectedFolders.length <= 8;
  const compareColumns = isCompareMode ? selectedFolders.length : columns;

  // 过滤后的图片列表 - 简化：直接在这里过滤，不存函数
  const filteredPhotos = useMemo(() => {
    return photos.filter(p => {
      if (filter.category && p.category !== filter.category) return false;
      if (filter.folders && filter.folders.length > 0) {
        const photoFolder = p.path.split('/').slice(0, -1).join('/');
        if (!filter.folders.some(f => photoFolder.startsWith(f))) return false;
      }
      return true;
    });
  }, [photos, filter]);

  // 对比模式下的图片排列 - 优化：利用 folderMap，减少遍历
  const displayPhotos = useMemo(() => {
    if (isCompareMode) {
      // 利用 folderMap 快速查找，避免 O(n²) 遍历
      const folderPhotoGroups = selectedFolders.map(folderPath => {
        const photosInFolder = [];
        // 查找该文件夹及其子文件夹的所有图片
        Object.keys(folderMap).forEach(mapFolder => {
          if (mapFolder.startsWith(folderPath)) {
            photosInFolder.push(...folderMap[mapFolder]);
          }
        });
        // 应用过滤器
        const filtered = photosInFolder.filter(p => {
          if (filter.category && p.category !== filter.category) return false;
          return true;
        });
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      });

      // 收集所有文件名
      const allNames = new Set();
      folderPhotoGroups.forEach(group => {
        group.forEach(p => allNames.add(p.name));
      });
      const sortedNames = Array.from(allNames).sort();

      // 构建对比列表 - 每个文件名在所有文件夹中对齐
      const alignedPhotos = [];
      sortedNames.forEach(name => {
        folderPhotoGroups.forEach(group => {
          const photo = group.find(p => p.name === name);
          alignedPhotos.push(photo || null); // null 作为占位符
        });
      });

      // 分页
      return alignedPhotos.slice(0, displayCount * compareColumns);
    } else {
      return filteredPhotos.slice(0, displayCount);
    }
  }, [isCompareMode, selectedFolders, folderMap, filter, filteredPhotos, displayCount, compareColumns]);

  // 管理 Object URLs 生命周期 - 修复内存泄漏
  useEffect(() => {
    const newUrls = new Map();

    displayPhotos.forEach(photo => {
      if (photo && !photo.thumbnailUrl && photo.file) {
        const url = URL.createObjectURL(photo.file);
        newUrls.set(photo.id, url);
      }
    });

    setObjectUrls(prevUrls => {
      // 清理旧的 URLs
      prevUrls.forEach((url, id) => {
        if (!newUrls.has(id)) {
          URL.revokeObjectURL(url);
        }
      });
      return newUrls;
    });

    // 组件卸载时清理所有 URLs
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [displayPhotos]);

  // 为显示的图片附加 URL - 优化：避免创建新对象，直接使用原对象
  const displayPhotosWithUrls = useMemo(() => {
    return displayPhotos.map(photo => {
      if (!photo) return null;
      // 如果已经有 thumbnailUrl，直接返回原对象
      if (photo.thumbnailUrl) return photo;

      const url = objectUrls.get(photo.id);
      if (url) {
        // 只在需要时创建新对象
        return { ...photo, thumbnailUrl: url };
      }
      return photo;
    });
  }, [displayPhotos, objectUrls]);

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
  }, [filter]);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // 拖放处理 - 简化：合并事件监听器
  useEffect(() => {
    const dragHandlers = {
      dragenter: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      dragover: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      dragleave: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === document.body || e.target === document.documentElement) {
          setIsDragging(false);
        }
      },
      drop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const importEvent = new CustomEvent('dropFolder', { detail: e.dataTransfer });
        window.dispatchEvent(importEvent);
      }
    };

    // 批量注册
    Object.entries(dragHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });

    // 批量清理
    return () => {
      Object.entries(dragHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, []);

  // 使用 ref 存储最新状态，避免频繁重建监听器
  const selectedPhotosRef = useRef(selectedPhotos);
  const selectedPhotoIdRef = useRef(selectedPhotoId);
  const filteredPhotosRef = useRef(filteredPhotos);

  useEffect(() => {
    selectedPhotosRef.current = selectedPhotos;
  }, [selectedPhotos]);

  useEffect(() => {
    selectedPhotoIdRef.current = selectedPhotoId;
  }, [selectedPhotoId]);

  useEffect(() => {
    filteredPhotosRef.current = filteredPhotos;
  }, [filteredPhotos]);

  // 稳定的导航函数
  const moveToNext = useCallback(() => {
    const currentId = selectedPhotoIdRef.current;
    const photos = filteredPhotosRef.current;
    if (!currentId || photos.length === 0) return;
    const idx = photos.findIndex(p => p.id === currentId);
    if (idx < photos.length - 1) setSelectedPhotoId(photos[idx + 1].id);
  }, [setSelectedPhotoId]);

  const moveToPrev = useCallback(() => {
    const currentId = selectedPhotoIdRef.current;
    const photos = filteredPhotosRef.current;
    if (!currentId || photos.length === 0) return;
    const idx = photos.findIndex(p => p.id === currentId);
    if (idx > 0) setSelectedPhotoId(photos[idx - 1].id);
  }, [setSelectedPhotoId]);

  // 键盘快捷键 - 极速打标模式（响应优化版）
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 防止干扰表单输入
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 使用 ref 获取最新状态
      const currentSelectedPhotos = selectedPhotosRef.current;
      const currentSelectedPhotoId = selectedPhotoIdRef.current;
      const currentFilteredPhotos = filteredPhotosRef.current;

      // 极速打标：如果有框选的图片，给所有框选图片打标签
      const targetPhotos = currentSelectedPhotos.length > 0
        ? currentSelectedPhotos
        : (currentSelectedPhotoId ? [currentSelectedPhotoId] : []);

      if (targetPhotos.length === 0 && currentFilteredPhotos.length > 0) {
        // 如果没有选中任何图片，默认选中第一张
        const firstId = currentFilteredPhotos[0].id;
        setSelectedPhotoId(firstId);
        return;
      }

      if (targetPhotos.length === 0) return;

      // 批量打标签 - 使用批量更新方法优化性能
      const batchSetCategory = (category) => {
        e.preventDefault();

        // 性能优化：批量更新而不是循环调用
        if (targetPhotos.length > 1) {
          setCategoryBatch(targetPhotos, category);
        } else {
          setCategory(targetPhotos[0], category);
        }

        // 清除框选
        if (currentSelectedPhotos.length > 0) {
          setSelectedPhotos([]);
        }

        // 如果是单张图片，移动到下一张
        if (targetPhotos.length === 1) {
          moveToNext();
        }
      };

      if (e.key === '1') {
        batchSetCategory('correct');
      } else if (e.key === '2') {
        batchSetCategory('medium');
      } else if (e.key === '3') {
        batchSetCategory('wrong');
      } else if (e.key === '0' || e.key === 'x' || e.key === 'X') {
        batchSetCategory(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveToNext();
      }
    };

    // 监听器只设置一次，不会频繁重建
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [setCategory, setCategoryBatch, setSelectedPhotoId, setSelectedPhotos, moveToNext, moveToPrev]);

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
      <Toolbar />

      {/* 拖放蒙层 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="neu-card p-12 rounded-3xl shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <div className="text-2xl font-bold text-gray-800 mb-2">松开鼠标导入文件夹</div>
              <div className="text-sm text-gray-500">支持拖入包含图片的文件夹</div>
            </div>
          </div>
        </div>
      )}

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
                  ? displayPhotosWithUrls.filter(p => p && selectedPhotos.includes(p.id))
                  : [photo];
                setPreviewPhotos(photosToPreview);
              };

              const handleContextMenu = (e) => {
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  photoId: photo.id
                });
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
                    onContextMenu={handleContextMenu}
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
                    const photosToPreview = displayPhotosWithUrls.filter(p => p && selectedPhotos.includes(p.id));
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

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 neu-card rounded-xl overflow-hidden shadow-2xl"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-2 min-w-[180px]">
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, 'correct');
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-green-50 transition-colors flex items-center gap-3"
            >
              <span className="text-green-600 font-bold text-lg">✓</span>
              <span className="text-gray-700">正确</span>
              <span className="ml-auto text-xs text-gray-400">1</span>
            </button>
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, 'medium');
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-yellow-50 transition-colors flex items-center gap-3"
            >
              <span className="text-yellow-600 font-bold text-lg">~</span>
              <span className="text-gray-700">中等</span>
              <span className="ml-auto text-xs text-gray-400">2</span>
            </button>
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, 'wrong');
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
            >
              <span className="text-red-600 font-bold text-lg">✕</span>
              <span className="text-gray-700">错误</span>
              <span className="ml-auto text-xs text-gray-400">3</span>
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, null);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-400 font-bold text-lg">○</span>
              <span className="text-gray-500">取消标签</span>
              <span className="ml-auto text-xs text-gray-400">X</span>
            </button>
          </div>
        </div>
      )}

      {/* 大图预览 */}
      {previewPhotos && (
        <LightboxPreview
          photos={previewPhotos}
          initialIndex={0}
          onClose={() => {
            setPreviewPhotos(null);
            setSelectedPhotos([]);
          }}
          allPhotos={displayPhotosWithUrls}
          onGroupChange={(newGroupPhotos) => {
            setPreviewPhotos(newGroupPhotos);
          }}
        />
      )}
    </div>
  );
}

export default App;
