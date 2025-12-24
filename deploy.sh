#!/bin/bash

# 🚀 Photo Picker 自动部署脚本
# Linux Torvalds 风格 - 简单、直接、有效

set -e  # 遇到错误立即退出

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Photo Picker 部署脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 步骤 1: 检查 Git 状态
echo "📊 检查 Git 状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  发现未提交的更改"
    git status --short
    echo ""
    read -p "是否提交这些更改？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入提交信息: " commit_msg
        git add -A
        git commit -m "$commit_msg"
        echo "✅ 代码已提交"
    fi
else
    echo "✅ 工作目录干净"
fi
echo ""

# 步骤 2: 推送到 GitHub
echo "📤 推送代码到 GitHub..."
echo "正在推送到: $(git remote get-url origin)"
echo ""

# 尝试推送
if git push origin main; then
    echo "✅ 代码推送成功！"
else
    echo ""
    echo "❌ 推送失败 - 需要身份验证"
    echo ""
    echo "请选择一个方法："
    echo "1) 使用 SSH（推荐）"
    echo "2) 使用 Personal Access Token"
    echo "3) 稍后手动推送"
    echo ""
    read -p "选择 (1/2/3): " -n 1 -r choice
    echo ""

    case $choice in
        1)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📝 配置 SSH 密钥"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""

            # 检查是否已有 SSH 密钥
            if [ -f ~/.ssh/id_ed25519.pub ] || [ -f ~/.ssh/id_rsa.pub ]; then
                echo "发现现有 SSH 密钥："
                ls -la ~/.ssh/*.pub
                echo ""
                echo "复制以下公钥内容："
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                cat ~/.ssh/id_ed25519.pub 2>/dev/null || cat ~/.ssh/id_rsa.pub
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            else
                echo "生成新的 SSH 密钥..."
                read -p "请输入你的 GitHub 邮箱: " email
                ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
                echo ""
                echo "✅ SSH 密钥生成成功！"
                echo ""
                echo "复制以下公钥内容："
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                cat ~/.ssh/id_ed25519.pub
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            fi

            echo ""
            echo "接下来的步骤："
            echo "1. 访问: https://github.com/settings/keys"
            echo "2. 点击 'New SSH key'"
            echo "3. 粘贴上面的公钥"
            echo "4. 保存"
            echo ""
            read -p "完成后按 Enter 继续..."

            # 修改 remote URL 为 SSH
            echo "修改远程仓库 URL 为 SSH..."
            git remote set-url origin git@github.com:jiliying0617-stack/photo-picker.git
            echo "✅ 已切换到 SSH"

            # 再次尝试推送
            echo "重新推送..."
            git push origin main
            ;;

        2)
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📝 使用 Personal Access Token"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "生成 Token 的步骤："
            echo "1. 访问: https://github.com/settings/tokens"
            echo "2. 点击 'Generate new token (classic)'"
            echo "3. 勾选 'repo' 权限"
            echo "4. 生成并复制 token"
            echo ""
            read -p "请粘贴你的 Personal Access Token: " token

            # 使用 token 推送
            git push https://$token@github.com/jiliying0617-stack/photo-picker.git main
            ;;

        3)
            echo ""
            echo "⏭️  跳过推送，稍后手动执行："
            echo "   git push origin main"
            ;;
    esac
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Vercel 部署指南"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "代码已推送到 GitHub！"
echo ""
echo "接下来的步骤："
echo ""
echo "1. 访问 Vercel: https://vercel.com"
echo "2. 使用 GitHub 登录"
echo "3. 点击 'Add New...' → 'Project'"
echo "4. 选择 'photo-picker' 仓库"
echo "5. 点击 'Deploy'"
echo ""
echo "✅ 几分钟后你的网站就上线了！"
echo ""
echo "部署后你会得到一个 URL，例如："
echo "   https://photo-picker-xxx.vercel.app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
