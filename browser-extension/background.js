/**
 * Chrome Extension Background Service Worker
 * 处理与 Native Messaging Host 的通信
 */

// Native Messaging Host 的名称（需要与本地应用配置一致）
const HOST_NAME = 'com.photopicker.finder';

/**
 * 监听来自 Content Script 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showInFinder') {
    showInFinder(request.filePath)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开启
  }

  if (request.action === 'ping') {
    // 测试扩展是否安装
    sendResponse({ installed: true, version: chrome.runtime.getManifest().version });
    return false;
  }
});

/**
 * 通过 Native Messaging 在访达中显示文件
 */
async function showInFinder(filePath) {
  return new Promise((resolve, reject) => {
    console.log('[Extension] 正在连接 Native Host:', HOST_NAME);
    console.log('[Extension] 文件路径:', filePath);

    try {
      const port = chrome.runtime.connectNative(HOST_NAME);

      port.onMessage.addListener((response) => {
        console.log('[Extension] 收到 Native Host 响应:', response);

        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || '未知错误'));
        }

        port.disconnect();
      });

      port.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('[Extension] Native Host 断开连接:', error);
          reject(new Error(`Native Host 连接失败: ${error.message}`));
        }
      });

      // 发送消息给 Native Host
      port.postMessage({
        action: 'showInFinder',
        path: filePath
      });

    } catch (error) {
      console.error('[Extension] 连接失败:', error);
      reject(error);
    }
  });
}

/**
 * 扩展安装时的处理
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Extension] 扩展已安装:', details.reason);

  if (details.reason === 'install') {
    // 首次安装，打开配置页面
    chrome.tabs.create({
      url: 'popup.html'
    });
  }
});

console.log('[Extension] Background Service Worker 已启动');
