import { memo } from 'react';
import usePhotoStore from '../store/usePhotoStore';
import FileImporter from './FileImporter';
import Exporter from './Exporter';

const Toolbar = memo(function Toolbar({ toast }) {
  const columns = usePhotoStore((state) => state.columns);
  const setColumns = usePhotoStore((state) => state.setColumns);
  const clearPhotos = usePhotoStore((state) => state.clearPhotos);
  const clearCategories = usePhotoStore((state) => state.clearCategories);
  const photos = usePhotoStore((state) => state.photos);
  const categories = usePhotoStore((state) => state.categories);
  const groupBrowseMode = usePhotoStore((state) => state.groupBrowseMode);
  const setGroupBrowseMode = usePhotoStore((state) => state.setGroupBrowseMode);

  const columnOptions = [2, 3, 5];

  const handleClear = () => {
    if (photos.length === 0) return;
    if (confirm(`确定要清空所有 ${photos.length} 张图片吗?\n(此操作不可撤销)`)) {
      clearPhotos();
    }
  };

  const handleClearCategories = () => {
    const categoryCount = Object.keys(categories).length;
    if (categoryCount === 0) return;
    if (confirm(`确定要清空所有分类标签吗?\n共 ${categoryCount} 个标签\n(图片将保留，只清除标签)`)) {
      clearCategories();
      // 不清空图片，只清空分类标签
    }
  };

  const categoryCount = Object.keys(categories).length;

  return (
    <div className="bg-[#e0e5ec] px-8 py-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-light text-gray-700 tracking-wide">
            ⚡ 筛图神器
          </h1>

          {/* 列数切换 */}
          <div className="flex items-center gap-3">
            {columnOptions.map((col) => (
              <button
                key={col}
                onClick={() => setColumns(col)}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${columns === col
                    ? 'neu-pressed text-blue-600'
                    : 'neu-button text-gray-600 hover:text-gray-800'
                  }
                `}
              >
                {col} 列
              </button>
            ))}
          </div>

          {/* 检索组模式切换 */}
          <button
            onClick={() => setGroupBrowseMode(!groupBrowseMode)}
            className={`
              px-4 py-2 rounded-xl font-medium text-sm
              transition-all duration-200
              ${groupBrowseMode
                ? 'neu-pressed text-purple-600'
                : 'neu-button text-gray-600 hover:text-gray-800'
              }
            `}
            title="开启后可按组快速浏览和跳转照片"
          >
            {groupBrowseMode ? '🔍 检索组模式' : '🔍 检索组'}
          </button>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-4">
          <FileImporter toast={toast} />
          {categoryCount > 0 && (
            <button
              onClick={handleClearCategories}
              className="px-5 py-2 neu-button rounded-xl text-gray-600 hover:text-orange-600 font-medium text-sm"
              title={`清空 ${categoryCount} 个分类标签（图片将保留）`}
            >
              清空标签 ({categoryCount})
            </button>
          )}
          <Exporter toast={toast} />
          {photos.length > 0 && (
            <button
              onClick={handleClear}
              className="px-5 py-2 neu-button rounded-xl text-gray-600 hover:text-red-600 font-medium text-sm"
            >
              清空
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default Toolbar;
