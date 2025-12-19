import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import usePhotoStore from './store/usePhotoStore';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import FolderPanel from './components/FolderPanel';
import LightboxPreview from './components/LightboxPreview';
import { getFileFormat, getFormatBadgeColor } from './utils/imageUtils';

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
  const [previewPhotos, setPreviewPhotos] = useState(null); // 预览的图片列表
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖放
  const [objectUrls, setObjectUrls] = useState(new Map()); // 管理 Object URLs 生命周期
  const [contextMenu, setContextMenu] = useState(null); // 右键菜单状态 { x, y, photoId }
  const [currentPreviewGroupIndex, setCurrentPreviewGroupIndex] = useState(0); // 当前预览的组索引
  const [jumpToGroup, setJumpToGroup] = useState(''); // 跳转到指定组的输入框

  // 是否为对比模式 (2-8个文件夹)
  const isCompareMode = selectedFolders.length >= 2 && selectedFolders.length <= 8;
  const compareColumns = isCompareMode ? selectedFolders.length : columns;

  // 计算总组数
  const totalGroups = isCompareMode
    ? Math.ceil(displayPhotosWithUrls.length / compareColumns)
    : 0;

  // 滚动到指定组
  const scrollToGroup = useCallback((groupIndex) => {
    if (!isCompareMode || groupIndex < 0 || groupIndex >= totalGroups) return;

    const container = document.getElementById('photo-container');
    if (!container) return;

    // 计算该组第一张图片的索引
    const photoIndex = groupIndex * compareColumns;
    const photoElements = container.querySelectorAll('.photo-item');

    if (photoElements[photoIndex]) {
      photoElements[photoIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [isCompareMode, totalGroups, compareColumns]);

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

  // 对比模式下的图片排列 - 按选择顺序排列
  const displayPhotos = useMemo(() => {
    if (isCompareMode) {
      // 利用双重保险机制确保找到所有图片
      const folderPhotoGroups = selectedFolders.map((folderPath) => {
        const photosInFolder = [];
        const photoIdSet = new Set(); // 用于去重

        // 标准化路径（统一分隔符）
        const normalizedFolderPath = folderPath.replace(/\\/g, '/');

        // 方法1: 直接从 folderMap 精确查找（最快）
        if (folderMap[folderPath]) {
          folderMap[folderPath].forEach(photo => {
            photoIdSet.add(photo.id);
            photosInFolder.push(photo);
          });
        }

        // 方法2: 遍历所有照片，确保不遗漏（兜底方案）
        // 即使方法1找到了图片，也执行方法2以防 folderMap 不完整
        photos.forEach(photo => {
          if (photoIdSet.has(photo.id)) return; // 已经添加过，跳过

          const photoFolder = photo.path.split('/').slice(0, -1).join('/');
          const normalizedPhotoFolder = photoFolder.replace(/\\/g, '/');

          // 精确匹配或子文件夹匹配（不区分大小写）
          if (normalizedPhotoFolder.toLowerCase() === normalizedFolderPath.toLowerCase() ||
              normalizedPhotoFolder.toLowerCase().startsWith(normalizedFolderPath.toLowerCase() + '/')) {
            photoIdSet.add(photo.id);
            photosInFolder.push(photo);
          }
        });

        // 应用过滤器
        const filtered = photosInFolder.filter(p => {
          if (filter.category && p.category !== filter.category) return false;
          return true;
        });

        // 按文件名排序
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      });

      // 辅助函数：获取不含扩展名的文件名
      const getBaseName = (filename) => {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(0, lastDot) : filename;
      };

      // 使用第一个文件夹的图片顺序作为基准
      const baseGroup = folderPhotoGroups[0] || [];
      const baseNames = baseGroup.map(p => getBaseName(p.name));

      // 收集其他文件夹中的额外文件名（忽略扩展名）
      const additionalNames = new Set();
      folderPhotoGroups.slice(1).forEach((group) => {
        group.forEach(p => {
          const baseName = getBaseName(p.name);
          if (!baseNames.includes(baseName)) {
            additionalNames.add(baseName);
          }
        });
      });

      // 最终顺序：基准文件夹的顺序 + 其他文件夹的额外图片
      const orderedBaseNames = [...baseNames, ...Array.from(additionalNames).sort()];

      // 构建对比列表 - 按照选定的顺序对齐（忽略扩展名匹配）
      const alignedPhotos = [];

      orderedBaseNames.forEach(baseName => {
        folderPhotoGroups.forEach((group) => {
          const photo = group.find(p => getBaseName(p.name) === baseName);
          alignedPhotos.push(photo || null); // null 作为占位符
        });
      });

      // 分页
      return alignedPhotos.slice(0, displayCount * compareColumns);
    } else {
      return filteredPhotos.slice(0, displayCount);
    }
  }, [isCompareMode, selectedFolders, folderMap, filter, filteredPhotos, displayCount, compareColumns]);

  // 管理 Object URLs 生命周期 - 基于全部照片，而非当前显示的照片
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setObjectUrls(prevUrls => {
      const newUrls = new Map(prevUrls);
      const allPhotoIds = new Set(photos.map(p => p.id));

      // 为所有需要的照片创建 URL
      displayPhotos.forEach(photo => {
        if (photo && photo.file && !newUrls.has(photo.id)) {
          const url = URL.createObjectURL(photo.file);
          newUrls.set(photo.id, url);
        }
      });

      // 只清理已经从 photos 数组中删除的 URL
      const idsToRemove = [];
      newUrls.forEach((url, id) => {
        if (!allPhotoIds.has(id)) {
          URL.revokeObjectURL(url);
          idsToRemove.push(id);
        }
      });
      idsToRemove.forEach(id => newUrls.delete(id));

      return newUrls;
    });
  }, [displayPhotos, photos]);

  // 组件卸载时清理所有 URLs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // 为显示的图片附加 URL - 优化：避免创建新对象，直接使用原对象
  const displayPhotosWithUrls = useMemo(() => {
    return displayPhotos.map(photo => {
      if (!photo) return null;
      // 如果已经有 thumbnailUrl，直接返回原对象
      if (photo.thumbnailUrl) {
        return photo;
      }

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
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
                    setPreviewPhotos(photosToPreview);
                  } else {
                    // 否则预览当前组（对比模式下通常是一行）
                    const rowStartIdx = Math.floor(idx / compareColumns) * compareColumns;
                    const rowPhotos = displayPhotosWithUrls.slice(rowStartIdx, rowStartIdx + compareColumns);
                    setPreviewPhotos(rowPhotos);
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
                <div key={photo.id} className={`photo-item neu-card rounded-2xl overflow-hidden ${isBoxSelected ? 'ring-4 ring-blue-500' : ''}`}>
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
                    // 包含真实图片和占位符
                    const photosToPreview = displayPhotosWithUrls.filter((p, i) =>
                      p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
                    );
                    // 保存第一个选中项的组索引
                    if (isCompareMode && selectedPhotos.length > 0) {
                      const firstSelectedIndex = displayPhotosWithUrls.findIndex((p, i) =>
                        p ? selectedPhotos.includes(p.id) : selectedPhotos.includes(`placeholder-${i}`)
                      );
                      if (firstSelectedIndex >= 0) {
                        const groupIndex = Math.floor(firstSelectedIndex / compareColumns);
                        setCurrentPreviewGroupIndex(groupIndex);
                      }
                    }
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

      <StatusBar
        isCompareMode={isCompareMode}
        totalGroups={totalGroups}
        jumpToGroup={jumpToGroup}
        onJumpToGroupChange={setJumpToGroup}
        onJumpToGroup={scrollToGroup}
      />

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
            // 对比模式下，关闭预览后滚动到之前的组位置
            if (isCompareMode && currentPreviewGroupIndex >= 0) {
              setTimeout(() => scrollToGroup(currentPreviewGroupIndex), 100);
            }
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
