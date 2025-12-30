# Photo Picker - Finder Integration 浏览器扩展

**真正的系统级"在访达中打开"功能**

通过 Chrome 扩展 + Native Messaging 实现，无需下载即可直接在访达中显示文件。

---

## 🎯 功能特性

- ✅ **真正的系统级操作** - 直接调用系统命令打开访达
- ✅ **无需下载** - 不通过浏览器下载，直接打开源文件位置
- ✅ **跨平台支持** - macOS (访达), Linux (Nautilus/Dolphin), Windows (资源管理器)
- ✅ **自动检测** - Photo Picker 自动检测扩展是否安装
- ✅ **后备方案** - 扩展未安装时自动降级到下载方案

---

## 📦 安装步骤

### 1. 安装 Chrome 扩展

```bash
# 1. 打开 Chrome 浏览器
# 2. 访问 chrome://extensions/
# 3. 启用"开发者模式"（右上角开关）
# 4. 点击"加载已解压的扩展程序"
# 5. 选择目录: /Users/jiliying/Desktop/photo-picker/browser-extension
```

### 2. 安装 Native Messaging Host

```bash
cd /Users/jiliying/Desktop/photo-picker/browser-extension
bash install-native-host.sh
```

安装脚本会：
- 检测操作系统和 Python 环境
- 请求输入扩展 ID
- 生成 manifest 文件到系统目录
- 配置 Native Messaging Host

### 3. 重启浏览器

**重要**: 安装后必须完全重启 Chrome 浏览器

```bash
# macOS
killall "Google Chrome"

# 然后重新打开 Chrome
```

---

## 🚀 使用方法

### 在 Photo Picker 中使用

1. 打开 Photo Picker: http://localhost:5173
2. 导入照片文件夹
3. 右键点击任意照片
4. 选择 **"在访达中显示"** 📁
5. 文件位置会自动在访达中打开！

### 测试扩展

1. 点击 Chrome 工具栏的扩展图标 📁
2. 点击 **"测试 Native Host"** 按钮
3. 如果成功，会打开访达

---

## 📁 目录结构

```
browser-extension/
├── manifest.json              # 扩展配置文件
├── background.js              # Background Service Worker
├── content.js                 # Content Script (注入到页面)
├── popup.html                 # 扩展弹窗界面
├── popup.js                   # 弹窗逻辑
├── icons/                     # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── native-host/               # Native Messaging Host
│   ├── host.py                # Python 主程序
│   └── com.photopicker.finder.json  # Manifest 模板
├── install-native-host.sh     # 自动安装脚本
└── README.md                  # 本文档
```

---

## 🔧 工作原理

### 架构流程

```
Photo Picker 页面
    ↓ (postMessage)
Content Script
    ↓ (chrome.runtime.sendMessage)
Background Service Worker
    ↓ (Native Messaging)
Native Host (Python)
    ↓ (subprocess)
系统命令 (open -R / xdg-open)
    ↓
访达/文件管理器打开
```

### 核心组件

1. **Content Script** (`content.js`)
   - 注入 `window.showInFinder()` API 到页面
   - 监听页面消息，转发给 Background

2. **Background Service Worker** (`background.js`)
   - 接收来自 Content Script 的请求
   - 通过 Native Messaging 连接 Native Host

3. **Native Host** (`host.py`)
   - Python 程序，运行在系统级
   - 调用系统命令打开文件管理器

4. **系统命令**
   - macOS: `open -R <path>`
   - Linux: `nautilus --select <path>` 或 `xdg-open`
   - Windows: `explorer /select,<path>`

---

## 🐛 故障排查

### 1. 扩展图标不显示

**原因**: 缺少图标文件

**解决**:
```bash
cd browser-extension/icons
bash create-icons.sh
```

或手动创建 16x16, 48x48, 128x128 的 PNG 图标。

### 2. "Native Host 未安装"

**检查步骤**:

