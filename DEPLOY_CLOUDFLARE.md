# 🚀 Cloudflare Pages 部署指南

**优势：** 在国内访问相对稳定，免费，速度快

---

## 📋 前置要求

1. **Cloudflare 账号** - https://dash.cloudflare.com/sign-up
2. **GitHub 账号已连接代码**
3. **代码已推送到 GitHub**

---

## 🎯 部署步骤（5分钟完成）

### 第1步：推送代码到 GitHub

```bash
# 如果还没推送，执行以下命令
cd /Users/jiliying/Desktop/photo-picker

# 配置 Git 认证（如果需要）
git remote set-url origin git@github.com:jiliying0617-stack/photo-picker.git

# 推送代码
git push origin main
```

如果 push 失败，需要配置 GitHub SSH：
1. 访问 https://github.com/settings/keys
2. 点击 "New SSH key"
3. 运行 `cat ~/.ssh/id_rsa.pub` 复制内容
4. 如果没有密钥，先运行 `ssh-keygen -t rsa -b 4096 -C "your_email@example.com"`

---

### 第2步：在 Cloudflare 创建项目

#### 2.1 登录 Cloudflare
打开浏览器访问：**https://dash.cloudflare.com**

#### 2.2 进入 Pages
- 左侧菜单 → **Workers & Pages**
- 点击 **Create application**
- 选择 **Pages** 标签页
- 点击 **Connect to Git**

#### 2.3 连接 GitHub
- 点击 **GitHub** 按钮
- 授权 Cloudflare 访问你的 GitHub 仓库
- 选择 **photo-picker** 仓库

#### 2.4 配置构建设置
```
项目名称:          photo-picker
生产分支:          main
框架预设:          Vite
构建命令:          npm run build
构建输出目录:       dist
根目录:            /
Node 版本:         18
```

**环境变量（可选）:**
```
无需添加环境变量
```

#### 2.5 开始部署
- 点击 **Save and Deploy**
- 等待 2-3 分钟完成首次部署
- 构建日志会实时显示

---

## ✅ 部署成功

部署完成后，你会看到：

### 访问地址
```
https://photo-picker-abc.pages.dev
```
（实际地址会显示在部署完成页面）

### 自定义域名（可选）
1. 在项目设置中点击 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名
4. 按照提示配置 DNS

---

## 🔄 自动部署

配置完成后，每次 `git push` 到 GitHub，Cloudflare Pages 会自动：
1. ✅ 拉取最新代码
2. ✅ 运行 `npm run build`
3. ✅ 部署到生产环境
4. ✅ 更新所有访问地址

---

## 📊 项目配置已完成

已创建的配置文件：
- ✅ `.cloudflare-pages.json` - Cloudflare Pages 配置
- ✅ `public/_redirects` - 路由重定向规则
- ✅ 已配置 SPA 路由支持

---

## 🐛 常见问题

### Q1: 构建失败 "command not found: npm"
**解决：** 在 Cloudflare 项目设置中设置环境变量
```
NODE_VERSION = 18
```

### Q2: 页面刷新后 404
**解决：** 已自动配置 `_redirects` 文件，确保它在 `public/` 目录下

### Q3: 访问速度慢
**解决：**
- Cloudflare 在国内访问已经比 Vercel 快很多
- 如果还是慢，可以等待 5-10 分钟让 CDN 全球分发完成
- 或者考虑使用国内云服务（腾讯云/阿里云）

### Q4: GitHub 无法推送
**解决：**
```bash
# 方法1: 使用 HTTPS（输入用户名和 Personal Access Token）
git remote set-url origin https://github.com/jiliying0617-stack/photo-picker.git
git push origin main

# 方法2: 使用 SSH（需要先配置 SSH key）
git remote set-url origin git@github.com:jiliying0617-stack/photo-picker.git
git push origin main
```

---

## 🎯 下一步

### 立即部署：
1. 访问 https://dash.cloudflare.com
2. 按照上述步骤操作
3. 5分钟内完成部署

### 如果遇到问题：
运行本地开发服务器：
```bash
npm run dev
```
然后访问 http://localhost:5173

---

## 📞 需要帮助？

如果部署过程中遇到问题：
1. 查看 Cloudflare 构建日志
2. 检查 GitHub 代码是否推送成功
3. 确认构建命令和输出目录正确

---

**预计部署时间：** 首次 2-3 分钟，后续自动部署 1-2 分钟
**国内访问速度：** 🟢 良好（相比 Vercel 更稳定）
**费用：** 🟢 完全免费（每月 500 次构建，无限流量）

---

*生成时间: 2025-12-23*
*当前版本: v1.1.0*
