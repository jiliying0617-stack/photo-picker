#!/usr/bin/env python3
"""创建简单的 PNG 图标"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """创建圆角矩形图标"""
    # 创建带透明度的图片
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆角矩形背景
    padding = size // 8
    draw.rounded_rectangle(
        [(padding, padding), (size - padding, size - padding)],
        radius=size // 5,
        fill=(102, 126, 234, 255)  # #667eea
    )
    
    # 添加文件夹 emoji (简化为 F 字母)
    try:
        # 尝试使用系统字体
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", size // 2)
    except:
        font = ImageFont.load_default()
    
    # 绘制 F 代表 Folder
    text = "📁"
    # 使用 textbbox 获取文本边界
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2 - size // 8)
    draw.text(position, text, fill=(255, 255, 255, 255), font=font)
    
    # 保存
    img.save(filename, 'PNG')
    print(f"✓ 创建 {filename}")

# 创建三种尺寸
create_icon(128, 'icon128.png')
create_icon(48, 'icon48.png')
create_icon(16, 'icon16.png')

print("\n✅ 所有图标创建完成！")
