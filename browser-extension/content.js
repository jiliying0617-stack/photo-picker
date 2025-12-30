/**
 * Content Script - 注入到 Photo Picker 页面
 * 监听页面请求，调用扩展 API
 */

console.log('[Photo Picker Extension] Content Script 已加载');

/**
 * 向页面注入全局函数
 */
function injectShowInFinderAPI() {
  const script = document.createElement('script');
  script.textContent = `
    // 全局 API：在访达中显示文件
    window.showInFinder = async function(filePath) {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'SHOW_IN_FINDER_REQUEST',
          filePath: filePath
        }, '*');

        // 设置超时
        const timeout = setTimeout(() => {
          reject(new Error('请求超时：未安装扩展或 Native Host 未配置'));
        }, 5000);

        // 监听响应
        const handleResponse = (event) => {
          if (event.data.type === 'SHOW_IN_FINDER_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handleResponse);

            if (event.data.success) {
              resolve(event.data.result);
            } else {
              reject(new Error(event.data.error));
            }
          }
        };

        window.addEventListener('message', handleResponse);
      });
    };

    // 检查扩展是否已安装
    window.checkFinderExtension = async function() {
      return new Promise((resolve) => {
        window.postMessage({ type: 'CHECK_EXTENSION' }, '*');

        const timeout = setTimeout(() => {
          resolve({ installed: false });
        }, 1000);

        const handleResponse = (event) => {
          if (event.data.type === 'EXTENSION_STATUS') {
            clearTimeout(timeout);
            window.removeEventListener('message', handleResponse);
            resolve(event.data);
          }
        };

        window.addEventListener('message', handleResponse);
      });
    };

    console.log('[Photo Picker] showInFinder API 已注入');
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// 页面加载完成后注入 API
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectShowInFinderAPI);
} else {
  injectShowInFinderAPI();
}

/**
 * 监听来自页面的消息
 */
window.addEventListener('message', async (event) => {
  // 只接受来自同源的消息
  if (event.source !== window) return;

  if (event.data.type === 'SHOW_IN_FINDER_REQUEST') {
    console.log('[Extension] 收到页面请求:', event.data.filePath);

    try {
      // 发送消息给 Background Script
      const response = await chrome.runtime.sendMessage({
        action: 'showInFinder',
        filePath: event.data.filePath
      });

      // 返回结果给页面
      window.postMessage({
        type: 'SHOW_IN_FINDER_RESPONSE',
        success: response.success,
        result: response.result,
        error: response.error
      }, '*');

    } catch (error) {
      console.error('[Extension] 请求失败:', error);

      window.postMessage({
        type: 'SHOW_IN_FINDER_RESPONSE',
        success: false,
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'CHECK_EXTENSION') {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'ping' });

      window.postMessage({
        type: 'EXTENSION_STATUS',
        installed: true,
        version: response.version
      }, '*');
    } catch (_error) {
      window.postMessage({
        type: 'EXTENSION_STATUS',
        installed: false
      }, '*');
    }
  }
});
