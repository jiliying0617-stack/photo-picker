# Code Review - Linus Torvalds Style

**Date:** 2025-12-19
**Reviewer:** In the spirit of Linus Torvalds
**Project:** Photo Picker (3511 lines of JavaScript/React)

---

## Executive Summary

This is a **working photo sorting tool**. It works. Users can use it. That's the most important thing.

BUT - and this is a big BUT - there are some serious code quality issues that need fixing. Not "nice to have" fixes. **Must fix** if you want this to be maintainable long-term.

**Overall Grade: C+**

It works, which gets you a C. The architecture isn't terrible, which bumps it to C+. But let's be clear: **this code has real problems**.

---

## 📊 Code Statistics

```
Total Lines: 3,511
├── App.jsx:              870 lines  ⚠️  TOO DAMN BIG
├── Components:           ~1,400 lines
├── Store:                215 lines
└── Utils:                792 lines
```

**Problem #1:** Your main component is 870 lines. That's not a component. That's a goddamn application stuffed into a single file.

---

## 🔴 Critical Issues (Fix These NOW)

### Issue #1: App.jsx is a Monster (870 lines)

**Current state:**
```javascript
function App() {
  const photos = usePhotoStore(...);
  const folderMap = usePhotoStore(...);
  const columns = usePhotoStore(...);
  const setCategory = usePhotoStore(...);
  const setCategoryBatch = usePhotoStore(...);
  const selectedPhotoId = usePhotoStore(...);
  const setSelectedPhotoId = usePhotoStore(...);
  const groupBrowseMode = usePhotoStore(...);

  const [displayCount, setDisplayCount] = useState(100);
  const [filter, setFilter] = useState(...);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [objectUrls, setObjectUrls] = useState(new Map());
  const [contextMenu, setContextMenu] = useState(null);
  const [currentPreviewGroupIndex, setCurrentPreviewGroupIndex] = useState(0);
  const [jumpToGroup, setJumpToGroup] = useState('');
  const [lastCompareModePhotoId, setLastCompareModePhotoId] = useState(null);
  // ... 850 MORE LINES
}
```

**What the fuck is this?**

You have:
- 8 Zustand store selectors
- 11 useState declarations
- Multiple useMemo calls
- Multiple useEffect calls
- Multiple useCallback calls
- Event handlers
- Rendering logic
- ALL IN ONE FUNCTION

**This violates every principle of good code:**
- Single Responsibility? Nope.
- Separation of Concerns? Nope.
- Maintainability? Hell no.

**Linus says:**
> "Functions should do ONE thing. If your function needs a table of contents, it's too big."

Your App.jsx needs a fucking index.

---

### How to Fix: Extract Custom Hooks

**Create these hooks:**

```javascript
// hooks/usePhotoDisplay.js - 处理图片显示逻辑
export function usePhotoDisplay(photos, filter) {
  const [displayCount, setDisplayCount] = useState(100);
  const filteredPhotos = useMemo(() => {
    // 过滤逻辑
  }, [photos, filter]);

  return { displayCount, setDisplayCount, filteredPhotos };
}

// hooks/usePhotoSelection.js - 处理图片选择
export function usePhotoSelection() {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);

  return { selectedPhotos, setSelectedPhotos, selectedPhotoId, setSelectedPhotoId };
}

// hooks/useCompareMode.js - 处理对比模式
export function useCompareMode(selectedFolders, photos) {
  const isCompareMode = selectedFolders.length >= 2 && selectedFolders.length <= 8;
  const compareColumns = isCompareMode ? selectedFolders.length : 3;

  // 对比模式的所有逻辑

  return { isCompareMode, compareColumns, displayPhotos };
}

// hooks/useKeyboardShortcuts.js - 键盘快捷键
export function useKeyboardShortcuts(selectedPhotoId, selectedPhotos) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 快捷键逻辑
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, selectedPhotos]);
}

// hooks/useObjectUrls.js - 管理 Object URLs
export function useObjectUrls(displayPhotos, photos) {
  const [objectUrls, setObjectUrls] = useState(new Map());

  useEffect(() => {
    // URL 生命周期管理
  }, [displayPhotos, photos]);

  return objectUrls;
}
```

