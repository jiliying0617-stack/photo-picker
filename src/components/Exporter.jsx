import { useState, memo } from 'react';
import usePhotoStore from '../store/usePhotoStore';
import { exportPhotos, isFileSystemAccessSupported } from '../utils/fileSystem';

const Exporter = memo(function Exporter({ toast }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    correct: true,
    medium: true,
    wrong: true,
    uncategorized: false
  });
  const [exportOptions, setExportOptions] = useState({
    keepOriginalNames: true,     // 保留原文件名
    keepFolderStructure: true    // 保留文件夹结构
  });

  const photos = usePhotoStore((state) => state.photos);
  const getStats = usePhotoStore((state) => state.getStats);

  // 计算实际可导出的照片数量（只统计有 file 对象的照片）
  const getExportableStats = () => {
    const photosWithFile = photos.filter(p => p.file);
    return {
      total: photosWithFile.length,
      correct: photosWithFile.filter(p => p.category === 'correct').length,
      medium: photosWithFile.filter(p => p.category === 'medium').length,
      wrong: photosWithFile.filter(p => p.category === 'wrong').length,
      uncategorized: photosWithFile.filter(p => !p.category).length,
    };
  };

  const handleOpenModal = () => {
    if (photos.length === 0) {
      toast.warning('没有图片可导出!');
      return;
    }

    if (!isFileSystemAccessSupported()) {
      toast.error('您的浏览器不支持文件夹导出功能。请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    setShowModal(true);
  };

  const handleExport = async () => {
    // 根据选择过滤要导出的图片
    const photosToExport = photos.filter(photo => {
      if (photo.category) {
        return selectedCategories[photo.category];
      } else {
        return selectedCategories.uncategorized;
      }
    });

    // 🔍 诊断：检查数据一致性
    console.group('📊 导出诊断信息');
    console.log('总照片数:', photos.length);
    console.log('选择的分类:', selectedCategories);

    // 统计每个分类的数量（包括详细信息）
    const categoryCount = {
      correct: 0,
      medium: 0,
      wrong: 0,
      uncategorized: 0,
      other: 0  // 异常分类
    };
    const categoryPhotos = {
      correct: [],
      medium: [],
      wrong: [],
      uncategorized: [],
      other: []
    };

    photos.forEach(photo => {
      const cat = photo.category || 'uncategorized';
      if (categoryCount[cat] !== undefined) {
        categoryCount[cat]++;
        // 保存完整的照片信息用于诊断
        categoryPhotos[cat].push({
          id: photo.id,
          path: photo.path,
          name: photo.name,
          category: photo.category
        });
      } else {
        categoryCount.other++;
        categoryPhotos.other.push({
          id: photo.id,
          path: photo.path,
          name: photo.name,
          category: photo.category
        });
      }
    });

    console.log('实际分类统计:', categoryCount);
    console.log('待导出照片数:', photosToExport.length);

    // 检查重复 ID
    const idSet = new Set();
    const duplicateIds = [];
    photos.forEach(photo => {
      if (idSet.has(photo.id)) {
        duplicateIds.push({
          id: photo.id,
          path: photo.path,
          name: photo.name
        });
      }
      idSet.add(photo.id);
    });
    if (duplicateIds.length > 0) {
      console.error('⚠️ 发现重复的照片 ID:', duplicateIds);
    }

    // 检查重复 path
    const pathSet = new Set();
    const duplicatePaths = [];
    photos.forEach(photo => {
      if (pathSet.has(photo.path)) {
        duplicatePaths.push({
          path: photo.path,
          id: photo.id,
          name: photo.name
        });
      }
      pathSet.add(photo.path);
    });
    if (duplicatePaths.length > 0) {
      console.error('⚠️ 发现重复的照片路径:', duplicatePaths);
    }

    // 检查异常分类
    if (categoryCount.other > 0) {
      console.error('⚠️ 发现异常分类的照片:', categoryPhotos.other);
    }

    // 🆕 详细列出"正确"分类的所有照片
    if (selectedCategories.correct && categoryPhotos.correct.length > 0) {
      console.log('\n📋 "正确 ✓" 分类的所有照片:');
      console.table(categoryPhotos.correct);
    }

    // 🆕 列出其他选中分类的照片
    if (selectedCategories.medium && categoryPhotos.medium.length > 0) {
      console.log('\n📋 "适中 ~" 分类的所有照片:');
      console.table(categoryPhotos.medium);
    }

    if (selectedCategories.wrong && categoryPhotos.wrong.length > 0) {
      console.log('\n📋 "错误 ✕" 分类的所有照片:');
      console.table(categoryPhotos.wrong);
    }

    console.groupEnd();

    if (photosToExport.length === 0) {
      toast.warning('请至少选择一个分类进行导出!');
      return;
    }

    // 检查文件对象是否存在
    const photosWithoutFile = photosToExport.filter(p => !p.file);
    if (photosWithoutFile.length > 0) {
      const missingRatio = Math.round((photosWithoutFile.length / photosToExport.length) * 100);
      if (!confirm(
        `警告: 检测到 ${photosWithoutFile.length} 张图片缺少文件对象 (${missingRatio}%)\n\n` +
        `可能原因:\n` +
        `· 刷新页面后需要重新导入文件夹\n` +
        `· 部分图片在导入时读取失败\n\n` +
        `建议: 重新导入文件夹后再导出\n\n` +
        `是否继续导出? (只会导出有文件对象的 ${photosToExport.length - photosWithoutFile.length} 张图片)`
      )) {
        return;
      }
    }

    setShowModal(false);
    setExporting(true);
    setProgress({ current: 0, total: photosToExport.length });

    try {
      const result = await exportPhotos(
        photosToExport,
        selectedCategories,
        (p) => {
          setProgress(p);
        },
        exportOptions
      );

      // 如果用户取消了选择
      if (result.cancelled) {
        toast.info('导出已取消');
        return;
      }

      if (result.exported > 0) {
        // 使用后端返回的实际导出数量（exportedByCategory）
        // 这是实际成功写入磁盘的文件数量，比前端计算更准确
        const exportedByCategory = result.exportedByCategory || {
          correct: 0,
          medium: 0,
          wrong: 0,
          uncategorized: 0
        };

        const exportedStats = [];
        if (selectedCategories.correct && exportedByCategory.correct > 0) {
          exportedStats.push(`· 正确_Correct/ - ${exportedByCategory.correct} 张`);
        }
        if (selectedCategories.medium && exportedByCategory.medium > 0) {
          exportedStats.push(`· 适中_Medium/ - ${exportedByCategory.medium} 张`);
        }
        if (selectedCategories.wrong && exportedByCategory.wrong > 0) {
          exportedStats.push(`· 错误_Wrong/ - ${exportedByCategory.wrong} 张`);
        }
        if (selectedCategories.uncategorized && exportedByCategory.uncategorized > 0) {
          exportedStats.push(`· 未标记_Uncategorized/ - ${exportedByCategory.uncategorized} 张`);
        }

        let message = `导出完成!\n\n` +
          `成功导出: ${result.exported} / ${result.total} 张\n` +
          `目标文件夹: ${result.folderName}\n\n` +
          `已创建子文件夹:\n` +
          exportedStats.join('\n');

        // 如果有错误，显示错误信息
        if (result.errors && result.errors.length > 0) {
          message += `\n\n⚠️ 部分文件导出失败 (${result.errors.length} 个):\n`;
          message += result.errors.slice(0, 5).map(e => `· ${e.file}: ${e.error}`).join('\n');
          if (result.errors.length > 5) {
            message += `\n· ... 还有 ${result.errors.length - 5} 个错误`;
          }
        }

        toast.success(message.replace(/\n/g, ' | '));
      } else {
        toast.error('没有成功导出任何文件，请检查文件是否存在或浏览器权限设置。');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error(`导出失败: ${error.message} | 请确保: 1.使用Chrome/Edge 2.授予写入权限 3.磁盘空间充足`);
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
  const exportableStats = getExportableStats(); // 实际可导出的照片数量
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
              {stats.total > exportableStats.total && (
                <div className="mt-3 p-2 neu-concave rounded-lg">
                  <p className="text-xs text-gray-600">
                    ⚠️ {stats.total - exportableStats.total} 张图片缺少文件，将跳过
                  </p>
                </div>
              )}
            </div>

            {/* 导出选项 */}
            <div className="mb-6 p-4 neu-concave rounded-2xl">
              <div className="text-sm font-medium text-gray-700 mb-3">导出选项</div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.keepOriginalNames}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, keepOriginalNames: e.target.checked }))}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <div className="text-sm text-gray-800">保留原文件名</div>
                    <div className="text-xs text-gray-500">仅移除非法字符,保留中文和特殊符号</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.keepFolderStructure}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, keepFolderStructure: e.target.checked }))}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <div className="text-sm text-gray-800">保留文件夹结构</div>
                    <div className="text-xs text-gray-500">在分类文件夹下保持原始目录层级</div>
                  </div>
                </label>
              </div>
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
                      <div className="text-xs text-gray-500">{exportableStats.correct} 张可导出</div>
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
                      <div className="text-xs text-gray-500">{exportableStats.medium} 张可导出</div>
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
                      <div className="text-xs text-gray-500">{exportableStats.wrong} 张可导出</div>
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
                      <div className="text-xs text-gray-500">{exportableStats.uncategorized} 张可导出</div>
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
});

export default Exporter;
