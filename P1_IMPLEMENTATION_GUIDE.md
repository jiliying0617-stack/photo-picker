# P1任务实施指南

## 📋 任务概览

| 任务 | 预计时间 | 优先级 | 难度 |
|------|---------|--------|------|
| P1-5: 拆分LightboxPreview | 18小时 | 高 | ⭐⭐⭐⭐⭐ |
| P1-6: 简化VirtualPhotoGrid | 6小时 | 中 | ⭐⭐⭐ |
| P1-7: 测试核心组件 | 12小时 | 高 | ⭐⭐⭐⭐ |
| **总计** | **36小时** | - | - |

---

## 🎯 任务P1-5: 拆分LightboxPreview (1035行 → <300行)

### 当前状态分析

**文件**: `src/components/LightboxPreview.jsx`
**行数**: 1035行
**问题**:
- 12个`useState`（状态管理失控）
- 单一组件承担过多职责
- 难以测试和维护

### 拆分策略

#### 阶段1: 提取状态管理（3小时）

**目标**: 使用`useReducer`替代12个`useState`

**步骤1.1**: 创建reducer（1小时）

创建`src/hooks/useLightboxState.js`:

```javascript
import { useReducer } from 'react';

// 状态类型定义
const initialState = {
  // Transform状态
  scale: 1,
  pan: { x: 0, y: 0 },
  isPanning: false,
  startPan: { x: 0, y: 0 },

  // UI状态
  contextMenu: null,
  isCompareMode: false,
  hoveredPhotoId: null,
  copyPathNotification: false,

  // 数据状态
  lastViewedPhotoId: null,
  rotations: {},
  imageDimensions: {},
  photosWithUrls: { photos: [] },
};

// Reducer函数
function lightboxReducer(state, action) {
  switch (action.type) {
    case 'SET_SCALE':
      return { ...state, scale: action.payload };

    case 'SET_PAN':
      return { ...state, pan: action.payload };

    case 'START_PANNING':
      return {
        ...state,
        isPanning: true,
        startPan: action.payload,
      };

    case 'STOP_PANNING':
      return { ...state, isPanning: false };

    case 'RESET_TRANSFORM':
      return {
        ...state,
        scale: 1,
        pan: { x: 0, y: 0 },
      };

    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };

    case 'TOGGLE_COMPARE_MODE':
      return { ...state, isCompareMode: !state.isCompareMode };

    case 'SET_HOVERED_PHOTO':
      return { ...state, hoveredPhotoId: action.payload };

    case 'SET_LAST_VIEWED_PHOTO':
      return { ...state, lastViewedPhotoId: action.payload };

    case 'SET_ROTATION':
      return {
        ...state,
        rotations: {
          ...state.rotations,
          [action.payload.photoId]: action.payload.rotation,
        },
      };

    case 'SET_IMAGE_DIMENSIONS':
      return {
        ...state,
        imageDimensions: {
          ...state.imageDimensions,
          [action.payload.photoId]: action.payload.dimensions,
        },
      };

    case 'SET_PHOTOS_WITH_URLS':
      return { ...state, photosWithUrls: action.payload };

    case 'SHOW_COPY_NOTIFICATION':
      return { ...state, copyPathNotification: true };

    case 'HIDE_COPY_NOTIFICATION':
      return { ...state, copyPathNotification: false };

    default:
      return state;
  }
}

// Custom Hook
export function useLightboxState() {
  const [state, dispatch] = useReducer(lightboxReducer, initialState);

  return {
    // 状态
    scale: state.scale,
    pan: state.pan,
    isPanning: state.isPanning,
    startPan: state.startPan,
    contextMenu: state.contextMenu,
    isCompareMode: state.isCompareMode,
    hoveredPhotoId: state.hoveredPhotoId,
    copyPathNotification: state.copyPathNotification,
    lastViewedPhotoId: state.lastViewedPhotoId,
    rotations: state.rotations,
    imageDimensions: state.imageDimensions,
    photosWithUrls: state.photosWithUrls,

    // Actions
    setScale: scale => dispatch({ type: 'SET_SCALE', payload: scale }),
    setPan: pan => dispatch({ type: 'SET_PAN', payload: pan }),
    startPanning: startPan => dispatch({ type: 'START_PANNING', payload: startPan }),
    stopPanning: () => dispatch({ type: 'STOP_PANNING' }),
    resetTransform: () => dispatch({ type: 'RESET_TRANSFORM' }),
    setContextMenu: menu => dispatch({ type: 'SET_CONTEXT_MENU', payload: menu }),
    toggleCompareMode: () => dispatch({ type: 'TOGGLE_COMPARE_MODE' }),
    setHoveredPhoto: photoId => dispatch({ type: 'SET_HOVERED_PHOTO', payload: photoId }),
    setLastViewedPhoto: photoId => dispatch({ type: 'SET_LAST_VIEWED_PHOTO', payload: photoId }),
    setRotation: (photoId, rotation) =>
      dispatch({ type: 'SET_ROTATION', payload: { photoId, rotation } }),
    setImageDimensions: (photoId, dimensions) =>
      dispatch({ type: 'SET_IMAGE_DIMENSIONS', payload: { photoId, dimensions } }),
    setPhotosWithUrls: photos => dispatch({ type: 'SET_PHOTOS_WITH_URLS', payload: photos }),
    showCopyNotification: () => dispatch({ type: 'SHOW_COPY_NOTIFICATION' }),
    hideCopyNotification: () => dispatch({ type: 'HIDE_COPY_NOTIFICATION' }),
  };
}
```