**Then your App.jsx becomes:**

```javascript
function App() {
  // Store
  const photos = usePhotoStore(state => state.photos);
  const setCategory = usePhotoStore(state => state.setCategory);

  // Custom hooks
  const { displayCount, filteredPhotos } = usePhotoDisplay(photos, filter);
  const { selectedPhotos, selectedPhotoId } = usePhotoSelection();
  const { isCompareMode, compareColumns, displayPhotos } = useCompareMode(selectedFolders, photos);
  const objectUrls = useObjectUrls(displayPhotos, photos);

  useKeyboardShortcuts(selectedPhotoId, selectedPhotos, setCategory);
  useDragAndDrop();

  return (
    <div className="app">
      <Toolbar />
      <PhotoGrid photos={displayPhotos} />
      <StatusBar />
    </div>
  );
}
```

**Now your App.jsx is 50-100 lines instead of 870.**

That's how you write maintainable code.

---

### Issue #2: State Management Chaos

You have state scattered everywhere:
- Zustand store ✓ (Good)
- Local useState (11 of them) ✗ (Bad)
- useRef (4 of them) ✗ (Confusing)

**This is what we call "state hell".**

**Why is this bad?**
1. Hard to track where state lives
2. Hard to debug state changes
3. Performance issues (unnecessary re-renders)
4. Confusing for new developers

**Solution: Consolidate State**

Either put it ALL in Zustand:

```javascript
// store/useUIStore.js
const useUIStore = create((set) => ({
  displayCount: 100,
  filter: { category: null, folders: [] },
  selectedFolders: [],
  selectedPhotos: [],
  isDragging: false,
  previewPhotos: null,
  contextMenu: null,

  setDisplayCount: (count) => set({ displayCount: count }),
  setFilter: (filter) => set({ filter }),
  // ... etc
}));
```

Or group related state:

```javascript
const [ui, setUI] = useState({
  displayCount: 100,
  isDragging: false,
});

const [selection, setSelection] = useState({
  photos: [],
  photoId: null,
});

const [preview, setPreview] = useState({
  photos: null,
  groupIndex: 0,
});
```

**Don't have 11 separate useState calls. That's insane.**

---

### Issue #3: Magic Numbers Everywhere

```javascript
const [displayCount, setDisplayCount] = useState(100);  // What's 100?

if (target.scrollHeight - target.scrollTop <= target.clientHeight + 500) {  // What's 500?
  setDisplayCount(prev => Math.min(prev + 50, filteredPhotos.length));  // What's 50?
}
```

**This is lazy programming.**

**Fix:**

```javascript
// constants.js
export const PHOTO_DISPLAY = {
  INITIAL_COUNT: 100,      // 初始显示数量
  LOAD_INCREMENT: 50,      // 每次加载增量
  SCROLL_THRESHOLD: 500,   // 触发加载的滚动阈值(px)
};

export const COMPARE_MODE = {
  MIN_FOLDERS: 2,
  MAX_FOLDERS: 8,
};

export const KEYBOARD_SHORTCUTS = {
  CORRECT: '1',
  MEDIUM: '2',
  WRONG: '3',
  CLEAR: ['0', 'x', 'X'],
  PREV: 'ArrowLeft',
  NEXT: 'ArrowRight',
};
```

**Now your code is self-documenting:**

```javascript
const [displayCount, setDisplayCount] = useState(PHOTO_DISPLAY.INITIAL_COUNT);

if (shouldLoadMore(target)) {
  setDisplayCount(prev => Math.min(
    prev + PHOTO_DISPLAY.LOAD_INCREMENT,
    filteredPhotos.length
  ));
}
```

**See how much clearer that is?**

---

### Issue #4: Premature Optimization

You have useMemo EVERYWHERE:

```javascript
const displayPhotos = useMemo(() => {
  // 50+ lines of logic
}, [isCompareMode, selectedFolders, folderMap, filter, filteredPhotos, displayCount, compareColumns]);

const displayPhotosWithUrls = useMemo(() => {
  // Another useMemo
}, [displayPhotos, objectUrls]);
```

