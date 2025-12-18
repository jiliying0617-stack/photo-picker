# 代码审查 - Linus 风格

## 总体评价

2535 行代码，做了一个图片筛选工具。**不算太糟**，但有改进空间。

---

## ✅ 做得好的地方

### 1. 架构清晰
```
src/
├── components/  # 组件分离合理
├── store/       # 状态管理独立
└── utils/       # 工具函数分离
```

**评价：** 结构清晰，职责分明。Good.

### 2. 使用了合适的工具
- React 19 - 最新版本
- Zustand - 轻量级状态管理（比 Redux 好多了）
- Vite - 快速构建工具
- Tailwind CSS - 样式方案合理

**评价：** 技术选型务实，没有过度工程化。

### 3. 虚拟滚动
处理 2000+ 图片没有用虚拟列表库，而是手动实现了懒加载。

**评价：** 简单有效，避免了不必要的依赖。

---

## ❌ 需要优化的地方

### 问题 1：状态管理过度分散

**当前代码（App.jsx）：**
```javascript
const photos = usePhotoStore((state) => state.photos);
const columns = usePhotoStore((state) => state.columns);
const setCategory = usePhotoStore((state) => state.setCategory);
const selectedPhotoId = usePhotoStore((state) => state.selectedPhotoId);
const setSelectedPhotoId = usePhotoStore((state) => state.setSelectedPhotoId);

const [displayCount, setDisplayCount] = useState(100);
const [filterFn, setFilterFn] = useState(() => null);
const [selectedFolders, setSelectedFolders] = useState([]);
const [selectedPhotos, setSelectedPhotos] = useState([]);
const [isSelecting, setIsSelecting] = useState(false);
const [previewPhotos, setPreviewPhotos] = useState(null);
const [isDragging, setIsDragging] = useState(false);
```

**问题：** 太多 state！12 个状态变量。这是典型的"状态地狱"。

**优化方案：**

1. **把 UI 状态也放进 Zustand**：
```javascript
// store/useUIStore.js
const useUIStore = create((set) => ({
  displayCount: 100,
  filterFn: null,
  selectedFolders: [],
  selectedPhotos: [],
  isSelecting: false,
  previewPhotos: null,
  isDragging: false,

  setDisplayCount: (count) => set({ displayCount: count }),
  setFilterFn: (fn) => set({ filterFn: fn }),
  // ... 其他 setters
}));
```

2. **或者，合并相关状态**：
```javascript
const [ui, setUI] = useState({
  displayCount: 100,
  filterFn: null,
  selectedFolders: [],
  isDragging: false
});

const [selection, setSelection] = useState({
  photos: [],
  isSelecting: false
});
```

**为什么这样更好：**
- 减少重渲染
- 状态更新更原子化
- 更容易追踪状态变化

---

### 问题 2：过度使用 useMemo

**当前代码：**
```javascript
const displayPhotos = useMemo(() => {
  // 50+ 行的计算逻辑
}, [isCompareMode, selectedFolders, filteredPhotos, displayCount, compareColumns]);

const displayPhotosWithUrls = useMemo(() => {
  // 又一个 useMemo
}, [displayPhotos]);
```

**问题：** useMemo 滥用。依赖数组有 5 个项，任何一个变化都会重新计算。

**Linus 说：** "Premature optimization is the root of all evil."

**优化方案：**

1. **先测试是否真的有性能问题**
2. **如果没有卡顿，去掉 useMemo**
3. **只在真正慢的地方优化**

```javascript
// 简单版本（可能足够快）
const displayPhotos = isCompareMode
  ? getComparePhotos(selectedFolders, filteredPhotos)
  : filteredPhotos.slice(0, displayCount);
```

**测试方法：**
```javascript
console.time('displayPhotos');
const result = computeDisplayPhotos();
console.timeEnd('displayPhotos');
```

如果 < 16ms（60fps），不需要优化。

---

### 问题 3：魔术数字

