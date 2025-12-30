# 🚀 快速开始 - 5 分钟安装指南

## 📋 安装前准备

✅ Chrome 或 Edge 浏览器
✅ Python 3 已安装
✅ macOS / Linux 系统

---

## 步骤 1: 安装 Chrome 扩展 (2 分钟)

### 1.1 打开扩展管理页面

在 Chrome 地址栏输入:
```
chrome://extensions/
```

### 1.2 启用开发者模式

右上角打开 **"开发者模式"** 开关

### 1.3 加载扩展

1. 点击 **"加载已解压的扩展程序"**
2. 选择目录:
   ```
   /Users/jiliying/Desktop/photo-picker/browser-extension
   ```
3. 点击"选择"

### 1.4 复制扩展 ID

在扩展卡片上找到 **ID**，复制它（类似 `abcdefghijklmnopqrstuvwxyz123456`）

---

## 步骤 2: 安装 Native Host (2 分钟)

### 2.1 运行安装脚本

打开终端，执行:

```bash
cd /Users/jiliying/Desktop/photo-picker/browser-extension
bash install-native-host.sh
```

### 2.2 输入扩展 ID

脚本会提示输入扩展 ID，粘贴步骤 1.4 复制的 ID

### 2.3 等待安装完成

看到 ✅ 表示安装成功

---

## 步骤 3: 重启浏览器 (30 秒)

**重要！必须完全重启 Chrome**

### macOS
```bash
killall "Google Chrome"
```

然后重新打开 Chrome

### 手动方式
完全退出 Chrome（Cmd+Q），然后重新打开

---

## 步骤 4: 测试功能 (30 秒)

### 4.1 测试扩展

1. 点击 Chrome 工具栏的扩展图标 📁
2. 点击 **"测试 Native Host"**
3. 应该会打开访达

### 4.2 在 Photo Picker 中测试

1. 打开 http://localhost:5173
2. 导入照片
3. 右键点击照片
4. 选择 **"在访达中显示"**
5. 文件位置自动在访达中打开 🎉

---

## ✅ 安装完成！

现在你可以：
- ✨ 右键照片 → 在访达中显示（系统级，无需下载）
- 🔄 自动检测扩展状态
- 📁 支持主面板和大图预览

---

## ❌ 遇到问题？

### 问题 1: "Native Host 未安装"

**解决**:
```bash
# 检查 manifest 文件
ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

# 重新运行安装脚本
bash install-native-host.sh
```

### 问题 2: 扩展图标不显示

**临时方案**: 功能仍然可用，图标不影响使用

**完整解决**:
```bash
cd browser-extension/icons
# 手动创建 icon16.png, icon48.png, icon128.png
```

### 问题 3: 点击"在访达中显示"无反应

**检查步骤**:
1. 确认扩展已启用 (chrome://extensions/)
2. 确认已重启浏览器
3. 查看控制台是否有错误
4. 查看日志:
   ```bash
   tail -f ~/photo-picker-native-host.log
   ```

---

## 📚 更多信息

详细文档: [README.md](./README.md)

---

**5 分钟安装，终身受用！** 🚀
