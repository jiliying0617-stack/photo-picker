/**
 * Extension Popup Script
 */

const hostStatusEl = document.getElementById('host-status');
const testButton = document.getElementById('test-button');

// 检查 Native Host 状态
async function checkNativeHostStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'showInFinder',
      filePath: '/tmp/test'
    });

    if (response.success || response.error) {
      hostStatusEl.textContent = '✓ 已连接';
      hostStatusEl.className = 'status-value success';
    }
  } catch (_error) {
    hostStatusEl.textContent = '✗ 未安装';
    hostStatusEl.className = 'status-value error';
  }
}

// 测试按钮
testButton.addEventListener('click', async () => {
  testButton.textContent = '测试中...';
  testButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'showInFinder',
      filePath: '/Users'  // 浏览器环境没有 process.env
    });

    if (response.success) {
      alert('✅ 测试成功！应该已经打开了访达。');
      hostStatusEl.textContent = '✓ 已连接';
      hostStatusEl.className = 'status-value success';
    } else {
      alert('❌ 测试失败: ' + response.error);
    }
  } catch (_error) {
    alert('❌ Native Host 未安装或配置错误\n\n请运行安装脚本:\nbash install-native-host.sh');
    hostStatusEl.textContent = '✗ 未安装';
    hostStatusEl.className = 'status-value error';
  } finally {
    testButton.textContent = '测试 Native Host';
    testButton.disabled = false;
  }
});

// 页面加载时检查状态
checkNativeHostStatus();
