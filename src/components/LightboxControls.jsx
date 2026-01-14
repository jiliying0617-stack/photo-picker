import { memo } from 'react';

/**
 * Lightbox底部控制提示栏组件
 *
 * 显示键盘快捷键提示,帮助用户了解可用操作
 *
 * @param {Object} props - 组件props
 * @param {boolean} props.hasNavigation - 是否显示导航提示 (多组图片时)
 */
const LightboxControls = memo(function LightboxControls({ hasNavigation }) {
  return (
    <div className="h-10 bg-black/80 flex items-center justify-center gap-8 px-6 text-xs text-gray-400 flex-shrink-0">
      {hasNavigation && (
        <>
          <span className="text-cyan-400">空格 第1图不动其余切换</span>
          <span className="text-cyan-400">↓ 全部切换</span>
        </>
      )}
      <span className="text-purple-400">按住Q 叠图对比</span>
      <span>滚轮 缩放</span>
      <span>拖拽 平移</span>
      <span>R 重置</span>
      <span className="text-green-400">1 正确</span>
      <span className="text-yellow-400">2 适中</span>
      <span className="text-red-400">3 错误</span>
      <span>ESC 关闭</span>
    </div>
  );
});

export default LightboxControls;
