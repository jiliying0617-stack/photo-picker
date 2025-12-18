import { useState, useEffect } from 'react';
import usePhotoStore from '../store/usePhotoStore';
import { importFolder, importFolderFromDrop, isFileSystemAccessSupported } from '../utils/fileSystem';

function FileImporter() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const setPhotos = usePhotoStore((state) => state.setPhotos);

  const handleImport = async () => {
    if (!isFileSystemAccessSupported()) {
      alert('您的浏览器不支持文件夹导入功能。\n请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: 0 });

    try {
      console.log('[导入] 开始导入文件夹...');

      const { photos: newPhotos, folderName } = await importFolder((p) => {
        setProgress(p);
      });

      console.log(`[导入] 读取到 ${newPhotos.length} 张图片`);

      if (newPhotos.length > 0) {
        console.log(`[导入] 保存到 store (会自动从 localStorage 恢复分类标记)`);

        // setPhotos 会自动从 localStorage 恢复分类标记
        setPhotos(newPhotos);

        // 统计恢复的分类数量
        const restoredCount = newPhotos.filter(p => p.category).length;
        const message = restoredCount > 0
          ? `成功导入 ${newPhotos.length} 张图片!\n文件夹: ${folderName}\n\n✨ 已恢复 ${restoredCount} 张图片的分类标记`
          : `成功导入 ${newPhotos.length} 张图片!\n文件夹: ${folderName}`;

        alert(message);
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert(`导入失败: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // 监听拖放事件
  useEffect(() => {
    const handleDropFolder = async (e) => {
      const dataTransfer = e.detail;
      if (!dataTransfer || !dataTransfer.items) return;

      setImporting(true);
      setProgress({ current: 0, total: 0 });

      try {
        const { photos: newPhotos, folderName } = await importFolderFromDrop(dataTransfer, (p) => {
          setProgress(p);
        });

        if (newPhotos.length > 0) {
          setPhotos(newPhotos);

          const restoredCount = newPhotos.filter(p => p.category).length;
          const message = restoredCount > 0
            ? `成功导入 ${newPhotos.length} 张图片!\n文件夹: ${folderName}\n\n✨ 已恢复 ${restoredCount} 张图片的分类标记`
            : `成功导入 ${newPhotos.length} 张图片!\n文件夹: ${folderName}`;

          alert(message);
        }
      } catch (error) {
        console.error('拖放导入失败:', error);
        alert(`导入失败: ${error.message}`);
      } finally {
        setImporting(false);
        setProgress({ current: 0, total: 0 });
      }
    };

    window.addEventListener('dropFolder', handleDropFolder);
    return () => window.removeEventListener('dropFolder', handleDropFolder);
  }, [setPhotos]);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleImport}
        disabled={importing}
        className={`
          px-6 py-2 rounded-xl font-medium text-sm
          transition-all duration-200
          ${importing
            ? 'neu-pressed text-gray-400 cursor-not-allowed'
            : 'neu-button text-blue-600 hover:text-blue-700'
          }
        `}
      >
        {importing ? '导入中...' : '导入文件夹'}
      </button>

      {importing && progress.current > 0 && (
        <div className="text-sm text-gray-500 font-light">
          已加载 {progress.current} 张...
        </div>
      )}
    </div>
  );
}

export default FileImporter;
