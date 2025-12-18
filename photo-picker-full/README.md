# 筛图神器

摄影师选片工具。快速导入、快捷键分类、一键导出。

## 为什么要用这个？

- **快** - 2000+ 张图片秒开，虚拟滚动，不卡顿
- **简单** - 键盘 1/2/3 打标签，不用鼠标点来点去
- **对比** - 多文件夹并排看，按文件名自动对齐
- **安全** - 纯前端，数据不上传，刷新不丢失
- **导出** - 按分类导出，保留原文件夹结构

## 使用

### 在线使用

访问 https://jiliying0617-stack.github.io/

**需要 Chrome 或 Edge 浏览器**（Firefox/Safari 不支持文件夹导入）

### 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:5173

## 操作

### 导入
- 点击 "导入文件夹" 或直接拖入文件夹

### 分类
- `1` - 正确 (绿色 ✓)
- `2` - 适中 (黄色 ~)
- `3` - 错误 (红色 ✕)
- `0` - 清除标记
- `←/→` - 切换图片
- `↑/↓` - 切换对比组

### 对比
- 左侧选择 2-8 个文件夹
- 自动按文件名对齐显示
- 缺失的文件显示占位符

### 导出
1. 点击 "导出"
2. 勾选要导出的分类
3. 选择目标文件夹
4. 完成

导出结构：
```
目标文件夹/
├── 正确/
│   └── (保留原文件夹结构)
├── 适中/
├── 错误/
└── 未打标/
```

## 技术栈

- React 19 + Vite 7
- Zustand (状态管理)
- Tailwind CSS
- File System Access API
- react-window (虚拟滚动)

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库（必须 Public）
2. 推送代码：
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/photo-picker.git
   git push -u origin main
   ```
3. 仓库设置 → Pages → Source 选择 "GitHub Actions"
4. 等待 2-3 分钟自动部署完成

## 浏览器兼容性

| 浏览器 | 支持 |
|--------|------|
| Chrome 86+ | ✅ |
| Edge 86+ | ✅ |
| Firefox | ⚠️ 不支持文件夹导入 |
| Safari | ⚠️ 不支持文件夹导入 |

## 开源协议

MIT

---

Simple. Fast. Good.
