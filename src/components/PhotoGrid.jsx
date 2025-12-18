import { FixedSizeGrid as Grid } from 'react-window';
import usePhotoStore from '../store/usePhotoStore';
import PhotoItem from './PhotoItem';

function PhotoGrid() {
  const photos = usePhotoStore((state) => state.photos);
  const columns = usePhotoStore((state) => state.columns);

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e0e5ec]">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 neu-card rounded-3xl flex items-center justify-center">
            <span className="text-5xl text-gray-400">⚡</span>
          </div>
          <div className="text-xl font-light text-gray-500 mb-2">暂无图片</div>
          <div className="text-sm text-gray-400">点击上方 "导入文件夹" 开始挑图</div>
        </div>
      </div>
    );
  }

  const columnCount = columns;
  const rowCount = Math.ceil(photos.length / columnCount);

  // 计算网格尺寸
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight - 160; // 减去工具栏和状态栏
  const columnWidth = Math.floor(containerWidth / columnCount);
  const rowHeight = columnWidth;

  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    const photo = photos[index];

    if (!photo) return null;

    return <PhotoItem photo={photo} style={style} />;
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#e0e5ec]">
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={containerWidth}
      >
        {Cell}
      </Grid>
    </div>
  );
}

export default PhotoGrid;
