import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import usePhotoStore from '../store/usePhotoStore';

const LightboxPreview = memo(function LightboxPreview({ photos, onClose, allPhotos, onGroupChange }) {
  const [scale, setScale] = useState(1); // 图片缩放比例
  const [pan, setPan] = useState({ x: 0, y: 0 }); // 图片平移位置
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [flashMessage, setFlashMessage] = useState(null); // 标签切换提示
  const [contextMenu, setContextMenu] = useState(null); // 右键菜单 { x, y, photoId }
  const [overlayPairIndex, setOverlayPairIndex] = useState(-1); // 叠图对比模式：-1表示关闭，>=0表示当前对比对的索引
  const setCategory = usePhotoStore((state) => state.setCategory);
  const storePhotos = usePhotoStore((state) => state.photos); // 获取实时分类状态

  // 延迟创建所有照片的缩略图 URL (只在 Lightbox 打开时创建)
  const photosWithUrls = useMemo(() => {
    const urls = [];
    const result = photos.map(photo => {
      // 处理占位符 (null)
      if (!photo) {
        return null;
      }

      if (photo.thumbnailUrl) {
        return photo;
      }
      if (photo.file) {
        const url = URL.createObjectURL(photo.file);
        urls.push(url);
        return {
          ...photo,
          thumbnailUrl: url
        };
      }
      return photo;
    });

    // 清理函数
    return {
      photos: result,
      cleanup: () => urls.forEach(url => URL.revokeObjectURL(url))
    };
  }, [photos]);

  // 组件卸载或 photos 改变时清理 URLs
  useEffect(() => {
    return () => {
      if (photosWithUrls.cleanup) {
        photosWithUrls.cleanup();
      }
    };
  }, [photosWithUrls]);

  // 计算当前组在所有图片中的位置
  // 重要：不过滤 null，保持占位符，确保每组大小固定
  const photosPerGroup = photosWithUrls.photos.length;
  const firstRealPhoto = photosWithUrls.photos.find(p => p);
  const currentGroupIndex = allPhotos && firstRealPhoto ? Math.floor(allPhotos.findIndex(p => p && p.id === firstRealPhoto.id) / photosPerGroup) : 0;
  const totalGroups = allPhotos ? Math.ceil(allPhotos.length / photosPerGroup) : 1;

  // 性能优化: 使用 ref 存储所有图片元素和当前位置
  const imagesRef = useRef([]);
  const panRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // 同步 pan 状态到 ref
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // 切换到下一组
  // 重要：不过滤 null，保持占位符，严格按组顺序切换
  const handleNextGroup = useCallback(() => {
    if (!allPhotos || !onGroupChange) return;

    const nextGroupStartIndex = (currentGroupIndex + 1) * photosPerGroup;
    if (nextGroupStartIndex < allPhotos.length) {
      // 不过滤 null，直接切片，保持占位符
      const nextGroupPhotos = allPhotos.slice(nextGroupStartIndex, nextGroupStartIndex + photosPerGroup);
      onGroupChange(nextGroupPhotos);
    }
  }, [allPhotos, onGroupChange, currentGroupIndex, photosPerGroup]);

  // 切换到上一组
  // 重要：不过滤 null，保持占位符，严格按组顺序切换
  const handlePrevGroup = useCallback(() => {
    if (!allPhotos || !onGroupChange) return;

    if (currentGroupIndex > 0) {
      const prevGroupStartIndex = (currentGroupIndex - 1) * photosPerGroup;
      // 不过滤 null，直接切片，保持占位符
      const prevGroupPhotos = allPhotos.slice(prevGroupStartIndex, prevGroupStartIndex + photosPerGroup);
      onGroupChange(prevGroupPhotos);
    }
  }, [allPhotos, onGroupChange, currentGroupIndex, photosPerGroup]);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // 批量设置分类
  const handleCategoryAll = useCallback((category) => {
    photos.forEach(photo => {
      setCategory(photo.id, category);
    });

    // 显示视觉反馈
    const messages = {
      correct: { text: '✓ 已标记为正确', color: 'bg-green-600' },
      medium: { text: '~ 已标记为适中', color: 'bg-yellow-600' },
      wrong: { text: '✕ 已标记为错误', color: 'bg-red-600' },
      null: { text: '已清除标记', color: 'bg-gray-600' }
    };

    const message = messages[category];
    if (message) {
      setFlashMessage(message);
      setTimeout(() => setFlashMessage(null), 1500); // 1.5秒后消失
    }
  }, [photos, setCategory]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevGroup();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextGroup();
      } else if (e.key === '1') {
        e.preventDefault();
        handleCategoryAll('correct');
      } else if (e.key === '2') {
        e.preventDefault();
        handleCategoryAll('medium');
      } else if (e.key === '3') {
        e.preventDefault();
        handleCategoryAll('wrong');
      } else if (e.key === '0' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleCategoryAll(null);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setScale(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key === 'q' || e.key === 'Q') {
        // Q键按下时已在keydown单独处理，这里不做处理
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNextGroup, handlePrevGroup, handleCategoryAll, contextMenu, photosWithUrls.photos]);

  // Q键按住/松开对比功能
  useEffect(() => {
    let isQPressed = false;

    const handleQKeyDown = (e) => {
      if ((e.key === 'q' || e.key === 'Q') && !isQPressed) {
        e.preventDefault();
        isQPressed = true;

        // 计算真实照片总数（过滤null）
        const realPhotos = photosWithUrls.photos.filter(p => p);

        if (realPhotos.length < 2) {
          // 少于2张照片，无法对比
          setFlashMessage({
            text: '至少需要2张照片才能对比',
            color: 'bg-red-600'
          });
          setTimeout(() => setFlashMessage(null), 1500);
          return;
        }

        // 按下Q键，开启对比模式（第1张 vs 最后1张）
        setOverlayPairIndex(0);
        const leftIdx = 0;
        const rightIdx = realPhotos.length - 1;
        setFlashMessage({
          text: `🔀 按住Q对比：第 ${leftIdx + 1} 张 vs 第 ${rightIdx + 1} 张`,
          color: 'bg-purple-600'
        });
      }
    };

    const handleQKeyUp = (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        isQPressed = false;

        // 松开Q键，退出对比模式
        setOverlayPairIndex(-1);
        setFlashMessage(null);
      }
    };

    window.addEventListener('keydown', handleQKeyDown);
    window.addEventListener('keyup', handleQKeyUp);

    return () => {
      window.removeEventListener('keydown', handleQKeyDown);
      window.removeEventListener('keyup', handleQKeyUp);
    };
  }, [photosWithUrls.photos]);

  // 鼠标滚轮缩放
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.3 : 0.3; // 增大缩放步长
      setScale(prev => Math.max(0.5, Math.min(20, prev + delta))); // 最大放大到 20 倍
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // 直接更新所有图片的 transform (绕过 React 渲染)
  const updateAllImagesTransform = useCallback((x, y, currentScale) => {
    imagesRef.current.forEach(img => {
      if (img) {
        img.style.transform = `scale(${currentScale}) translate(${x / currentScale}px, ${y / currentScale}px)`;
      }
    });
  }, []);

  // 拖拽平移 - 优化版本
  const handleMouseDown = useCallback((e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y });
    }
  }, [scale]);

  // 使用 RAF 优化拖动性能
  useEffect(() => {
    if (!isPanning) return;

    let currentPan = { ...panRef.current };

    const handleMouseMove = (e) => {
      e.preventDefault();

      // 计算新位置
      currentPan = {
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      };

      // 使用 RAF 批量更新所有图片
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        panRef.current = currentPan;
        updateAllImagesTransform(currentPan.x, currentPan.y, scale);
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      // 拖动结束后同步到 React 状态(用于显示)
      setPan(panRef.current);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPanning, startPan, scale, updateAllImagesTransform]);

  const categoryIcons = {
    correct: { icon: '✓', color: 'bg-green-600', text: '正确' },
    medium: { icon: '~', color: 'bg-yellow-600', text: '适中' },
    wrong: { icon: '✕', color: 'bg-red-600', text: '错误' },
  };

  const columnsCount = Math.min(photosWithUrls.photos.length, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 顶部工具栏 - 固定高度 */}
      <div className="h-14 bg-black/80 flex items-center justify-between px-6 flex-shrink-0">
        <div className="text-white text-sm flex items-center gap-6">
          <span>对比预览 · {photosWithUrls.photos.length} 张图片</span>
          {allPhotos && totalGroups > 1 && (
            <span className="text-purple-400">
              第 {currentGroupIndex + 1} / {totalGroups} 组
            </span>
          )}
          <span className="text-blue-400">缩放: {(scale * 100).toFixed(0)}%</span>
          {overlayPairIndex >= 0 && (() => {
            const realPhotos = photosWithUrls.photos.filter(p => p);
            const leftIdx = overlayPairIndex;
            const rightIdx = realPhotos.length - 1 - overlayPairIndex;
            return (
              <span className="text-purple-400 font-bold animate-pulse">
                🔀 左右对比：第 {leftIdx + 1} 张 vs 第 {rightIdx + 1} 张
              </span>
            );
          })()}
          <span className="text-gray-400 text-xs">
            {allPhotos && totalGroups > 1 ? '↑↓切换组 · ' : ''}
            按住Q左右对比 · 滚轮缩放 · 拖拽平移 · R键重置
          </span>
        </div>

        <div className="flex items-center gap-2">
          {allPhotos && totalGroups > 1 && (
            <>
              <button
                onClick={handlePrevGroup}
                disabled={currentGroupIndex === 0}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  currentGroupIndex === 0
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                ↑ 上一组
              </button>
              <button
                onClick={handleNextGroup}
                disabled={currentGroupIndex === totalGroups - 1}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  currentGroupIndex === totalGroups - 1
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                ↓ 下一组
              </button>
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
            </>
          )}
          <button
            onClick={() => handleCategoryAll('correct')}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
          >
            1️⃣ 正确
          </button>
          <button
            onClick={() => handleCategoryAll('medium')}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
          >
            2️⃣ 适中
          </button>
          <button
            onClick={() => handleCategoryAll('wrong')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
          >
            3️⃣ 错误
          </button>

          <div className="w-px h-6 bg-gray-600 mx-2"></div>

          <button
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
          >
            重置缩放
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
          >
            ESC 关闭
          </button>
        </div>
      </div>

      {/* 主预览区 - 固定框架,图片在框内缩放 */}
      <div className="flex-1 overflow-hidden p-1">
        <div
          className="h-full grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
          }}
        >
          {photosWithUrls.photos.map((photo, idx) => {
            // 处理占位符（null）情况
            if (!photo) {
              return (
                <div
                  key={`placeholder-${idx}`}
                  className="relative bg-gray-900 overflow-hidden flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-3 opacity-20">📷</div>
                    <div className="text-gray-500 text-sm font-medium">此文件夹无此图片</div>
                  </div>
                  {/* 图片序号 */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold z-10">
                    {idx + 1}
                  </div>
                </div>
              );
            }

            // 从 store 中获取实时分类状态
            const storePhoto = storePhotos.find(p => p.id === photo.id);
            const currentCategory = storePhoto ? storePhoto.category : photo.category;
            const config = currentCategory ? categoryIcons[currentCategory] : null;

            const handleContextMenu = (e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                photoId: photo.id
              });
            };

            // 计算是否在对比模式中
            const realPhotos = photosWithUrls.photos.filter(p => p);
            const leftCompareIdx = overlayPairIndex;
            const rightCompareIdx = realPhotos.length - 1 - overlayPairIndex;
            const isLeftCompare = overlayPairIndex >= 0 && idx === leftCompareIdx; // 是否是左侧对比格子
            const isRightCompare = overlayPairIndex >= 0 && idx === rightCompareIdx; // 是否是右侧对比格子

            // 如果是右侧对比格子，显示提示
            if (isRightCompare) {
              return (
                <div
                  key={photo.id}
                  className="relative bg-black overflow-hidden opacity-20"
                >
                  <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-gray-500 text-sm">
                    <div className="text-4xl">➡️</div>
                    <div>已移至第 {leftCompareIdx + 1} 格左右对比</div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={photo.id}
                className="relative bg-black overflow-hidden"
                style={{
                  cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
                }}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
              >
                {/* 图片序号 */}
                <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold z-10 pointer-events-none">
                  {idx + 1}
                </div>

                {/* 分类标记 - 始终显示,实时更新 */}
                <div className={`absolute top-3 right-3 ${config ? config.color : 'bg-gray-700'} text-white px-3 py-1.5 rounded-lg text-sm font-bold z-10 pointer-events-none shadow-lg transition-all duration-300`}>
                  {config ? (
                    <>
                      <span className="text-lg">{config.icon}</span>
                      <span className="ml-1">{config.text}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">未标记</span>
                  )}
                </div>

                {/* 图片容器 - 可缩放和平移 */}
                <div className="w-full h-full flex items-center justify-center relative">
                  {/* 如果是左侧对比格子，显示左右分屏对比 */}
                  {isLeftCompare && photosWithUrls.photos[rightCompareIdx] ? (
                    <div className="w-full h-full flex">
                      {/* 左半边：当前图片 */}
                      <div className="w-1/2 h-full flex items-center justify-center border-r-2 border-purple-500 relative">
                        <img
                          ref={el => imagesRef.current[idx] = el}
                          src={photo.thumbnailUrl}
                          alt={photo.name}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
                            transformOrigin: 'center center',
                            willChange: isPanning ? 'transform' : 'auto',
                          }}
                          draggable={false}
                        />
                        {/* 左侧标签 */}
                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                          左：第 {leftCompareIdx + 1} 张
                        </div>
                      </div>

                      {/* 右半边：对比图片 */}
                      <div className="w-1/2 h-full flex items-center justify-center relative">
                        <img
                          src={photosWithUrls.photos[rightCompareIdx].thumbnailUrl}
                          alt={photosWithUrls.photos[rightCompareIdx].name}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
                            transformOrigin: 'center center',
                            willChange: isPanning ? 'transform' : 'auto',
                          }}
                          draggable={false}
                        />
                        {/* 右侧标签 */}
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                          右：第 {rightCompareIdx + 1} 张
                        </div>
                      </div>

                      {/* 中央分隔指示器 */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none shadow-lg z-10">
                        VS
                      </div>
                    </div>
                  ) : (
                    /* 正常显示单张图片 */
                    <img
                      ref={el => imagesRef.current[idx] = el}
                      src={photo.thumbnailUrl}
                      alt={photo.name}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
                        transformOrigin: 'center center',
                        willChange: isPanning ? 'transform' : 'auto',
                      }}
                      draggable={false}
                    />
                  )}
                </div>

                {/* 文件名 */}
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs truncate text-center pointer-events-none">
                  {photo.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部提示栏 - 固定高度 */}
      <div className="h-10 bg-black/80 flex items-center justify-center gap-8 px-6 text-xs text-gray-400 flex-shrink-0">
        <span>← → 切换</span>
        <span className="text-purple-400">按住Q 左右对比</span>
        <span>滚轮 缩放</span>
        <span>拖拽 平移</span>
        <span>R 重置</span>
        <span className="text-green-400">1 正确</span>
        <span className="text-yellow-400">2 适中</span>
        <span className="text-red-400">3 错误</span>
        <span>ESC 关闭</span>
      </div>

      {/* 标签切换提示 - 中央浮动显示 */}
      {flashMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none">
          <div
            className={`${flashMessage.color} text-white px-8 py-4 rounded-2xl text-2xl font-bold shadow-2xl animate-pulse`}
            style={{
              animation: 'fadeInOut 1.5s ease-in-out'
            }}
          >
            {flashMessage.text}
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-[70] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-2 min-w-[200px]">
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, 'correct');
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-green-500 font-bold text-xl">✓</span>
              <span className="text-white font-medium">正确</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">1</span>
            </button>
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, 'medium');
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-yellow-500 font-bold text-xl">~</span>
              <span className="text-white font-medium">中等</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">2</span>
            </button>
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, 'wrong');
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-red-500 font-bold text-xl">✕</span>
              <span className="text-white font-medium">错误</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">3</span>
            </button>
            <div className="h-px bg-gray-700 my-1"></div>
            <button
              onClick={() => {
                setCategory(contextMenu.photoId, null);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
            >
              <span className="text-gray-500 font-bold text-xl">○</span>
              <span className="text-gray-400 font-medium">取消标签</span>
              <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">X</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
});

export default LightboxPreview;
