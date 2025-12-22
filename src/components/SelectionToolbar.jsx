function SelectionToolbar({
  selectedPhotos,
  onPreview,
  onClear,
}) {
  if (selectedPhotos.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 neu-card p-4 rounded-xl shadow-2xl z-40">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-gray-700">
          已选择 {selectedPhotos.length} 张图片
        </div>
        <button
          onClick={onPreview}
          className="px-4 py-2 neu-button rounded-lg text-blue-600 text-sm font-medium"
        >
          大图对比
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 neu-button rounded-lg text-red-600 text-sm font-medium"
        >
          清除选择
        </button>
      </div>
    </div>
  );
}

export default SelectionToolbar;
