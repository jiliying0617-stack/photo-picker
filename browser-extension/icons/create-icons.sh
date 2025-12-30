#!/bin/bash
# 创建扩展图标的脚本
# 由于无法直接创建图片，这里提供生成命令

echo "创建扩展图标..."
echo ""
echo "方法1: 使用 ImageMagick (推荐)"
echo "brew install imagemagick"
echo "convert -size 128x128 xc:none -fill '#667eea' -draw 'roundrectangle 15,15 113,113 15,15' -pointsize 80 -fill white -gravity center -annotate +0+0 '📁' icon128.png"
echo "convert icon128.png -resize 48x48 icon48.png"
echo "convert icon128.png -resize 16x16 icon16.png"
echo ""
echo "方法2: 手动创建"
echo "1. 在 Figma/Photoshop 创建 128x128 的图标"
echo "2. 使用文件夹 📁 emoji 或自定义设计"
echo "3. 导出为 icon128.png, icon48.png, icon16.png"
echo ""
echo "临时方案: 使用占位图标"

# 创建简单的占位符图标（单色PNG）
# 这里只是示例，实际需要真实图标
cat > icon128.svg <<'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="20" fill="#667eea"/>
  <text x="64" y="90" font-size="64" text-anchor="middle" fill="white">📁</text>
</svg>
EOF

echo "✓ 已创建 icon128.svg (可以用浏览器打开查看)"
echo ""
echo "请使用上述方法创建正式图标"
