# 筛图神器 - 部署指南

## 📦 部署到 GitHub Pages（免费托管）

### 步骤 1: 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - Repository name: `photo-picker` 或 `shai-tu-shen-qi`
   - Description: `⚡ 筛图神器 - 极速挑图工具`
   - 选择 **Public**（公开仓库）
4. 不勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

### 步骤 2: 推送代码到 GitHub

在项目根目录运行以下命令：

```bash
# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 创建第一次提交
git commit -m "🎉 初始化筛图神器项目"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/photo-picker.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步骤 3: 配置 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 左侧菜单找到 **Pages**
4. 在 "Build and deployment" 部分：
   - Source: 选择 **GitHub Actions**
5. 保存设置

### 步骤 4: 触发自动部署

GitHub Actions 会自动检测到你的 `.github/workflows/deploy.yml` 文件：

- 每次推送到 `main` 分支都会自动部署
- 或者在 GitHub 仓库的 "Actions" 标签页手动触发部署

### 步骤 5: 访问你的网站

部署完成后（约 2-3 分钟），你的网站将在以下地址可用：

```
https://YOUR_USERNAME.github.io/
```

例如：`https://jiliying.github.io/`

---

## 🚀 其他部署选项

### Vercel 部署（推荐，速度更快）

1. 访问 [Vercel](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 导入你的 `photo-picker` 仓库
5. 部署设置：
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 点击 "Deploy"

完成后，Vercel 会提供一个自定义域名，例如：
```
https://photo-picker.vercel.app
```

### Netlify 部署

1. 访问 [Netlify](https://www.netlify.com)
2. 用 GitHub 账号登录
3. 点击 "Add new site" → "Import an existing project"
4. 选择你的 `photo-picker` 仓库
5. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 点击 "Deploy site"

---

## 📝 自定义域名（可选）

### GitHub Pages 自定义域名

1. 购买域名（如：`shaitushenqi.com`）
2. 在域名 DNS 设置中添加 CNAME 记录：
   ```
   CNAME  www  YOUR_USERNAME.github.io
   ```
3. 在 GitHub 仓库 Settings → Pages → Custom domain 填入你的域名
4. 勾选 "Enforce HTTPS"

### Vercel 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名
3. 按照提示在域名 DNS 中添加记录

---

## 🔧 本地构建测试

在推送到 GitHub 前，可以本地测试构建：

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

然后访问 `http://localhost:4173` 查看构建后的网站。

---

## ✅ 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] GitHub Actions 已配置
- [ ] GitHub Pages 已启用
- [ ] 部署工作流已成功运行
- [ ] 网站可以正常访问
- [ ] 文件夹导入功能正常（需要 Chrome/Edge 浏览器）
- [ ] 图片分类功能正常
- [ ] 导出功能正常

---

## 🎯 部署后的 URL 示例

| 平台 | URL 格式 | 速度 | 费用 |
|------|----------|------|------|
| GitHub Pages | `username.github.io` | 中等 | 免费 |
| Vercel | `project.vercel.app` | 很快 | 免费 |
| Netlify | `project.netlify.app` | 很快 | 免费 |

---

## 📞 问题排查

### 部署失败

1. 检查 GitHub Actions 日志（仓库 → Actions 标签）
2. 确认 `package.json` 中的依赖完整
3. 确认 Node.js 版本兼容（推荐 20+）

### 网站打不开

1. 等待 2-3 分钟让 DNS 生效
2. 清除浏览器缓存
3. 检查 GitHub Pages 设置是否正确

### 文件导入不工作

- 确保使用 Chrome 或 Edge 浏览器（Firefox/Safari 不支持 File System Access API）

---

## 🎉 分享你的网站

部署成功后，你可以：

1. 将网站链接分享给朋友
2. 在社交媒体上推广
3. 添加到你的作品集

示例分享文案：
```
🎉 我做了一个超快的选片工具 - 筛图神器！

⚡ 极速导入 2000+ 图片
🖼️ 支持多文件夹对比
⌨️ 快捷键快速分类
📤 一键导出分类结果

完全免费，纯前端运行，数据不上传！

立即体验：https://YOUR_USERNAME.github.io/
```

---

祝你部署顺利！🚀