**当前代码：**
```javascript
const [displayCount, setDisplayCount] = useState(100);

if (target.scrollHeight - target.scrollTop <= target.clientHeight + 500) {
  setDisplayCount(prev => Math.min(prev + 50, filteredPhotos.length));
}
```

**问题：** 100, 500, 50 这些数字是什么意思？

**优化方案：**
```javascript
const INITIAL_DISPLAY_COUNT = 100;
const SCROLL_THRESHOLD = 500; // 距离底部多少像素开始加载
const LOAD_INCREMENT = 50;    // 每次加载多少张

const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

if (target.scrollHeight - target.scrollTop <= target.clientHeight + SCROLL_THRESHOLD) {
  setDisplayCount(prev => Math.min(prev + LOAD_INCREMENT, filteredPhotos.length));
}
```

---

### 问题 4：文件太大

**当前文件大小：**
- `App.jsx` - 可能超过 400 行
- `fileSystem.js` - 包含太多功能

**Linus 说：** "函数不应该超过一屏"

**优化方案：**

1. **拆分 App.jsx**：
```
src/
├── App.jsx (只负责组合)
├── hooks/
│   ├── usePhotoDisplay.js   # 图片显示逻辑
│   ├── usePhotoSelection.js # 图片选择逻辑
│   └── useKeyboardShortcuts.js # 快捷键逻辑
```

2. **拆分 fileSystem.js**：
```
src/utils/
├── fileImport.js   # 导入相关
├── fileExport.js   # 导出相关
└── fileAccess.js   # 文件系统访问
```

---

### 问题 5：错误处理不足

**当前代码：**
```javascript
try {
  const result = await exportPhotos(...);
} catch (error) {
  console.error('导出失败:', error);
  alert(`导出失败: ${error.message}`);
}
```

**问题：**
- 用 `alert()` - 2024 年了还在用 alert？
- 错误信息不友好
- 没有错误恢复机制

**优化方案：**

1. **自定义 Toast 组件**（不要用 alert）
2. **详细的错误类型**：
```javascript
class ExportError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// 使用
if (photos.length === 0) {
  throw new ExportError(
    '没有可导出的图片',
    'NO_PHOTOS',
    { count: 0 }
  );
}
```

---

## 🚀 优化建议优先级

### P0 - 立即修复
1. ✅ 删除无用文件（已完成）
2. 去掉 alert()，用 Toast
3. 添加常量定义（去除魔术数字）

### P1 - 重要但不紧急
1. 整合状态管理
2. 拆分大文件
3. 改进错误处理

### P2 - 可选优化
1. 性能测试后再决定是否需要 useMemo
2. 添加单元测试
3. TypeScript 类型定义

---

## 📊 代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构 | 8/10 | 结构清晰，但状态管理可改进 |
| 可读性 | 7/10 | 大部分清晰，但有些文件太长 |
| 性能 | 7/10 | 虚拟滚动好，但有过度优化倾向 |
| 错误处理 | 5/10 | 基本的 try-catch，但不够友好 |
| 可维护性 | 7/10 | 组件化好，但耦合度可降低 |

**总分：** 6.8/10

---

## 🎯 Linus 的最终评价

> "This is decent code. It works. It's not perfect, but perfect is the enemy of good.
>
> The main issues are:
> 1. Too many states - consolidate them
> 2. Stop using alert() - it's 2024
> 3. Magic numbers everywhere
>
> But the architecture is solid. The file organization makes sense. You didn't over-engineer it with unnecessary abstractions.
>
> Fix the small things, and this will be good code.
>
> Grade: **B+**
>
> Now go deploy it and let users find the real bugs."

---

## 📝 行动计划

### 今天做：
1. 去掉 alert()
2. 定义常量
3. 测试部署

### 本周做：
1. 整合状态管理
2. 拆分大文件

### 有空做：
1. 性能优化（如果真的慢）
2. 添加测试
3. TypeScript（如果团队需要）

---

**记住 Linus 的名言：**

> "Talk is cheap. Show me the code."

代码能跑，就先部署。优化可以慢慢来。
