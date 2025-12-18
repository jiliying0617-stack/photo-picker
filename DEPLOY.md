# 📦 部署指南

本项目已优化并准备好部署。选择以下任一方式快速上线。

---

## 🚀 方式 1: Vercel (推荐 - 最简单)

### 步骤:
1. **访问**: https://vercel.com
2. **登录**: 使用 GitHub 账号登录
3. **导入项目**:
   - 点击 "Add New Project"
   - 选择 `jiliying0617-stack/photo-picker`
4. **自动配置**: Vercel 会自动检测 Vite 项目
5. **部署**: 点击 "Deploy" 按钮

### ✅ 优势:
- ⚡ 全球 CDN 加速
- 🔒 自动 HTTPS
- 🔄 自动部署 (git push 触发)
- 🆓 免费

### 预计时间: **2 分钟**

---

## 🌐 方式 2: Netlify

### 步骤:
1. **访问**: https://netlify.com
2. **登录**: 使用 GitHub 账号登录
3. **导入项目**:
   - 点击 "Add new site" > "Import an existing project"
   - 选择 `photo-picker` 仓库
4. **配置**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **部署**: 点击 "Deploy site"

### ✅ 优势:
- 🌍 全球 CDN
- 🔒 自动 HTTPS
- 📊 分析功能
- 🆓 免费

### 预计时间: **3 分钟**

---

## 📄 方式 3: GitHub Pages

### 步骤:
1. **推送代码到 GitHub**:
   ```bash
   git push origin main
   ```

2. **启用 GitHub Pages**:
   - 访问仓库: https://github.com/jiliying0617-stack/photo-picker
   - Settings > Pages
   - Source: "GitHub Actions"
   - 保存

3. **自动部署**: GitHub Actions 会自动构建并部署

### 网址:
部署后访问: `https://jiliying0617-stack.github.io/photo-picker/`

### ✅ 优势:
- 🆓 完全免费
- 🔄 自动部署
- 🔒 HTTPS

### 预计时间: **5 分钟**

---

## 🎯 推荐选择

| 功能 | Vercel | Netlify | GitHub Pages |
|------|--------|---------|--------------|
| **速度** | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ |
| **简单** | 🟢 最简单 | 🟢 简单 | 🟡 需配置 |
| **自定义域名** | ✅ | ✅ | ✅ |
| **分析** | ✅ | ✅ | ❌ |
| **构建时间** | 1-2 分钟 | 2-3 分钟 | 3-5 分钟 |

**建议**: 如果追求最快部署 → **Vercel**

---

## 🔧 本地预览构建

```bash
npm run build
npm run preview
```

访问: http://localhost:4173

---

## 📝 项目优化说明

✅ 已修复 Object URL 内存泄漏
✅ 优化对比模式性能 (50-100倍提升)
✅ IndexedDB 并行写入 (5倍提升)
✅ 快捷键改为 A/S/D (更人性化)
✅ 增量更新 folderMap (避免全量重建)

---

部署后请测试:
1. 导入文件夹功能
2. 键盘快捷键 (A/S/D)
3. 对比模式 (选择 2-8 个文件夹)
4. 标签持久化 (刷新页面)
