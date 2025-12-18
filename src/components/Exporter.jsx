import { useState } from 'react';
import usePhotoStore from '../store/usePhotoStore';
import { exportPhotos, isFileSystemAccessSupported } from '../utils/fileSystem';

function Exporter() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const getCategorizedPhotos = usePhotoStore((state) => state.getCategorizedPhotos);
  const getStats = usePhotoStore((state) => state.getStats);

  const handleExport = async () => {
    const categorizedPhotos = getCategorizedPhotos();

    if (categorizedPhotos.length === 0) {
      alert('没有已分类的图片!\n请先对图片进行分类 (正确/适中/错误)');
      return;
    }

    if (!isFileSystemAccessSupported()) {
      alert('您的浏览器不支持文件夹导出功能。\n请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    const stats = getStats();
    const confirmMsg = `确定要导出 ${categorizedPhotos.length} 张已分类的图片吗?\n\n分类统计:\n✅ 正确: ${stats.correct} 张\n⚖️ 适中: ${stats.medium} 张\n❌ 错误: ${stats.wrong} 张\n\n将创建 3 个子文件夹 (正确/适中/错误)`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setExporting(true);
    setProgress({ current: 0, total: categorizedPhotos.length });

    try {
      const result = await exportPhotos(categorizedPhotos, (p) => {
        setProgress(p);
      });

      if (result.exported > 0) {
        alert(
          `导出完成!\n\n` +
          `成功导出: ${result.exported} / ${result.total} 张\n` +
          `目标文件夹: ${result.folderName}\n\n` +
          `已创建子文件夹:\n` +
          `· 正确/ - ${stats.correct} 张\n` +
          `· 适中/ - ${stats.medium} 张\n` +
          `· 错误/ - ${stats.wrong} 张`
        );
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error.message}`);
    } finally {
      setExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const categorizedCount = getCategorizedPhotos().length;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleExport}
        disabled={exporting || categorizedCount === 0}
        className={`
          px-6 py-2 rounded-xl font-medium text-sm
          transition-all duration-200
          ${categorizedCount > 0
            ? 'neu-button text-green-600 hover:text-green-700'
            : 'neu-pressed text-gray-400 cursor-not-allowed'
          }
          ${exporting ? 'opacity-50' : ''}
        `}
      >
        {exporting ? '导出中...' : `导出 (${categorizedCount})`}
      </button>

      {exporting && progress.total > 0 && (
        <div className="text-sm text-gray-500 font-light">
          {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
        </div>
      )}
    </div>
  );
}

export default Exporter;
