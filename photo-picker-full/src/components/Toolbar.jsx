import usePhotoStore from '../store/usePhotoStore';
import FileImporter from './FileImporter';
import Exporter from './Exporter';

function Toolbar() {
  const columns = usePhotoStore((state) => state.columns);
  const setColumns = usePhotoStore((state) => state.setColumns);
  const clearPhotos = usePhotoStore((state) => state.clearPhotos);
  const photos = usePhotoStore((state) => state.photos);

  const columnOptions = [2, 3, 5];

  const handleClear = () => {
    if (photos.length === 0) return;
    if (confirm(`确定要清空所有 ${photos.length} 张图片吗?\n(此操作不可撤销)`)) {
      clearPhotos();
    }
  };

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
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-4">
          <FileImporter />
          <Exporter />
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
}

export default Toolbar;
