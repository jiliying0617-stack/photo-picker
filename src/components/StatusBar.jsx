import usePhotoStore from '../store/usePhotoStore';

function StatusBar() {
  const getStats = usePhotoStore((state) => state.getStats);
  const stats = getStats();

  if (stats.total === 0) {
    return null;
  }

  const percentage = (count, total) => {
    if (total === 0) return '0';
    return ((count / total) * 100).toFixed(0);
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
        </div>

        {/* 快捷键提示 */}
        <div className="text-xs text-gray-400 font-light flex items-center gap-3">
          <kbd className="neu-convex px-2 py-1 rounded text-gray-600">1</kbd>
          <kbd className="neu-convex px-2 py-1 rounded text-gray-600">2</kbd>
          <kbd className="neu-convex px-2 py-1 rounded text-gray-600">3</kbd>
          <span className="text-gray-400">·</span>
          <kbd className="neu-convex px-2 py-1 rounded text-gray-600">0</kbd>
          <span>取消</span>
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
