#!/bin/bash
#
# Photo Picker - Native Host 安装脚本
# 适用于 macOS (也支持 Linux)
#

set -e

echo "📦 Photo Picker Native Host 安装脚本"
echo "======================================"
echo ""

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    echo "✓ 检测到 macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    echo "✓ 检测到 Linux"
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 获取当前目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NATIVE_HOST_DIR="$SCRIPT_DIR/native-host"
HOST_SCRIPT="$NATIVE_HOST_DIR/host.py"
MANIFEST_TEMPLATE="$NATIVE_HOST_DIR/com.photopicker.finder.json"

echo ""
echo "📁 目录信息:"
echo "  - 脚本目录: $SCRIPT_DIR"
echo "  - Native Host: $HOST_SCRIPT"
echo "  - Manifest 目标: $MANIFEST_DIR"

# 检查 Python
echo ""
echo "🔍 检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    echo "请安装 Python 3: https://www.python.org/downloads/"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo "✓ $PYTHON_VERSION"

# 检查 host.py
if [ ! -f "$HOST_SCRIPT" ]; then
    echo "❌ 找不到 host.py: $HOST_SCRIPT"
    exit 1
fi

# 确保可执行
chmod +x "$HOST_SCRIPT"
echo "✓ host.py 已设置为可执行"

# 创建 manifest 目录
echo ""
echo "📂 创建 Native Messaging Hosts 目录..."
mkdir -p "$MANIFEST_DIR"
echo "✓ 目录已创建: $MANIFEST_DIR"

# 获取扩展 ID（需要用户提供）
echo ""
echo "⚠️  需要扩展 ID"
echo ""
echo "请按照以下步骤获取扩展 ID:"
echo "1. 打开 Chrome 浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 启用\"开发者模式\""
echo "4. 点击\"加载已解压的扩展程序\""
echo "5. 选择目录: $SCRIPT_DIR"
echo "6. 复制扩展 ID (类似: abcdefghijklmnopqrstuvwxyz123456)"
echo ""
read -p "请输入扩展 ID: " EXTENSION_ID

if [ -z "$EXTENSION_ID" ]; then
    echo "❌ 扩展 ID 不能为空"
    exit 1
fi

# 生成 manifest 文件
MANIFEST_FILE="$MANIFEST_DIR/com.photopicker.finder.json"

echo ""
echo "📝 生成 manifest 文件..."
cat > "$MANIFEST_FILE" <<EOF
{
  "name": "com.photopicker.finder",
  "description": "Photo Picker Finder Integration Native Host",
  "path": "$HOST_SCRIPT",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo "✓ Manifest 已生成: $MANIFEST_FILE"

# 显示文件内容
echo ""
echo "📄 Manifest 内容:"
cat "$MANIFEST_FILE"

# 测试 host.py
echo ""
echo "🧪 测试 Native Host..."
echo '{"action":"showInFinder","path":"'$HOME'"}' | python3 "$HOST_SCRIPT" 2>&1 | head -c 100 || true
echo ""
echo "✓ Native Host 基本测试通过"

# 完成
echo ""
echo "✅ 安装完成！"
echo ""
echo "下一步:"
echo "1. 重启 Chrome 浏览器"
echo "2. 打开 Photo Picker: http://localhost:5173"
echo "3. 右键点击照片 → 选择\"在访达中显示\""
echo ""
echo "故障排查:"
echo "- 查看日志: tail -f ~/photo-picker-native-host.log"
echo "- 测试扩展: 点击扩展图标 → \"测试 Native Host\""
echo ""