**步骤1.2**: 编写状态管理测试（1小时）

创建`src/hooks/useLightboxState.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLightboxState } from './useLightboxState';

describe('useLightboxState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLightboxState());

    expect(result.current.scale).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
    expect(result.current.isPanning).toBe(false);
    expect(result.current.isCompareMode).toBe(false);
  });

  it('should update scale', () => {
    const { result } = renderHook(() => useLightboxState());

    act(() => {
      result.current.setScale(2);
    });

    expect(result.current.scale).toBe(2);
  });

  it('should update pan', () => {
    const { result } = renderHook(() => useLightboxState());

    act(() => {
      result.current.setPan({ x: 100, y: 50 });
    });

    expect(result.current.pan).toEqual({ x: 100, y: 50 });
  });

  it('should reset transform', () => {
    const { result } = renderHook(() => useLightboxState());

    act(() => {
      result.current.setScale(2);
      result.current.setPan({ x: 100, y: 50 });
      result.current.resetTransform();
    });

    expect(result.current.scale).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
  });

  it('should toggle compare mode', () => {
    const { result } = renderHook(() => useLightboxState());

    act(() => {
      result.current.toggleCompareMode();
    });

    expect(result.current.isCompareMode).toBe(true);

    act(() => {
      result.current.toggleCompareMode();
    });

    expect(result.current.isCompareMode).toBe(false);
  });

  // ... 更多测试用例
});
```

**步骤1.3**: 在LightboxPreview中应用新状态管理（1小时）

更新`src/components/LightboxPreview.jsx`:

```javascript
import { useLightboxState } from '../hooks/useLightboxState';

function LightboxPreview({ photos, onClose, allPhotos, onGroupChange }) {
  // ✅ 使用新的状态管理
  const lightboxState = useLightboxState();

  // ✅ 替换所有useState为lightboxState
  // const [scale, setScale] = useState(1); // ❌ 删除
  // const [pan, setPan] = useState({ x: 0, y: 0 }); // ❌ 删除
  // ... 删除其他11个useState

  // 使用lightboxState.scale, lightboxState.setScale等
  // ...
}
```

---

#### 阶段2: 提取子组件（7小时）

**步骤2.1**: 创建LightboxToolbar组件（2小时）

创建`src/components/LightboxToolbar.jsx`:

