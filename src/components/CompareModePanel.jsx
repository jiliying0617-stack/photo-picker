/**
 * 对比模式信息面板组件
 *
 * 显示对比模式状态和选中的文件夹信息
 */
function CompareModePanel({ isCompareMode, compareColumns, selectedFolders }) {
  if (!isCompareMode) return null;

  return (
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
  );
}

export default CompareModePanel;
