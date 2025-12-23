import { memo } from 'react';
import usePhotoStore from '../store/usePhotoStore';

const StatusBar = memo(function StatusBar({ isCompareMode = false, enableGroupNavigation = false, totalGroups = 0, jumpToGroup = '', onJumpToGroupChange = () => {}, onJumpToGroup = () => {} }) {
  const getStats = usePhotoStore((state) => state.getStats);
  const photos = usePhotoStore((state) => state.photos);
  const stats = getStats();

  if (stats.total === 0) {
    return null;
  }

  const percentage = (count, total) => {
    if (total === 0) return '0';
    return ((count / total) * 100).toFixed(0);
  };

  // 检查是否有图片缺少文件对象
  const photosWithoutFile = photos.filter(p => !p.file).length;
  const hasWarning = photosWithoutFile > 0;

  // 处理跳转到组
  const handleJumpToGroup = () => {
    const groupNum = parseInt(jumpToGroup, 10);
    if (!isNaN(groupNum) && groupNum >= 1 && groupNum <= totalGroups) {
      onJumpToGroup(groupNum - 1); // 转换为0索引
      onJumpToGroupChange(''); // 清空输入
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJumpToGroup();
    }
  };

  return (
    <div className="bg-[#e0e5ec] px-8 py-4">
      <div className="neu-card px-6 py-3 flex items-center justify-between">
        {/* 统计信息 - 极简风格 */}
        <div className="flex items-center gap-8 text-sm">
          <div className="text-gray-600 font-light">
            总计 <span className="font-medium text-gray-800">{stats.total}</span>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="flex items-center gap-1 text-green-600">
            <span className="font-bold text-lg">✓</span>
            <span className="font-medium">{stats.correct}</span>
            <span className="text-xs text-gray-400 ml-1">
              {percentage(stats.correct, stats.total)}%
            </span>
          </div>

          <div className="flex items-center gap-1 text-yellow-600">
            <span className="font-bold text-lg">~</span>
            <span className="font-medium">{stats.medium}</span>
            <span className="text-xs text-gray-400 ml-1">
              {percentage(stats.medium, stats.total)}%
            </span>
          </div>

          <div className="flex items-center gap-1 text-red-600">
            <span className="font-bold text-lg">✕</span>
            <span className="font-medium">{stats.wrong}</span>
            <span className="text-xs text-gray-400 ml-1">
              {percentage(stats.wrong, stats.total)}%
            </span>
          </div>

          {/* 组导航 - 在对比模式或检索组模式下显示 */}
          {enableGroupNavigation && totalGroups > 0 && (
            <>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-light">
                  共 {totalGroups} 组
                  {isCompareMode && <span className="text-xs ml-1">(对比)</span>}
                </span>
                <span className="text-gray-400">·</span>
                <button
                  onClick={() => onJumpToGroup(0)}
                  className="neu-button px-2 py-1 rounded text-xs text-gray-600 font-medium hover:text-blue-600"
                  title="跳转到第一组"
                >
                  首组
                </button>
                <input
                  type="number"
                  min="1"
                  max={totalGroups}
                  value={jumpToGroup}
                  onChange={(e) => onJumpToGroupChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="#"
                  className="w-14 px-2 py-1 neu-concave rounded text-sm text-center text-gray-700 font-medium focus:outline-none"
                  title="输入组号跳转"
                />
                <button
                  onClick={handleJumpToGroup}
                  disabled={!jumpToGroup || parseInt(jumpToGroup) < 1 || parseInt(jumpToGroup) > totalGroups}
                  className="neu-button px-2 py-1 rounded text-xs text-blue-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  GO
                </button>
                <button
                  onClick={() => onJumpToGroup(totalGroups - 1)}
                  className="neu-button px-2 py-1 rounded text-xs text-gray-600 font-medium hover:text-blue-600"
                  title="跳转到最后一组"
                >
                  末组
                </button>
              </div>
            </>
          )}
        </div>

        {/* 快捷键提示 - 极速模式 */}
        <div className="text-xs text-gray-400 font-light flex items-center gap-3">
          {hasWarning ? (
            <>
              <span className="text-orange-600 font-medium flex items-center gap-2">
                ⚠️ {photosWithoutFile} 张图片缺少文件
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-orange-500">需要重新导入文件夹才能导出</span>
            </>
          ) : (
            <>
              <span className="text-blue-600 font-medium">⚡ 极速模式</span>
              <span className="text-gray-400">·</span>
              <kbd className="neu-convex px-2 py-1 rounded text-green-600 font-medium">1</kbd>
              <kbd className="neu-convex px-2 py-1 rounded text-yellow-600 font-medium">2</kbd>
              <kbd className="neu-convex px-2 py-1 rounded text-red-600 font-medium">3</kbd>
              <span className="text-gray-400">·</span>
              <kbd className="neu-convex px-2 py-1 rounded text-gray-600">X</kbd>
              <span>取消</span>
              <span className="text-gray-400">·</span>
              <kbd className="neu-convex px-2 py-1 rounded text-gray-600">←→</kbd>
              <span>切换</span>
              <span className="text-gray-400 ml-2">(Shift/Ctrl多选)</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-[10px]">v1.2.0</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default StatusBar;