```javascript
import { memo } from 'react';

const LightboxToolbar = memo(function LightboxToolbar({
  scale,
  currentGroupIndex,
  totalGroups,
  photosCount,
  isCompareMode,
  onPrevGroup,
  onNextGroup,
  onCategoryCorrect,
  onCategoryMedium,
  onCategoryWrong,
  onResetTransform,
  onClose,
}) {
  return (
    <div className="h-14 bg-black/80 flex items-center justify-between px-6 flex-shrink-0">
      {/* 左侧信息 */}
      <div className="text-white text-sm flex items-center gap-6">
        <span>对比预览 · {photosCount} 张图片</span>
        {totalGroups > 1 && (
          <span className="text-purple-400">
            第 {currentGroupIndex + 1} / {totalGroups} 组
          </span>
        )}
        <span className="text-blue-400">缩放: {(scale * 100).toFixed(0)}%</span>
        {isCompareMode && (
          <span className="text-purple-400 font-bold animate-pulse">
            🔀 相邻循环对比模式
          </span>
        )}
        <span className="text-gray-400 text-xs">
          {totalGroups > 1 ? '空格键:第1图不动其余切换 · ↓键:全部切换 · ' : ''}
          按住Q叠图对比 · 滚轮缩放 · 拖拽平移 · R键重置
        </span>
      </div>

      {/* 右侧按钮 */}
      <div className="flex items-center gap-2">
        {totalGroups > 1 && (
          <>
            <button
              onClick={onPrevGroup}
              disabled={currentGroupIndex === 0}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentGroupIndex === 0
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              ↑ 上一组
            </button>
            <button
              onClick={onNextGroup}
              disabled={currentGroupIndex === totalGroups - 1}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentGroupIndex === totalGroups - 1
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              ↓ 下一组
            </button>
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
          </>
        )}

        <button
          onClick={onCategoryCorrect}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
        >
          1️⃣ 正确
        </button>
        <button
          onClick={onCategoryMedium}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
        >
          2️⃣ 适中
        </button>
        <button
          onClick={onCategoryWrong}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
        >
          3️⃣ 错误
        </button>

        <div className="w-px h-6 bg-gray-600 mx-2"></div>

        <button
          onClick={onResetTransform}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
        >
          重置缩放
        </button>

        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
        >
          ESC 关闭
        </button>
      </div>
    </div>
  );
});

export default LightboxToolbar;
```

创建测试`src/components/LightboxToolbar.test.jsx` (30分钟)

**步骤2.2**: 创建LightboxImageViewer组件（3小时）

创建`src/components/LightboxImageViewer.jsx` - 这是最复杂的子组件，包含图片显示、缩放、平移等逻辑。

**步骤2.3**: 创建LightboxControls组件（2小时）

创建`src/components/LightboxControls.jsx` - 底部提示栏和键盘说明。

---

#### 阶段3: 重构主组件（4小时）

**步骤3.1**: 简化LightboxPreview.jsx（2小时）

```javascript
import { useLightboxState } from '../hooks/useLightboxState';
import LightboxToolbar from './LightboxToolbar';
import LightboxImageViewer from './LightboxImageViewer';
import LightboxControls from './LightboxControls';

const LightboxPreview = memo(function LightboxPreview({
  photos,
  onClose,
  allPhotos,
  onGroupChange,
}) {
  // 状态管理
  const lightboxState = useLightboxState();

  // 业务逻辑hooks
  const { handleCategory, handleRotate } = useLightboxActions(photos, lightboxState);
  const { handleNextGroup, handlePrevGroup } = useLightboxNavigation(
    allPhotos,
    onGroupChange,
    lightboxState
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <LightboxToolbar
        scale={lightboxState.scale}
        currentGroupIndex={currentGroupIndex}
        totalGroups={totalGroups}
        photosCount={photos.length}
        isCompareMode={lightboxState.isCompareMode}
        onPrevGroup={handlePrevGroup}
        onNextGroup={handleNextGroup}
        onCategoryCorrect={() => handleCategory('correct')}
        onCategoryMedium={() => handleCategory('medium')}
        onCategoryWrong={() => handleCategory('wrong')}
        onResetTransform={lightboxState.resetTransform}
        onClose={() => onClose(lightboxState.lastViewedPhotoId)}
      />

      <LightboxImageViewer
        photos={lightboxState.photosWithUrls.photos}
        scale={lightboxState.scale}
        pan={lightboxState.pan}
        rotations={lightboxState.rotations}
        imageDimensions={lightboxState.imageDimensions}
        isCompareMode={lightboxState.isCompareMode}
        hoveredPhotoId={lightboxState.hoveredPhotoId}
        onMouseDown={handleMouseDown}
        onImageLoad={handleImageLoad}
        onPhotoClick={handlePhotoClick}
        onPhotoHover={lightboxState.setHoveredPhoto}
      />

      <LightboxControls totalGroups={totalGroups} />
    </div>
  );
});
```

