// 生成唯一用户标识
// 由于纯前端无法获取真实IP,使用浏览器指纹 + localStorage

// 生成简单的浏览器指纹
function generateFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 0, 0);
    }
    const canvasData = canvas.toDataURL();

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvasHash: canvasData.slice(0, 50), // 取前50字符
    };

    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  } catch (error) {
    console.error('生成指纹失败:', error);
    // 降级方案：使用简单的随机ID
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 获取或创建用户ID
export function getUserId() {
  let userId = localStorage.getItem('photo-picker-user-id');

  if (!userId) {
    // 生成新的用户ID
    userId = `user_${generateFingerprint()}_${Date.now()}`;
    localStorage.setItem('photo-picker-user-id', userId);
  }

  return userId;
}

// 获取用户专属的存储key
export function getUserStorageKey(key) {
  const userId = getUserId();
  return `photo-picker_${userId}_${key}`;
}

// 清除当前用户的所有数据
export function clearUserData() {
  const userId = getUserId();
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(`photo-picker_${userId}_`)) {
      localStorage.removeItem(key);
    }
  });
}
