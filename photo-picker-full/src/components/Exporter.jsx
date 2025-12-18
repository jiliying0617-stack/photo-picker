import { useState } from 'react';
import usePhotoStore from '../store/usePhotoStore';
import { exportPhotos, isFileSystemAccessSupported } from '../utils/fileSystem';

function Exporter() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    correct: true,
    medium: true,
    wrong: true,
    uncategorized: false
  });

  const photos = usePhotoStore((state) => state.photos);
  const getStats = usePhotoStore((state) => state.getStats);

  const handleOpenModal = () => {
    if (photos.length === 0) {
      alert('没有图片可导出!');
      return;
    }

    if (!isFileSystemAccessSupported()) {
      alert('您的浏览器不支持文件夹导出功能。\n请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    setShowModal(true);
  };

  const handleExport = async () => {
    const stats = getStats();

    // 根据选择过滤要导出的图片
    const photosToExport = photos.filter(photo => {
      if (photo.category) {
        return selectedCategories[photo.category];
      } else {
        return selectedCategories.uncategorized;
      }
    });

    if (photosToExport.length === 0) {
      alert('请至少选择一个分类进行导出!');
      return;
    }

    setShowModal(false);
    setExporting(true);
    setProgress({ current: 0, total: photosToExport.length });

    try {
      const result = await exportPhotos(photosToExport, selectedCategories, (p) => {
        setProgress(p);
      });

      if (result.exported > 0) {
        const exportedStats = [];
        if (selectedCategories.correct && stats.correct > 0) {
          exportedStats.push(`· 正确/ - ${stats.correct} 张`);
        }
        if (selectedCategories.medium && stats.medium > 0) {
          exportedStats.push(`· 适中/ - ${stats.medium} 张`);
        }
        if (selectedCategories.wrong && stats.wrong > 0) {
          exportedStats.push(`· 错误/ - ${stats.wrong} 张`);
        }
        if (selectedCategories.uncategorized && stats.uncategorized > 0) {
          exportedStats.push(`· 未打标/ - ${stats.uncategorized} 张`);
        }

        alert(
          `导出完成!\n\n` +
          `成功导出: ${result.exported} / ${result.total} 张\n` +
          `目标文件夹: ${result.folderName}\n\n` +
          `已创建子文件夹:\n` +
          exportedStats.join('\n')
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

  const toggleCategory = (category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const stats = getStats();
  const hasPhotos = photos.length > 0;

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={handleOpenModal}
          disabled={exporting || !hasPhotos}
          className={`
            px-6 py-2 rounded-xl font-medium text-sm
            transition-all duration-200
            ${hasPhotos
              ? 'neu-button text-green-600 hover:text-green-700'
              : 'neu-pressed text-gray-400 cursor-not-allowed'
            }
            ${exporting ? 'opacity-50' : ''}
          `}
        >
          {exporting ? '导出中...' : `导出 (${photos.length})`}
        </button>

        {exporting && progress.total > 0 && (
          <div className="text-sm text-gray-500 font-light">
            {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
          </div>
        )}
      </div>

      {/* 导出选项弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="neu-card rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* 标题 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">选择导出分类</h2>
              <p className="text-sm text-gray-500">保持原文件夹结构导出</p>
            </div>

            {/* 分类选项 */}
            <div className="space-y-4 mb-8">
              {/* 正确 */}
              <button
                onClick={() => toggleCategory('correct')}
                className={`
                  w-full p-4 rounded-2xl transition-all duration-200
                  ${selectedCategories.correct ? 'neu-pressed' : 'neu-button'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      selectedCategories.correct ? 'bg-green-600' : 'bg-gray-300'
                    } transition-colors`}>
                      {selectedCategories.correct && <span className="text-white text-lg">✓</span>}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">正确</div>
                      <div className="text-xs text-gray-500">{stats.correct} 张图片</div>
                    </div>
                  </div>
                  <div className="text-2xl">✓</div>
                </div>
              </button>

              {/* 适中 */}
              <button
                onClick={() => toggleCategory('medium')}
                className={`
                  w-full p-4 rounded-2xl transition-all duration-200
                  ${selectedCategories.medium ? 'neu-pressed' : 'neu-button'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      selectedCategories.medium ? 'bg-yellow-600' : 'bg-gray-300'
                    } transition-colors`}>
                      {selectedCategories.medium && <span className="text-white text-lg">✓</span>}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">适中</div>
                      <div className="text-xs text-gray-500">{stats.medium} 张图片</div>
                    </div>
                  </div>
                  <div className="text-2xl">~</div>
                </div>
              </button>

              {/* 错误 */}
              <button
                onClick={() => toggleCategory('wrong')}
                className={`
                  w-full p-4 rounded-2xl transition-all duration-200
                  ${selectedCategories.wrong ? 'neu-pressed' : 'neu-button'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      selectedCategories.wrong ? 'bg-red-600' : 'bg-gray-300'
                    } transition-colors`}>
                      {selectedCategories.wrong && <span className="text-white text-lg">✓</span>}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">错误</div>
                      <div className="text-xs text-gray-500">{stats.wrong} 张图片</div>
                    </div>
                  </div>
                  <div className="text-2xl">✕</div>
                </div>
              </button>

              {/* 未打标 */}
              <button
                onClick={() => toggleCategory('uncategorized')}
                className={`
                  w-full p-4 rounded-2xl transition-all duration-200
                  ${selectedCategories.uncategorized ? 'neu-pressed' : 'neu-button'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      selectedCategories.uncategorized ? 'bg-gray-600' : 'bg-gray-300'
                    } transition-colors`}>
                      {selectedCategories.uncategorized && <span className="text-white text-lg">✓</span>}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">未打标</div>
                      <div className="text-xs text-gray-500">{stats.uncategorized} 张图片</div>
                    </div>
                  </div>
                  <div className="text-2xl text-gray-500">○</div>
                </div>
              </button>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 neu-button rounded-xl text-gray-600 font-medium transition-all hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-6 py-3 neu-button rounded-xl text-green-600 font-medium transition-all hover:text-green-700"
              >
                开始导出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Exporter;