**步骤3.2**: 提取业务逻辑hooks（2小时）

创建`src/hooks/useLightboxActions.js`和`src/hooks/useLightboxNavigation.js`

---

#### 阶段4: 测试（4小时）

**步骤4.1**: 单元测试子组件（2小时）
- LightboxToolbar.test.jsx
- LightboxImageViewer.test.jsx
- LightboxControls.test.jsx

**步骤4.2**: 集成测试（2小时）
- LightboxPreview.test.jsx - 完整流程测试

---

## 🎯 任务P1-6: 简化VirtualPhotoGrid (13 props → 6 props)

### 实施步骤

**步骤1**: 设计props接口（1小时）

创建TypeScript类型定义（或JSDoc）:

```javascript
/**
 * @typedef {Object} LayoutConfig
 * @property {number} columns - 列数
 * @property {boolean} isCompareMode - 对比模式
 */

/**
 * @typedef {Object} SelectionState
 * @property {string|null} selectedId - 当前选中的照片ID
 * @property {string[]} selectedIds - 多选的照片ID数组
 * @property {Function} onSelect - 选择回调 (photoId, isMultiSelect) => void
 */

/**
 * @typedef {Object} GridActions
 * @property {Function} onCategory - 分类回调 (photoId, category) => void
 * @property {Function} onPreview - 预览回调 (photos) => void
 * @property {Function} onContextMenu - 右键菜单回调 (x, y, photoId) => void
 */

/**
 * @typedef {Object} GridRefs
 * @property {Function} setPhotoRef - 设置photo DOM引用
 * @property {Function} [onGridReady] - Grid准备完成回调
 */
```

**步骤2**: 更新VirtualPhotoGrid实现（2小时）

```javascript
const VirtualPhotoGrid = memo(function VirtualPhotoGrid({
  photos,
  layout,
  selection,
  actions,
  refs,
  onPreviewGroupChange,
}) {
  // 解构分组props
  const { columns, isCompareMode } = layout;
  const { selectedId, selectedIds, onSelect } = selection;
  const { onCategory, onPreview, onContextMenu } = actions;
  const { setPhotoRef, onGridReady } = refs;

  // ... 原有逻辑保持不变，只是使用解构后的props
});
```

**步骤3**: 更新App.jsx中的调用（2小时）

```javascript
<VirtualPhotoGrid
  photos={displayPhotos}
  layout={{
    columns: compareColumns,
    isCompareMode: isCompareMode,
  }}
  selection={{
    selectedId: selectedPhotoId,
    selectedIds: selectedPhotos,
    onSelect: handlePhotoSelect,
  }}
  actions={{
    onCategory: setCategory,
    onPreview: openPreview,
    onContextMenu: openContextMenu,
  }}
  refs={{
    setPhotoRef: setPhotoRef,
    onGridReady: handleGridRefReady,
  }}
  onPreviewGroupChange={setCurrentPreviewGroupIndex}
/>
```

**步骤4**: 测试（1小时）

---

## 🎯 任务P1-7: 测试核心组件

### LightboxPreview测试（4小时）

创建`src/components/LightboxPreview.test.jsx`:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LightboxPreview from './LightboxPreview';

