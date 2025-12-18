#!/bin/bash

echo "🚀 筛图神器 - 部署脚本"
echo "================================"
echo ""

# 检查是否是 Git 仓库
if [ ! -d .git ]; then
    echo "❌ 错误: 当前目录不是 Git 仓库"
    echo "请先运行: git init"
    exit 1
fi

# 检查是否有远程仓库
if ! git remote | grep -q "origin"; then
    echo "❌ 错误: 没有配置远程仓库"
    echo "请先运行: git remote add origin https://github.com/YOUR_USERNAME/photo-picker.git"
    exit 1
fi

# 添加所有文件
echo "📦 添加文件..."
git add .

# 提交
echo "💾 提交更改..."
read -p "请输入提交信息 (默认: 更新部署): " commit_msg
commit_msg=${commit_msg:-"更新部署"}
git commit -m "$commit_msg"

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 接下来的步骤："
echo "1. 访问你的 GitHub 仓库"
echo "2. 进入 Settings → Pages"
echo "3. Source 选择 'GitHub Actions'"
echo "4. 等待 2-3 分钟，GitHub Actions 会自动部署"
echo "5. 访问 https://YOUR_USERNAME.github.io/"
echo ""
echo "🎉 祝部署顺利！"