**Linus says:**
> "Premature optimization is the root of all evil." - Donald Knuth

**Did you profile this?**
**Did you measure that useMemo actually helps?**
**Or did you just add it because you thought it would be faster?**

Bet you didn't profile. Nobody does.

**Here's what you should do:**

1. **Remove ALL useMemo**
2. **Test if it's slow**
3. **Profile with React DevTools**
4. **ONLY add useMemo if profiling shows it helps**

```javascript
// Simple version (probably fast enough)
const displayPhotos = isCompareMode
  ? getComparePhotos(selectedFolders, filteredPhotos)
  : filteredPhotos.slice(0, displayCount);
```

If that's too slow (spoiler: it probably isn't), THEN optimize.

**Test before optimizing. Always.**

---

## 🟡 Major Issues (Fix These Soon)

### Issue #5: Too Many useEffect

You have 7+ useEffect calls in App.jsx:

```javascript
useEffect(() => { /* Object URLs */ }, [displayPhotos, photos]);
useEffect(() => { /* Cleanup */ }, []);
useEffect(() => { /* Scroll */ }, [filteredPhotos.length]);
useEffect(() => { /* Reset count */ }, [filter]);
useEffect(() => { /* Compare mode */ }, [isCompareMode, ...]);
useEffect(() => { /* Context menu */ }, [contextMenu]);
useEffect(() => { /* Drag and drop */ }, []);
useEffect(() => { /* Keyboard */ }, [...]);
useEffect(() => { /* Refs */ }, [selectedPhotos]);
useEffect(() => { /* More refs */ }, [selectedPhotoId]);
useEffect(() => { /* Even more refs */ }, [filteredPhotos]);
```

**This is called "useEffect soup".**

Each useEffect is another place where bugs can hide. Each one is another dependency array that can go wrong.

