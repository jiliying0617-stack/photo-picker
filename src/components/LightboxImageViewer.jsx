import { memo } from 'react';

/**
 * Lightbox图片查看器组件
 *
 * 负责显示照片网格,支持:
 * - 缩放和平移
 * - 自动旋转和手动旋转
 * - 对比模式(叠图显示)
 * - 分类标记显示
 * - 照片序号和文件名显示
 *
 * @param {Object} props - 组件props
 * @param {Array} props.photos - 照片数组(可能包含null占位符)
 * @param {number} props.columnsCount - 网格列数
 * @param {Object} props.categoryIcons - 分类图标配置
 * @param {Array} props.storePhotos - Store中的照片(用于获取实时分类状态)
 * @param {number} props.scale - 缩放比例
 * @param {Object} props.pan - 平移位置 {x, y}
 * @param {boolean} props.isPanning - 是否正在拖拽
 * @param {boolean} props.isCompareMode - 是否处于叠图对比模式
 * @param {Object} props.autoRotations - 自动旋转角度 {photoId: degree}
 * @param {Object} props.rotations - 手动旋转角度 {photoId: degree}
 * @param {Object} props.scaleCompensation - 旋转缩放补偿 {photoId: scale}
 * @param {Object} props.containerStyle - 容器样式
 * @param {Object} props.imagesRef - 图片元素引用
 * @param {Function} props.onImageLoad - 图片加载完成回调
 * @param {Function} props.onMouseDown - 鼠标按下回调
 * @param {Function} props.onPhotoClick - 照片点击回调
 * @param {Function} props.onPhotoHover - 照片悬停回调(enter/leave)
 * @param {Function} props.onContextMenu - 右键菜单回调
 */
const LightboxImageViewer = memo(function LightboxImageViewer({
  photos,
  columnsCount,
  categoryIcons,
  storePhotos,
  scale,
  pan,
  isPanning,
  isCompareMode,
  autoRotations,
  rotations,
  scaleCompensation,
  containerStyle,
  imagesRef,
  onImageLoad,
  onMouseDown,
  onPhotoClick,
  onPhotoHover,
  onContextMenu,
}) {
  return (
    <div className="flex-1 overflow-hidden">
      <div
        className="h-full grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
        }}
      >
        {photos.map((photo, idx) => {
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

          const handleContextMenu = e => {
            e.preventDefault();
            onContextMenu({
              x: e.clientX,
              y: e.clientY,
              photoId: photo.id,
            });
          };

          // 计算相邻对比（循环）
          const realPhotos = photos.filter(p => p);
          const currentRealIdx = realPhotos.findIndex(p => p && p.id === photo.id);
          const nextRealIdx = currentRealIdx >= 0 ? (currentRealIdx + 1) % realPhotos.length : -1;
          const nextPhoto = nextRealIdx >= 0 ? realPhotos[nextRealIdx] : null;

          return (
            <div
              key={photo.id}
              className="relative bg-black overflow-hidden"
              style={{
                cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
              }}
              onClick={() => onPhotoClick(photo.id)}
              onMouseDown={onMouseDown}
              onContextMenu={handleContextMenu}
              onMouseEnter={() => onPhotoHover({ type: 'enter', photoId: photo.id })}
              onMouseLeave={() => onPhotoHover({ type: 'leave', photoId: null })}
            >
              {/* 图片序号 */}
              <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold z-10 pointer-events-none">
                {idx + 1}
              </div>

              {/* 分类标记 - 始终显示,实时更新 */}
              <div
                className={`absolute top-3 right-3 ${config ? config.color : 'bg-gray-700'} text-white px-3 py-1.5 rounded-lg text-sm font-bold z-10 pointer-events-none shadow-lg transition-all duration-300`}
              >
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
                {/* 动态容器：根据第一张图的宽高比自动调整，使用 contain 显示完整原图 */}
                <div className="relative overflow-hidden" style={containerStyle}>
                  {/* 相邻循环对比模式 - 叠图显示 */}
                  {isCompareMode && nextPhoto ? (
                    <div className="w-full h-full flex items-center justify-center relative">
                      {/* 底层：当前图片 */}
                      <img
                        ref={el => (imagesRef.current[idx] = el)}
                        src={photo.thumbnailUrl}
                        alt={photo.name}
                        className="absolute object-contain"
                        onLoad={e => onImageLoad(photo.id, e)}
                        style={{
                          width: '100%',
                          height: '100%',
                          transform: `translate(${pan.x}px, ${pan.y}px) rotate(${(autoRotations[photo.id] || 0) + (rotations[photo.id] || 0)}deg) scale(${scale * (scaleCompensation[photo.id] || 1)})`,
                          transformOrigin: 'center center',
                          willChange: isPanning ? 'transform' : 'auto',
                          zIndex: 1,
                        }}
                        draggable={false}
                      />

                      {/* 顶层：下一张图片（叠加） */}
                      <img
                        src={nextPhoto.thumbnailUrl}
                        alt={nextPhoto.name}
                        className="absolute object-contain"
                        onLoad={e => onImageLoad(nextPhoto.id, e)}
                        style={{
                          width: '100%',
                          height: '100%',
                          transform: `translate(${pan.x}px, ${pan.y}px) rotate(${(autoRotations[nextPhoto.id] || 0) + (rotations[nextPhoto.id] || 0)}deg) scale(${scale * (scaleCompensation[nextPhoto.id] || 1)})`,
                          transformOrigin: 'center center',
                          willChange: isPanning ? 'transform' : 'auto',
                          zIndex: 2,
                        }}
                        draggable={false}
                      />

                      {/* 对比标签 */}
                      <div className="absolute top-2 left-2 bg-purple-600/90 text-white px-2 py-1 rounded text-xs font-bold z-10">
                        第 {currentRealIdx + 1} 张 ⇄ 第 {nextRealIdx + 1} 张
                      </div>
                    </div>
                  ) : (
                    /* 正常显示单张图片 */
                    <img
                      ref={el => (imagesRef.current[idx] = el)}
                      src={photo.thumbnailUrl}
                      alt={photo.name}
                      className="object-contain"
                      onLoad={e => onImageLoad(photo.id, e)}
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: `translate(${pan.x}px, ${pan.y}px) rotate(${(autoRotations[photo.id] || 0) + (rotations[photo.id] || 0)}deg) scale(${scale * (scaleCompensation[photo.id] || 1)})`,
                        transformOrigin: 'center center',
                        willChange: isPanning ? 'transform' : 'auto',
                      }}
                      draggable={false}
                    />
                  )}
                </div>
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
  );
});

export default LightboxImageViewer;
