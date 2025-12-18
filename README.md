# ⚡ 筛图神器

一个极速的摄影师选片工具，支持快速导入、多文件夹对比、快捷键分类和一键导出。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-7.2-646cff.svg)

## ✨ 特性

- 🚀 **极速导入** - 支持导入 2000+ 张图片，秒级响应
- 🖼️ **多文件夹对比** - 2-8 个文件夹并排对比，按文件名对齐
- 🎯 **快捷键分类** - 数字键 1/2/3 快速打标签（正确/适中/错误）
- 🔄 **组切换** - 键盘 ↑↓ 快速切换对比组
- 💾 **数据持久化** - 刷新页面不丢失分类标记
- 📤 **灵活导出** - 选择性导出分类，保留原文件夹结构
- 🎨 **Neumorphism 设计** - 精致的新拟态 UI
- 📱 **拖放导入** - 直接拖入文件夹即可导入
- 🔒 **隐私安全** - 纯前端运行，数据不上传服务器

## 🎬 快速开始

### 在线使用

访问 [https://YOUR_USERNAME.github.io/](https://YOUR_USERNAME.github.io/) 即可使用

**注意：** 文件夹导入功能需要使用 **Chrome** 或 **Edge** 浏览器

### 本地运行

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/photo-picker.git
cd photo-picker

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

## 📖 使用指南

### 1. 导入图片

**方式一：点击导入**
- 点击顶部 "导入文件夹" 按钮
- 选择包含图片的文件夹

**方式二：拖放导入**
- 直接将文件夹拖入页面

### 2. 查看和对比

- **单列模式**：点击顶部 "2列/3列/5列" 切换显示
- **对比模式**：在左侧面板选择 2-8 个文件夹，自动进入对比模式

### 3. 分类打标

**快捷键：**
- `1` - 标记为"正确"（绿色 ✓）
- `2` - 标记为"适中"（黄色 ~）
- `3` - 标记为"错误"（红色 ✕）
- `0` - 清除标记
- `←/→` - 切换图片
- `↑/↓` - 切换对比组（对比模式）

**鼠标操作：**
- 单击图片 - 选中
- 双击图片 - 大图预览
- Shift/Ctrl + 点击 - 多选
- 悬停图片 - 显示分类按钮

### 4. 导出结果

1. 点击顶部 "导出" 按钮
2. 选择要导出的分类（正确/适中/错误/未打标）
3. 选择导出目标文件夹
4. 等待导出完成

**导出结构：**
```
导出文件夹/
├── 正确/
│   ├── folder1/
│   │   └── image1.jpg
│   └── folder2/
│       └── image2.jpg
├── 适中/
├── 错误/
└── 未打标/
```

## 🛠️ 技术栈

- **前端框架**: React 19
- **构建工具**: Vite 7
- **状态管理**: Zustand
- **样式方案**: Tailwind CSS + Neumorphism
- **文件系统**: File System Access API
- **虚拟滚动**: react-window

## 📦 部署

查看详细部署指南：[DEPLOY.md](./DEPLOY.md)

**快速部署到 GitHub Pages：**

```bash
# 1. 创建 GitHub 仓库并推送代码
git add .
git commit -m "🎉 Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/photo-picker.git
git push -u origin main

# 2. 在 GitHub 仓库设置中启用 Pages（Source: GitHub Actions）
# 3. 等待自动部署完成
```

## 🎯 浏览器兼容性

| 浏览器 | 支持情况 | 备注 |
|--------|----------|------|
| Chrome 86+ | ✅ 完全支持 | 推荐 |
| Edge 86+ | ✅ 完全支持 | 推荐 |
| Firefox | ⚠️ 部分支持 | 不支持文件夹导入 |
| Safari | ⚠️ 部分支持 | 不支持文件夹导入 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

MIT License

## 🙏 致谢

感谢所有使用和支持这个项目的朋友们！

---

**Made with ❤️ by [Your Name]**
