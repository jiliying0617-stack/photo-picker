# 📦 安装向导 - Photo Picker 浏览器扩展

**跟着这个指南，5 分钟完成安装！**

---

## ✅ 步骤 1: 在 Chrome 中加载扩展

### 1.1 打开扩展管理页面

在 Chrome 地址栏输入并访问：
```
chrome://extensions/
```

### 1.2 启用开发者模式

在页面右上角，打开 **"开发者模式"** 开关

![开发者模式](https://i.imgur.com/placeholder.png)

### 1.3 加载扩展

1. 点击左上角 **"加载已解压的扩展程序"** 按钮
2. 在文件选择器中，导航到：
   ```
   /Users/jiliying/Desktop/photo-picker/browser-extension
   ```
3. 点击 **"选择"** 按钮

### 1.4 确认扩展已加载

你应该看到：
- ✅ 扩展卡片显示 "Photo Picker - Finder Integration"
- ✅ 有 📁 图标
- ✅ 版本号 1.0.0
- ✅ 状态为"已启用"

### 1.5 复制扩展 ID

在扩展卡片上找到 **ID**：
```
ID: abcdefghijklmnopqrstuvwxyz123456
```

**重要:** 复制这个 ID（全部字母和数字），下一步需要用到！

---

## ✅ 步骤 2: 安装 Native Messaging Host

### 2.1 打开终端

按 `Cmd + Space`，输入 `Terminal`，打开终端

### 2.2 进入扩展目录

```bash
cd /Users/jiliying/Desktop/photo-picker/browser-extension
```

### 2.3 运行安装脚本

```bash
bash install-native-host.sh
```

### 2.4 输入扩展 ID

脚本会提示：
```
请输入扩展 ID:
```

**粘贴步骤 1.5 复制的 ID**，然后按回车

### 2.5 等待安装完成

你会看到：
```
✅ 安装完成！
```

---

## ✅ 步骤 3: 重启 Chrome 浏览器

**重要！必须完全重启 Chrome**

### 方法 1: 使用命令行（推荐）

在终端运行：
```bash
killall "Google Chrome"
```

然后手动重新打开 Chrome

### 方法 2: 手动退出

1. 点击 Chrome 菜单 → 退出 Chrome（或按 `Cmd + Q`）
2. 重新打开 Chrome

⚠️ **注意:** 不是关闭窗口，而是完全退出应用！

---

## ✅ 步骤 4: 测试扩展

### 4.1 测试 Native Host

1. 打开 Chrome
2. 点击工具栏的扩展图标 📁
3. 点击 **"测试 Native Host"** 按钮
4. 如果成功，会打开访达

### 4.2 在 Photo Picker 中测试

1. 访问 http://localhost:5173
2. 导入照片文件夹
3. 右键点击任意照片
4. 选择 **"在访达中显示"**
5. 文件位置应该自动在访达中打开！🎉

---

## 🎉 安装完成！

现在你可以：
- ✨ 右键照片 → 直接在访达中打开（无需下载）
- 🚀 系统级体验，零等待
- 📁 支持主面板和大图预览

---

## ❌ 遇到问题？

### 问题 1: 找不到扩展目录

**解决:**
```bash
# 确认目录存在
ls -la /Users/jiliying/Desktop/photo-picker/browser-extension

# 如果不存在，检查项目位置
```

### 问题 2: "Native Host 未安装"

**解决方案 A: 检查 manifest 文件**
```bash
# macOS
cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.photopicker.finder.json

# 确认文件存在且包含正确的扩展 ID
```

**解决方案 B: 重新运行安装脚本**
```bash
cd /Users/jiliying/Desktop/photo-picker/browser-extension
bash install-native-host.sh
```

### 问题 3: 扩展 ID 改变了

如果重新加载扩展后 ID 变了：
1. 复制新的扩展 ID
2. 重新运行 `bash install-native-host.sh`
3. 输入新的 ID
4. 重启 Chrome

### 问题 4: 点击"在访达中显示"无反应

**检查清单:**
- [ ] 扩展已启用（chrome://extensions/）
- [ ] 已完全重启 Chrome（不是关闭窗口）
- [ ] Native Host 已安装（运行测试）
- [ ] 查看控制台是否有错误

**查看日志:**
```bash
tail -f ~/photo-picker-native-host.log
```

---

## 🔧 手动安装检查

如果自动脚本失败，可以手动验证：

### 1. 检查 Python
```bash
python3 --version
# 应该显示 Python 3.x
```

### 2. 检查 host.py 可执行
```bash
ls -la /Users/jiliying/Desktop/photo-picker/browser-extension/native-host/host.py
# 应该显示 -rwxr-xr-x (有 x 权限)
```

### 3. 测试 host.py
```bash
echo '{"action":"showInFinder","path":"'$HOME'"}' | python3 /Users/jiliying/Desktop/photo-picker/browser-extension/native-host/host.py
# 应该打开访达并返回 JSON
```

### 4. 检查 manifest 位置
```bash
# macOS
ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

# 应该看到 com.photopicker.finder.json
```

---

## 📞 需要帮助？

- 查看完整文档: [README.md](./README.md)
- 查看日志: `~/photo-picker-native-host.log`
- 在 Chrome 控制台查看错误信息

---

**祝你安装顺利！** 🚀
