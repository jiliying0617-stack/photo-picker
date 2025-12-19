# 对比模式优化说明

## 问题描述

在对比模式下，之前存在以下问题：

1. **组切换逻辑错误**: 上下组切换时会跳过某些组，例如从第1组直接跳到第24组
2. **占位符处理不当**: 当文件夹中缺少某个文件时，预览模式无法正确显示占位符

## 根本原因

### 原始代码的问题

```javascript
// ❌ 错误的实现 - 过滤掉了 null 占位符
const totalGroups = Math.ceil(allPhotos.filter(p => p).length / photosPerGroup);

const nextGroupPhotos = allPhotos
  .filter(p => p)  // 这会移除占位符，破坏固定组大小
  .slice(nextGroupStartIndex, nextGroupStartIndex + photosPerGroup);
```

**为什么会出错？**

在对比模式下，`displayPhotos` 数组的结构如下：

```
对比3个文件夹，每组3张图片：
[
  photo1_folder1, photo1_folder2, photo1_folder3,  // 第1组
  photo2_folder1, null,           photo2_folder3,  // 第2组（文件夹2缺失）
  photo3_folder1, photo3_folder2, photo3_folder3,  // 第3组
  ...
]
```

当使用 `.filter(p => p)` 过滤掉 null 后：

```
过滤后的数组：
[
  photo1_folder1, photo1_folder2, photo1_folder3,  // 前3个
  photo2_folder1, photo2_folder3, photo3_folder1,  // 中间混乱了！
  photo3_folder2, photo3_folder3,
  ...
]
```

这导致：
- 组的边界被破坏（不再是每组3个）
- 组索引计算错误
- 上下组切换混乱

## 解决方案

### ✅ 正确的实现

```javascript
// ✅ 保持占位符，确保每组大小固定
const totalGroups = Math.ceil(allPhotos.length / photosPerGroup);

const nextGroupPhotos = allPhotos.slice(
  nextGroupStartIndex,
  nextGroupStartIndex + photosPerGroup
);
```

**关键改进：**

1. **不过滤 null**: 保持所有占位符在数组中
2. **固定组大小**: 每组严格按 `photosPerGroup` 数量切片
3. **正确的索引**: 组索引基于完整数组长度计算

### 占位符渲染

在 LightboxPreview 组件中添加占位符处理：

```javascript
{photosWithUrls.photos.map((photo, idx) => {
  // 处理占位符（null）情况
  if (!photo) {
    return (
      <div key={`placeholder-${idx}`} className="...">
        <div className="text-center">
          <div className="text-6xl mb-3 opacity-20">📷</div>
          <div className="text-gray-500 text-sm font-medium">
            此文件夹无此图片
          </div>
        </div>
        <div className="absolute top-3 left-3 ...">
          {idx + 1}
        </div>
      </div>
    );
  }

  // 正常渲染图片...
})}
```

## 优化效果

### Before (修复前)

```
第1组: [A1, A2, A3]
第2组: [A4, A5, A6]  ← 实际应该是 [B1, null, B3]
...
第24组: [B1, null, B3]  ← 混乱！
```

### After (修复后)

```
第1组: [A1, A2, A3]
第2组: [B1, null, B3]  ← 正确！占位符保持位置
第3组: [C1, C2, C3]
第4组: [D1, D2, D3]
```

## 功能验证

### 测试场景

1. **正常对比**: 3个文件夹，每个文件夹都有完整的文件
   - ✅ 上下组切换顺序正确
   - ✅ 组号显示准确

2. **部分缺失**: 某些文件夹缺少部分文件
   - ✅ 占位符正确显示
   - ✅ 组边界保持固定
   - ✅ 不会跳组

3. **完全缺失**: 某个文件夹完全缺少某个文件
   - ✅ 显示占位符
   - ✅ 不影响其他列的对齐

### 操作测试

- ✅ 点击 "↑ 上一组" 按钮：严格按顺序切换
- ✅ 点击 "↓ 下一组" 按钮：严格按顺序切换
- ✅ 使用方向键 ↑ / ↓：正确响应
- ✅ 组号显示：准确反映当前位置

## 技术细节

### 组索引计算

```javascript
// 使用第一个真实图片来定位当前组
const firstRealPhoto = photosWithUrls.photos.find(p => p);
const currentGroupIndex = allPhotos && firstRealPhoto
  ? Math.floor(allPhotos.findIndex(p => p && p.id === firstRealPhoto.id) / photosPerGroup)
  : 0;
```

### 总组数计算

```javascript
// 基于完整数组长度（包括 null）
const totalGroups = allPhotos ? Math.ceil(allPhotos.length / photosPerGroup) : 1;
```

### 组切换逻辑

```javascript
// 上一组：直接从当前组索引-1的位置切片
const prevGroupStartIndex = (currentGroupIndex - 1) * photosPerGroup;
const prevGroupPhotos = allPhotos.slice(
  prevGroupStartIndex,
  prevGroupStartIndex + photosPerGroup
);

// 下一组：直接从当前组索引+1的位置切片
const nextGroupStartIndex = (currentGroupIndex + 1) * photosPerGroup;
const nextGroupPhotos = allPhotos.slice(
  nextGroupStartIndex,
  nextGroupStartIndex + photosPerGroup
);
```

## 相关代码文件

- `src/components/LightboxPreview.jsx` - 预览组件和组切换逻辑
- `src/App.jsx` - 对比模式下的图片对齐逻辑

## 总结

这次优化确保了：

1. ✅ **严格的组顺序**: 禁止跳组，始终按 1→2→3→4 顺序切换
2. ✅ **固定的组大小**: 每组图片数量固定（列数），用 null 占位符填充缺失
3. ✅ **准确的组号显示**: 组索引计算正确，用户看到的组号准确
4. ✅ **完善的占位符显示**: 缺失的文件用友好的占位符替代

**用户体验提升**：从混乱的跳组问题变为流畅的顺序浏览体验。
