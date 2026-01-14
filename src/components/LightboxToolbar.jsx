import { memo } from 'react';

/**
 * Lightbox顶部工具栏组件
 *
 * 包含:
 * - 左侧信息显示区 (图片数量、组索引、缩放比例、模式提示)
 * - 右侧操作按钮区 (导航、分类、重置、关闭)
 *
 * @param {Object} props - 组件props
 * @param {number} props.photoCount - 当前显示的照片数量
 * @param {number} props.scale - 当前缩放比例 (1 = 100%)
 * @param {boolean} props.isCompareMode - 是否处于叠图对比模式
 * @param {number} props.currentGroupIndex - 当前组索引 (0-based)
 * @param {number} props.totalGroups - 总组数
 * @param {Function} props.onPrevGroup - 上一组回调
 * @param {Function} props.onNextGroup - 下一组回调
 * @param {Function} props.onCategory - 分类回调 (category: 'correct' | 'medium' | 'wrong')
 * @param {Function} props.onReset - 重置缩放回调
 * @param {Function} props.onClose - 关闭回调
 */
const LightboxToolbar = memo(function LightboxToolbar({
  photoCount,
  scale,
  isCompareMode,
  currentGroupIndex,
  totalGroups,
  onPrevGroup,
  onNextGroup,
  onCategory,
  onReset,
  onClose,
}) {
  const hasNavigation = totalGroups > 1;

  return (
    <div className="h-14 bg-black/80 flex items-center justify-between px-6 flex-shrink-0">
      {/* 左侧信息显示区 */}
      <div className="text-white text-sm flex items-center gap-6">
        <span>对比预览 · {photoCount} 张图片</span>
        {hasNavigation && (
          <span className="text-purple-400">
            第 {currentGroupIndex + 1} / {totalGroups} 组
          </span>
        )}
        <span className="text-blue-400">缩放: {(scale * 100).toFixed(0)}%</span>
        {isCompareMode && (
          <span className="text-purple-400 font-bold animate-pulse">🔀 相邻循环对比模式</span>
        )}
        <span className="text-gray-400 text-xs">
          {hasNavigation ? '空格键:第1图不动其余切换 · ↓键:全部切换 · ' : ''}
          按住Q叠图对比 · 滚轮缩放 · 拖拽平移 · R键重置
        </span>
      </div>

      {/* 右侧操作按钮区 */}
      <div className="flex items-center gap-2">
        {/* 组导航按钮 */}
        {hasNavigation && (
          <>
            <button
              onClick={onPrevGroup}
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
              onClick={onNextGroup}
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

        {/* 分类按钮 */}
        <button
          onClick={() => onCategory('correct')}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
        >
          1️⃣ 正确
        </button>
        <button
          onClick={() => onCategory('medium')}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
        >
          2️⃣ 适中
        </button>
        <button
          onClick={() => onCategory('wrong')}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
        >
          3️⃣ 错误
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2"></div>

        {/* 重置缩放按钮 */}
        <button
          onClick={onReset}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
        >
          重置缩放
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
        >
          ESC 关闭
        </button>
      </div>
    </div>
  );
});

export default LightboxToolbar;
