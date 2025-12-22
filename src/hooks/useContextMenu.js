import { useState, useEffect } from 'react';

/**
 * 右键菜单 Hook
 * 管理右键菜单的显示和关闭
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);

    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const openContextMenu = (x, y, photoId) => {
    setContextMenu({ x, y, photoId });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}