1. **确认 manifest 文件存在**
   ```bash
   # macOS
   ls -la ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

   # Linux
   ls -la ~/.config/google-chrome/NativeMessagingHosts/
   ```

2. **检查 manifest 内容**
   ```bash
   cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.photopicker.finder.json
   ```

   确认:
   - `path` 指向正确的 host.py 位置
   - `allowed_origins` 包含正确的扩展 ID

3. **测试 Python 脚本**
   ```bash
   echo '{"action":"showInFinder","path":"'$HOME'"}' | python3 native-host/host.py
   ```

   应该打开访达并返回 JSON 响应。

### 3. 查看日志

Native Host 会记录日志到:
```bash
tail -f ~/photo-picker-native-host.log
```

Chrome 扩展日志:
1. 访问 `chrome://extensions/`
2. 找到扩展，点击"查看背景页"
3. 打开 Console 查看日志

### 4. 扩展 ID 错误

如果重新加载扩展后 ID 改变:

1. 重新运行安装脚本
   ```bash
   bash install-native-host.sh
   ```

2. 输入新的扩展 ID

3. 重启 Chrome

---

## 🔐 安全说明

### Native Messaging 安全机制

1. **白名单验证**: 只允许指定扩展 ID 连接
2. **路径验证**: 检查文件是否存在才执行
3. **系统级隔离**: Native Host 独立进程运行
4. **日志记录**: 所有操作都有日志追踪

### 权限说明

扩展需要的权限:
- `nativeMessaging`: 与 Native Host 通信
- `downloads`: (可选) 后备下载方案
- `host_permissions`: 访问 localhost (仅开发环境)

---

## 🎨 自定义扩展

### 修改图标

在 `icons/` 目录放置:
- `icon16.png` - 工具栏图标
- `icon48.png` - 扩展管理页
- `icon128.png` - Chrome Web Store

### 支持其他文件管理器

编辑 `native-host/host.py` 的 `show_in_finder()` 函数:

```python
# 添加你的文件管理器
file_managers = [
    ['your-file-manager', '--select', str(path)],
    # ...
]
```

---

## 📝 开发说明

### 调试 Content Script

```javascript
// 在 Photo Picker 控制台运行
await window.checkFinderExtension();  // 检查扩展状态
await window.showInFinder('/path/to/file');  // 测试功能
```

### 调试 Native Host

```bash
# 直接测试 Python 脚本
python3 native-host/host.py

# 然后手动输入 JSON (Ctrl+D 结束):
{"action":"showInFinder","path":"/Users/yourname"}
```

### 修改后重新加载

1. Content Script 修改: 刷新 Photo Picker 页面
2. Background 修改: 访问 `chrome://extensions/` 点击刷新
3. Native Host 修改: 无需重启（每次调用都重新执行）

---

## 🚀 部署到生产环境

### 发布到 Chrome Web Store

1. **打包扩展**
   ```bash
   cd browser-extension
   zip -r photo-picker-extension.zip * -x "*.git*" "*.DS_Store" "node_modules/*"
   ```

2. **上传到 Chrome Web Store**
   - 访问 https://chrome.google.com/webstore/devconsole
   - 创建新项目
   - 上传 ZIP 文件

3. **获取正式扩展 ID**
   - Web Store 会分配固定 ID
   - 更新 Native Host manifest 中的 `allowed_origins`

### 自动化安装脚本

为用户提供一键安装:

```bash
curl -fsSL https://yourdomain.com/install.sh | bash
```

---

## 🤝 贡献指南

欢迎提交 Pull Request！

开发环境设置:
```bash
git clone <repository>
cd photo-picker/browser-extension
# 按照安装步骤操作
```

---

## 📄 许可证

MIT License - 与 Photo Picker 主项目相同

---

## 🙏 致谢

- Chrome Extension API 文档
- Native Messaging 协议规范
- Photo Picker 项目

---

**Built with ❤️ by Photo Picker Team**

完整项目: https://github.com/yourusername/photo-picker
