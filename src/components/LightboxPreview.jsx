import { useEffect, useState, useRef, useCallback } from 'react';
import usePhotoStore from '../store/usePhotoStore';

function LightboxPreview({ photos, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1); // 图片缩放比例
  const [pan, setPan] = useState({ x: 0, y: 0 }); // 图片平移位置
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const setCategory = usePhotoStore((state) => state.setCategory);

  // 性能优化: 使用 ref 存储所有图片元素和当前位置
  const imagesRef = useRef([]);
  const panRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // 同步 pan 状态到 ref
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(prev => Math.min(photos.length - 1, prev + 1));
      } else if (e.key === '1') {
        e.preventDefault();
        handleCategoryAll('correct');
      } else if (e.key === '2') {
        e.preventDefault();
        handleCategoryAll('medium');
      } else if (e.key === '3') {
        e.preventDefault();
        handleCategoryAll('wrong');
      } else if (e.key === '0') {
        e.preventDefault();
        handleCategoryAll(null);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setScale(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  // 鼠标滚轮缩放
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2; // 增加每次缩放步长
      setScale(prev => Math.max(0.5, Math.min(10, prev + delta))); // 最大放大到 10 倍
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

  const handleCategoryAll = (category) => {
    photos.forEach(photo => {
      setCategory(photo.id, category);
    });
  };

  const categoryIcons = {
    correct: { icon: '✓', color: 'bg-green-600', text: '正确' },
    medium: { icon: '~', color: 'bg-yellow-600', text: '适中' },
    wrong: { icon: '✕', color: 'bg-red-600', text: '错误' },
  };

  const columnsCount = Math.min(photos.length, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 顶部工具栏 - 固定高度 */}
      <div className="h-14 bg-black/80 flex items-center justify-between px-6 flex-shrink-0">
        <div className="text-white text-sm flex items-center gap-6">
          <span>对比预览 · {photos.length} 张图片</span>
          <span className="text-blue-400">缩放: {(scale * 100).toFixed(0)}%</span>
          <span className="text-gray-400 text-xs">滚轮缩放 · 拖拽平移 · R键重置</span>
        </div>

        <div className="flex items-center gap-2">
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
          {photos.map((photo, idx) => {
            const config = photo.category ? categoryIcons[photo.category] : null;
            return (
              <div
                key={photo.id}
                className="relative bg-black overflow-hidden"
                style={{ cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                onMouseDown={handleMouseDown}
              >
                {/* 图片序号 */}
                <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold z-10 pointer-events-none">
                  {idx + 1}
                </div>

                {/* 分类标记 */}
                {config && (
                  <div className={`absolute top-3 right-3 ${config.color} text-white px-2 py-1 rounded text-xs font-bold z-10 pointer-events-none`}>
                    {config.icon} {config.text}
                  </div>
                )}

                {/* 图片容器 - 可缩放和平移 */}
                <div className="w-full h-full flex items-center justify-center">
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
        <span>滚轮 缩放</span>
        <span>拖拽 平移</span>
        <span>R 重置</span>
        <span>1/2/3 标记</span>
        <span>ESC 关闭</span>
      </div>
    </div>
  );
}

export default LightboxPreview;