**Solution:** Extract to custom hooks (see Issue #1).

---

### Issue #6: Inconsistent Error Handling

```javascript
try {
  const result = await exportPhotos(...);
} catch (error) {
  console.error('导出失败:', error);
  alert(`导出失败: ${error.message}`);  // ← 2024年了还在用 alert()???
}
```

**ALERT()? REALLY?**

This isn't 1995. We don't use alert() anymore.

**Fix:** Create a proper toast/notification system.

```javascript
// components/Toast.jsx
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return { toasts, showToast };
}
```

**No more alert(). Ever.**

---

### Issue #7: Ref Abuse

```javascript
const selectedPhotosRef = useRef(selectedPhotos);
const selectedPhotoIdRef = useRef(selectedPhotoId);
const filteredPhotosRef = useRef(filteredPhotos);

useEffect(() => {
  selectedPhotosRef.current = selectedPhotos;
}, [selectedPhotos]);

useEffect(() => {
  selectedPhotoIdRef.current = selectedPhotoId;
}, [selectedPhotoId]);

useEffect(() => {
  filteredPhotosRef.current = filteredPhotos;
}, [filteredPhotos]);
```

**Why are you doing this?**

You're syncing refs with state using THREE separate useEffects?

This is a code smell. It means your dependencies are wrong somewhere.

**If you need refs to avoid stale closures, your architecture is wrong.**

Fix the root cause, don't paper over it with refs.

---

## 🟢 What You Did Right

Not everything is bad. Here's what's actually good:

### ✅ 1. Zustand for State Management

```javascript
const usePhotoStore = create((set, get) => ({
  photos: [],
  setPhotos: (photos) => set({ photos }),
  // ...
}));
```

**This is good.** Zustand is lightweight, simple, and doesn't require a PhD to understand (unlike Redux).

### ✅ 2. Performance Consciousness

You clearly care about performance:
- Object URL lifecycle management ✓
- Batch updates (setCategoryBatch) ✓
- IndexedDB for persistence ✓
- Folder map for O(1) lookups ✓

The problem is you're optimizing the WRONG things (see Issue #4).

But at least you're thinking about it.

### ✅ 3. Code Comments

```javascript
// 对比模式下的图片排列 - 按选择顺序排列
// 辅助函数：获取不含扩展名的文件名
// 增量更新 folderMap - 只更新受影响的文件夹
```

Your comments explain WHY, not WHAT. That's correct.

### ✅ 4. IndexedDB Usage

```javascript
// utils/indexedDB.js
export async function saveCategoriesInBulk(categories) {
  // 并行写入优化
}
```

Using IndexedDB for local persistence is the right choice. And you're doing it correctly (parallel writes, bulk operations).

### ✅ 5. File System Access API

```javascript
export function isFileSystemAccessSupported() {
  return 'showDirectoryPicker' in window;
}
```

You're using modern browser APIs. And you're checking for support before using them. **Correct.**

---

## 📈 Architecture Evaluation

```
Current Architecture:
├── ✓ Components separated
├── ✓ Store isolated
├── ✓ Utils extracted
├── ✗ App.jsx too big
├── ✗ State scattered
└── ✗ Missing abstraction layers

Score: 6/10
```

**Good:**
- Clear separation of components, store, utils
- No God objects (except App.jsx)
- Reasonable file structure

**Bad:**
- App.jsx is still a monolith
- No custom hooks layer
- State management inconsistent

---

## 🎯 Action Plan (Priority Order)

### Must Fix (Week 1):
1. **Split App.jsx** - Extract 5 custom hooks
2. **Remove magic numbers** - Create constants file
3. **Kill alert()** - Add toast system
4. **Consolidate state** - Either all Zustand or grouped useState

### Should Fix (Week 2):
1. **Remove ref abuse** - Fix dependency arrays properly
2. **Reduce useEffect** - Extract to custom hooks
3. **Profile before optimizing** - Remove unnecessary useMemo

### Nice to Have (Week 3):
1. Add TypeScript (if you must)
2. Add unit tests
3. Document complex algorithms

---

## 🔢 Code Quality Metrics

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| **Architecture** | 7/10 | 8/10 | 🟡 OK |
| **Readability** | 6/10 | 8/10 | 🔴 Poor |
| **Maintainability** | 5/10 | 8/10 | 🔴 Poor |
| **Performance** | 7/10 | 8/10 | 🟡 OK |
| **Error Handling** | 4/10 | 7/10 | 🔴 Poor |
| **Testing** | 0/10 | 6/10 | 🔴 None |

**Overall: 5.8/10** (Below Average)

---

## 💬 Linus's Final Verdict

> "This code works. That's the minimum bar. But 'works' isn't enough for production code.
>
> Your main component is 870 lines. That's a crime against readability. Split it up.
>
> Your state management is chaos. Pick ONE approach and stick with it.
>
> You're using alert() in 2024. Come on.
>
> BUT - and this is important - the bones are good. The architecture isn't terrible. You're using modern tools correctly (Zustand, IndexedDB, modern APIs). You care about performance.
>
> You just need to clean up the mess.
>
> Spend a week refactoring. Extract those hooks. Clean up that state. Remove the magic numbers. Fix the error handling.
>
> Then you'll have B+ code instead of C+ code.
>
> **Current Grade: C+**
>
> **Potential Grade: A- (after refactoring)**
>
> Now go fix it. And stop using alert().
>
> -- In the spirit of Linus Torvalds"

---

## 📚 Recommended Reading

1. **Kent C. Dodds - "Don't Sync State"**
   https://kentcdodds.com/blog/dont-sync-state-derive-it

2. **Dan Abramov - "Writing Resilient Components"**
   https://overreacted.io/writing-resilient-components/

3. **Linus Torvalds - "Good Taste in Code"**
   The TED interview on clean code principles

---

## 🏁 TL;DR

**Good:**
- It works
- Architecture is reasonable
- Modern tooling
- Performance conscious

**Bad:**
- App.jsx is 870 lines (TOO BIG)
- 11 useState calls (TOO MANY)
- Magic numbers everywhere
- Still using alert()
- Ref abuse for stale closures

**Fix Priority:**
1. Split App.jsx → Extract custom hooks
2. Consolidate state management
3. Add constants file
4. Kill alert(), add toast system

**Grade: C+** (Works but needs refactoring)

**Estimated Refactoring Time: 1 week**

---

*"Talk is cheap. Show me the code."* - Linus Torvalds