describe('LightboxPreview', () => {
  const mockPhotos = [
    { id: '1', name: 'photo1.jpg', file: new File([''], 'photo1.jpg') },
    { id: '2', name: 'photo2.jpg', file: new File([''], 'photo2.jpg') },
  ];

  it('should render photos', () => {
    const onClose = vi.fn();
    render(<LightboxPreview photos={mockPhotos} onClose={onClose} />);

    // 验证照片显示
    expect(screen.getByText(/2 张图片/)).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<LightboxPreview photos={mockPhotos} onClose={onClose} />);

    const closeButton = screen.getByText(/关闭/);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  // ... 更多测试
});
```

### VirtualPhotoGrid测试（4小时）

创建`src/components/VirtualPhotoGrid.test.jsx` - 重点测试虚拟滚动和性能。

### Exporter测试（4小时）

创建`src/components/Exporter.test.jsx` - 测试导出流程。

---

## 📊 验收标准

### P1-5验收标准
- [ ] LightboxPreview.jsx < 250行
- [ ] 创建3个子组件，每个 < 300行
- [ ] 使用useReducer替代useState
- [ ] 所有子组件有单元测试
- [ ] 集成测试通过
- [ ] 原有功能完全保持

### P1-6验收标准
- [ ] VirtualPhotoGrid props ≤ 6个
- [ ] Props接口清晰（分组合理）
- [ ] 所有调用方已更新
- [ ] 测试覆盖率 > 70%
- [ ] 原有功能完全保持

### P1-7验收标准
- [ ] LightboxPreview测试覆盖率 > 70%
- [ ] VirtualPhotoGrid测试覆盖率 > 75%
- [ ] Exporter测试覆盖率 > 70%
- [ ] 所有核心功能有测试
- [ ] 性能测试通过（1000+照片）

---

## ⚠️ 风险管理

### 高风险点

1. **LightboxPreview重构**
   - **风险**: 巨型组件，逻辑复杂，容易引入bug
   - **缓解**: 小步迭代，每次提取一个子组件并测试

2. **VirtualPhotoGrid props变更**
   - **风险**: 破坏现有调用方
   - **缓解**: 先保持向后兼容，逐步迁移

3. **测试编写**
   - **风险**: 核心组件mock复杂，测试难写
   - **缓解**: 优先测试关键路径，不追求100%覆盖

### 时间风险

**预计36小时，实际可能需要45-50小时**

原因：
- 巨型组件重构复杂度被低估
- 测试编写比预期困难
- 可能需要多次迭代才能达到满意效果

### 质量风险

**可能无法一次性达到A+级**

现实预期：
- 完成P1任务后达到A-级（8.5/10）
- 需要Week 3继续优化才能达到A+级（9.5/10）

---

## 🎯 执行建议

### 优先级排序

1. **最高优先级**: P1-6（简化VirtualPhotoGrid）
   - 风险低，时间短，收益明显
   - 6小时可完成

2. **高优先级**: P1-7（测试核心组件）
   - 提供测试保护，降低后续重构风险
   - 12小时

3. **中优先级**: P1-5（拆分LightboxPreview）
   - 最复杂，最耗时
   - 18小时
   - 建议分4个阶段，每个阶段独立验收

### 小步迭代策略

**不要一次性完成所有P1任务**

建议分批执行：
- **第1批**: P1-6（6小时）- 快速见效
- **第2批**: P1-7部分（VirtualPhotoGrid测试，4小时）
- **第3批**: P1-5阶段1-2（10小时）- 拆分LightboxPreview
- **第4批**: P1-7剩余（Lightbox测试，4小时）
- **第5批**: P1-5阶段3-4（8小时）- 完成LightboxPreview重构

**每批完成后**:
- 运行所有测试
- 手动验证核心功能
- Git commit保存进度
- 如有问题，可以回滚

---

## ✅ 总结

**P1任务是Week 2-3的核心工作**

- **预计总时间**: 36-50小时
- **最终质量目标**: A-级（8.5/10）
- **实施策略**: 小步迭代，测试驱动，持续验证

**成功的关键**:
1. 不要急于求成，小步前进
2. 每次修改后立即测试
3. 保持代码可运行状态
4. 遇到问题及时回滚

**现实的期望**:
- P1任务完成后不会达到A+级
- 但会为Week 3的优化工作打下坚实基础
- 代码质量会有显著提升（D→C+→A-）

---

**指南创建时间**: 2025-01-05
**预计开始时间**: 根据团队安排
**预计完成时间**: 3-4个工作日（每天8-10小时）
