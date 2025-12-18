import { useState } from 'react';
import usePhotoStore from '../store/usePhotoStore';

function FolderPanel({ onFilterChange, onSelectedFoldersChange }) {
  const photos = usePhotoStore((state) => state.photos);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [lastSelected, setLastSelected] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // 构建文件夹树
  const buildFolderTree = () => {
    const tree = {};

    photos.forEach(photo => {
      const parts = photo.path.split('/');

      // 构建树结构
      let current = tree;
      let currentPath = '';

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        if (isFile) return; // 跳过文件名

        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            children: {},
            photos: [],
            count: 0
          };
        }

        current[part].photos.push(photo);
        current[part].count++;
        current = current[part].children;
      });
    });

    return tree;
  };

  const folderTree = buildFolderTree();

  // 扁平化文件夹列表(用于 Shift 选择)
  const flattenFolders = (tree, result = []) => {
    Object.values(tree).forEach(folder => {
      result.push(folder);
      if (Object.keys(folder.children).length > 0) {
        flattenFolders(folder.children, result);
      }
    });
    return result;
  };

  const allFolders = flattenFolders(folderTree);

  // 处理文件夹点击
  const handleFolderClick = (folderPath, event) => {
    let newSelection;

    if (event.shiftKey && lastSelected) {
      // Shift + 点击: 范围选择
      const lastIndex = allFolders.findIndex(f => f.path === lastSelected);
      const currentIndex = allFolders.findIndex(f => f.path === folderPath);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);

      newSelection = allFolders.slice(start, end + 1).map(f => f.path);
    } else if (event.metaKey || event.ctrlKey) {
      // Cmd/Ctrl + 点击: 多选
      if (selectedFolders.includes(folderPath)) {
        newSelection = selectedFolders.filter(f => f !== folderPath);
      } else {
        newSelection = [...selectedFolders, folderPath];
      }
    } else {
      // 单选
      newSelection = [folderPath];
    }

    setSelectedFolders(newSelection);
    updateFilter(newSelection);
    if (onSelectedFoldersChange) {
      onSelectedFoldersChange(newSelection);
    }
    setLastSelected(folderPath);
  };

  // 切换展开/折叠
  const toggleExpand = (folderPath, event) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  // 更新过滤
  const updateFilter = (selected) => {
    if (!onFilterChange) return;

    if (selected.length === 0) {
      onFilterChange(() => null);
    } else {
      onFilterChange(() => (photo) => {
        const pathParts = photo.path.split('/');
        pathParts.pop(); // 移除文件名
        const photoFolderPath = pathParts.join('/');
        return selected.some(sel => photoFolderPath.startsWith(sel));
      });
    }
  };

  // 渲染文件夹树
  const renderTree = (tree, level = 0) => {
    return Object.values(tree).map((folder) => {
      const isSelected = selectedFolders.includes(folder.path);
      const hasChildren = Object.keys(folder.children).length > 0;
      const isExpanded = expandedFolders.has(folder.path);

      return (
        <div key={folder.path} style={{ marginLeft: `${level * 12}px` }}>
          <div
            onClick={(e) => handleFolderClick(folder.path, e)}
            className={`
              neu-card rounded-xl p-2 mb-2 cursor-pointer
              transition-all duration-200
              ${isSelected ? 'neu-pressed scale-95' : 'hover:scale-105'}
            `}
          >
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={(e) => toggleExpand(folder.path, e)}
                  className="text-gray-500 hover:text-gray-700 text-xs w-4 flex-shrink-0"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              {!hasChildren && <div className="w-4 flex-shrink-0"></div>}

              <div className="flex-1 min-w-0">
                <div className={`
                  text-sm font-medium truncate
                  ${isSelected ? 'text-blue-600' : 'text-gray-700'}
                `}>
                  {isSelected && '✓ '}
                  📁 {folder.name}
                </div>
                <div className="text-xs text-gray-500">
                  {folder.count} 张
                </div>
              </div>

              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
              )}
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="ml-2">
              {renderTree(folder.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const isCompareMode = selectedFolders.length >= 2 && selectedFolders.length <= 8;

  return (
    <div className={`
      bg-[#e0e5ec] transition-all duration-300
      ${isOpen ? 'w-80' : 'w-12'}
      border-r border-gray-300 flex-shrink-0
    `}>
      <div className="h-full flex flex-col relative">
        {/* 折叠按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full neu-button rounded-r-xl px-2 py-8 text-gray-600 text-xl z-10"
        >
          {isOpen ? '‹' : '›'}
        </button>

        {isOpen && (
          <div className="h-full flex flex-col p-6">
            {/* 标题 */}
            <div className="mb-4">
              <h2 className="text-lg font-light text-gray-700 mb-2">文件夹树</h2>
              <div className="text-xs text-gray-400">
                {allFolders.length} 个文件夹 · {photos.length} 张图片
              </div>
            </div>

            {/* 多选提示 */}
            {selectedFolders.length > 0 && (
              <div className="mb-4 neu-card p-3 rounded-xl">
                <div className="text-xs text-gray-600 mb-1">
                  已选择 {selectedFolders.length} 个文件夹
                </div>
                {isCompareMode && (
                  <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <span>🔀</span>
                    <span>对比模式已激活</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedFolders([]);
                    updateFilter([]);
                    if (onSelectedFoldersChange) {
                      onSelectedFoldersChange([]);
                    }
                  }}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  清除选择
                </button>
              </div>
            )}

            {/* 快捷键提示 */}
            <div className="mb-4 neu-concave p-3 rounded-xl text-xs text-gray-500">
              <div className="font-medium mb-2">快捷键:</div>
              <div>· 点击 ▶ - 展开/折叠</div>
              <div>· Shift + 点击 - 范围选择</div>
              <div>· Cmd/Ctrl + 点击 - 多选</div>
              <div>· 选择 2-8 个 - 多列对比</div>
            </div>

            {/* 文件夹树 */}
            <div className="flex-1 overflow-auto">
              {renderTree(folderTree)}
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="h-full flex items-center justify-center">
            <div className="transform -rotate-90 whitespace-nowrap text-gray-500 text-sm font-light">
              文件夹
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderPanel;
