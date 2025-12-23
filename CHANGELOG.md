# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-12-23

### 🎉 重要更新

本版本专注于**跨平台兼容性**和**数据准确性**，确保在 Linux/macOS/Windows 上都能稳定运行。

### 🔒 安全修复 (Security)

- **删除敏感信息泄露**
  - 移除 `.env.local` 文件（包含 Vercel OIDC Token）
  - 创建 `.env.example` 安全模板文件
  - 更新 `.gitignore` 防止敏感文件被提交

### 🐛 Bug 修复 (Fixed)

- **修复导出数量显示不一致问题** ([#critical](EXPORT_FIX.md))
  - 导出对话框现在显示**实际导出成功**的文件数量
  - 之前使用前端计算的预期值，现在使用后端返回的实际值
  - 解决了导出失败时数量不匹配的问题
  - 详见 `EXPORT_FIX.md`

- **修复文件名长度检查错误** ([#linux-compat](LINUX_FIXES.md))
  - 从字符数检查改为**字节数检查**（UTF-8）
  - Linux ext4/xfs 文件系统限制是 255 **字节**，不是字符
  - 中文文件名现在能正确处理（1 个中文 = 3 字节）

- **改进隐藏文件处理逻辑**
  - 不再移除所有以点开头的文件名
  - 保留合法的隐藏文件（如 `.config.jpg`）
  - 只处理特殊情况（`.` 和 `..`）

### ✨ 改进 (Improved)

- **Makefile 增强**
  - 添加彩色输出（绿色/黄色/红色提示）
  - `clean-all` 命令需要交互式确认（防止误删）
  - 清理所有平台的系统垃圾文件（.DS_Store, Thumbs.db, ._*）
  - 新增 `make check` 命令（lint + build）

- **跨平台兼容性**
  - 创建 `.gitattributes` 强制 LF 换行符（Linux 标准）
  - 扩展 `.gitignore` 覆盖所有操作系统的垃圾文件
  - 添加路径分隔符注释说明

- **代码质量**
  - 移除未使用的变量（`stats`）
  - 简化导出逻辑（删除 18 行不必要的代码）
  - 添加详细的代码注释

### 📚 文档 (Documentation)

- 新增 `LINUX_FIXES.md` - Linux 兼容性修复详解
- 新增 `EXPORT_FIX.md` - 导出数量问题修复详解
- 新增 `CHANGELOG.md` - 版本更新日志

### 🔧 技术细节

**修改的文件:**
```
modified:   .gitignore
modified:   Makefile
modified:   package.json (1.0.0 → 1.1.0)
modified:   src/components/Exporter.jsx
modified:   src/utils/fileSystem.js

created:    .env.example
created:    .gitattributes
created:    CHANGELOG.md
created:    EXPORT_FIX.md
created:    LINUX_FIXES.md
```

**代码统计:**
- 净增加：约 200 行（主要是文档）
- 代码简化：删除 27 行不必要的代码
- 新增功能：字节数检查、安全确认等

---

## [1.0.0] - 2025-12-19

### 🎉 初始版本

- ✨ 照片分类功能（正确/适中/错误/未标记）
- ✨ 虚拟滚动支持（高性能显示大量照片）
- ✨ 对比模式（2-8 个文件夹同时对比）
- ✨ 键盘快捷键（1/2/3/0 快速分类）
- ✨ 导出功能（保留文件夹结构）
- ✨ IndexedDB 持久化（刷新不丢失）
- ✨ 灯箱预览（双击查看大图）
- ✨ 拖放导入（支持文件夹）
- ✨ 响应式设计（Neumorphism UI）

---

## 版本说明

### 版本号规范

本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)：

- **MAJOR**：不兼容的 API 修改
- **MINOR**：向下兼容的功能性新增
- **PATCH**：向下兼容的问题修正

### 标签说明

- 🎉 **重要更新** - Major features
- ✨ **新增** - New features
- 🐛 **修复** - Bug fixes
- ⚡ **性能** - Performance improvements
- 🔒 **安全** - Security fixes
- 📚 **文档** - Documentation
- 🔧 **工具** - Tooling changes
- ♻️ **重构** - Code refactoring
- 🎨 **样式** - UI/UX improvements
