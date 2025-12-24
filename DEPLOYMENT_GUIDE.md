# 🚀 部署指南 - Photo Picker v1.3.0

**最后更新:** 2025-12-24
**部署平台:** Vercel (推荐) / Cloudflare Pages / Netlify

---

## 📋 部署前准备

### ✅ 已完成
- [x] 代码已提交到本地 Git
- [x] GitHub 仓库已创建: `https://github.com/jiliying0617-stack/photo-picker.git`
- [x] 项目已构建测试通过
- [x] Vercel 配置文件已就绪

### 📦 需要你完成
1. 推送代码到 GitHub
2. 连接 Vercel 账号
3. 一键部署

---

## 🚀 方案一：Vercel 部署（推荐，最简单）

### 为什么选择 Vercel？
- ✅ **零配置** - 自动识别 Vite 项目
- ✅ **极速部署** - 全球 CDN，毫秒级响应
- ✅ **自动 HTTPS** - 免费 SSL 证书
- ✅ **免费额度** - 个人项目完全免费
- ✅ **自动构建** - 每次 push 自动部署

---

### 步骤 1: 推送代码到 GitHub

```bash
# 在项目目录下执行
git push origin main
```

**如果遇到身份验证问题：**

#### 方法 A: 使用 SSH（推荐）
```bash
# 1. 检查是否有 SSH key
ls -la ~/.ssh

# 2. 如果没有，生成新的 SSH key
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 3. 复制公钥
cat ~/.ssh/id_ed25519.pub

# 4. 添加到 GitHub
# - 访问 https://github.com/settings/keys
# - 点击 "New SSH key"
# - 粘贴公钥内容
# - 保存

# 5. 修改远程仓库 URL 为 SSH
git remote set-url origin git@github.com:jiliying0617-stack/photo-picker.git

# 6. 再次推送
git push origin main
```

#### 方法 B: 使用 Personal Access Token
```bash
# 1. 生成 Token
# - 访问 https://github.com/settings/tokens
# - 点击 "Generate new token (classic)"
# - 勾选 "repo" 权限
# - 生成并复制 token

# 2. 推送时使用 token
git push https://你的token@github.com/jiliying0617-stack/photo-picker.git main
```

---

### 步骤 2: 连接 Vercel

1. **访问 Vercel 官网**
   - 打开 https://vercel.com
   - 点击 "Start Deploying"

2. **使用 GitHub 登录**
   - 选择 "Continue with GitHub"
   - 授权 Vercel 访问你的 GitHub 账号

3. **导入项目**
   - 点击 "Add New..." → "Project"
   - 在列表中找到 `photo-picker`
   - 点击 "Import"

---

### 步骤 3: 配置项目（Vercel 会自动识别）

Vercel 会自动检测到这是 Vite 项目，并使用以下配置：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**你只需要：**
- ✅ 确认配置正确（通常不需要修改）
- ✅ 点击 "Deploy"

---

### 步骤 4: 部署完成！🎉

几分钟后，你会看到：

```
✅ Deployment ready!

Your site is live at:
https://photo-picker-xxx.vercel.app
```

**你的网站现在已经上线了！**

---

## 🌐 方案二：Cloudflare Pages（备选）

### 步骤 1: 推送代码到 GitHub（同上）

### 步骤 2: 连接 Cloudflare Pages

1. 访问 https://pages.cloudflare.com/
2. 使用 GitHub 登录
3. 选择 `photo-picker` 仓库
4. 配置构建：
   ```
   Build command: npm run build
   Build output: dist
   ```
5. 点击 "Save and Deploy"

---

## 🔧 自定义域名（可选）

### Vercel 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 输入你的域名（例如：`photos.yourdomain.com`）
3. 添加 DNS 记录（Vercel 会提供详细说明）：
   ```
   Type: CNAME
   Name: photos
   Value: cname.vercel-dns.com
   ```
4. 等待 DNS 生效（通常 5-10 分钟）

---

## ⚡ 性能优化建议

### 1. 启用 Gzip 压缩（Vercel 默认开启）
- 已自动启用 ✅

### 2. 设置缓存策略

在项目根目录创建 `vercel.json`（已存在）：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. 环境变量（如果需要）

在 Vercel 设置中添加：
```
NODE_ENV=production
```

---

## 🔍 部署后验证

### 检查清单

1. **功能测试**
   - [ ] 导入文件夹功能正常
   - [ ] 快捷键 1/2/3 分类正常
   - [ ] 对比模式显示正常
   - [ ] 大图预览正常
   - [ ] 导出功能正常

2. **性能测试**
   - [ ] 首屏加载 < 2 秒
   - [ ] Lighthouse 分数 > 90
   - [ ] 10,000 张照片导入 < 1 秒

3. **兼容性测试**
   - [ ] Chrome 最新版 ✅
   - [ ] Edge 最新版 ✅
   - [ ] 移动端响应式（如果支持）

---

## 🐛 常见问题

### Q: 部署后文件导入功能不工作？
**A:** 确保使用 **Chrome 或 Edge** 浏览器，因为项目使用 File System Access API。

### Q: 部署后页面空白？
**A:** 检查浏览器控制台，确认没有 JavaScript 错误。通常是路由配置问题。

### Q: 如何更新网站？
**A:** 只需 `git push` 到 GitHub，Vercel 会自动重新部署。

```bash
# 修改代码后
git add .
git commit -m "更新功能"
git push origin main

# Vercel 自动部署，无需手动操作
```

### Q: 如何回滚到之前的版本？
**A:** 在 Vercel 控制台 → Deployments → 选择之前的部署 → Promote to Production

---

## 📊 监控和分析

### Vercel Analytics（可选，免费）

1. 在 Vercel 项目设置中启用 "Analytics"
2. 查看：
   - 访问量统计
   - 页面性能
   - 用户地理位置

### Google Analytics（可选）

在 `index.html` 添加：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🎯 部署检查清单

### 部署前
- [x] 代码已提交到 Git
- [x] 构建测试通过 (`npm run build`)
- [x] 删除无用代码
- [x] 优化性能

### 部署中
- [ ] 推送代码到 GitHub
- [ ] 连接 Vercel 账号
- [ ] 导入项目
- [ ] 确认配置
- [ ] 点击部署

### 部署后
- [ ] 访问网站 URL
- [ ] 测试核心功能
- [ ] 检查性能
- [ ] （可选）绑定自定义域名

---

## 🚀 快速开始（TL;DR）

```bash
# 1. 推送代码
git push origin main

# 2. 访问 Vercel
# https://vercel.com

# 3. 导入 GitHub 项目
# 选择 photo-picker → Import → Deploy

# 4. 完成！
# 网站自动上线：https://photo-picker-xxx.vercel.app
```

---

## 🆘 需要帮助？

- **Vercel 文档:** https://vercel.com/docs
- **Vite 部署指南:** https://vitejs.dev/guide/static-deploy
- **项目 GitHub:** https://github.com/jiliying0617-stack/photo-picker

---

## 📝 部署记录

| 日期 | 版本 | 平台 | URL | 状态 |
|------|------|------|-----|------|
| 2025-12-24 | v1.3.0 | Vercel | 待部署 | ⏳ Pending |

---

**现在就去部署吧！只需 3 步，5 分钟搞定。** 🚀

**"Talk is cheap. Show me the deployment."** - Linus Torvalds (大概)
