function DragOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="neu-card p-12 rounded-3xl shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <div className="text-2xl font-bold text-gray-800 mb-2">松开鼠标导入文件夹</div>
          <div className="text-sm text-gray-500">支持拖入包含图片的文件夹</div>
        </div>
      </div>
    </div>
  );
}

export default DragOverlay;
