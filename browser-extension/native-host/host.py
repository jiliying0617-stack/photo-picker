#!/usr/bin/env python3
"""
Native Messaging Host for Photo Picker Finder Integration
与 Chrome 扩展通信，调用系统命令在访达中打开文件
"""

import sys
import json
import struct
import subprocess
import os
from pathlib import Path

def log(message):
    """记录日志到文件（用于调试）"""
    log_file = Path.home() / 'photo-picker-native-host.log'
    with open(log_file, 'a') as f:
        f.write(f"{message}\n")

def send_message(message):
    """发送消息给扩展"""
    encoded_message = json.dumps(message).encode('utf-8')
    message_length = len(encoded_message)

    # Native Messaging 协议：4字节长度 + JSON 消息
    sys.stdout.buffer.write(struct.pack('I', message_length))
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

    log(f"发送消息: {message}")

def read_message():
    """从扩展读取消息"""
    # 读取消息长度（4字节）
    raw_length = sys.stdin.buffer.read(4)

    if len(raw_length) == 0:
        return None

    message_length = struct.unpack('I', raw_length)[0]

    # 读取消息内容
    message = sys.stdin.buffer.read(message_length).decode('utf-8')

    log(f"收到消息: {message}")
    return json.loads(message)

def show_in_finder(file_path):
    """在访达中显示文件"""
    try:
        # 确保路径存在
        path = Path(file_path)

        if not path.exists():
            # 如果是相对路径，尝试展开
            path = path.expanduser().resolve()

        if not path.exists():
            return {
                'success': False,
                'error': f'文件不存在: {file_path}'
            }

        # macOS: 使用 open -R 在访达中显示文件
        if sys.platform == 'darwin':
            subprocess.run(['open', '-R', str(path)], check=True)
            log(f"已在访达中打开: {path}")
            return {
                'success': True,
                'message': '已在访达中打开',
                'path': str(path)
            }

        # Linux: 使用 xdg-open 或文件管理器
        elif sys.platform.startswith('linux'):
            # 尝试使用不同的文件管理器
            file_managers = [
                ['nautilus', '--select', str(path)],  # GNOME
                ['dolphin', '--select', str(path)],   # KDE
                ['thunar', str(path.parent)],         # XFCE
                ['xdg-open', str(path.parent)]        # 通用
            ]

            for cmd in file_managers:
                try:
                    subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
                    log(f"已打开文件管理器: {path}")
                    return {
                        'success': True,
                        'message': '已在文件管理器中打开',
                        'path': str(path)
                    }
                except (subprocess.CalledProcessError, FileNotFoundError):
                    continue

            return {
                'success': False,
                'error': '未找到支持的文件管理器'
            }

        # Windows: 使用 explorer /select
        elif sys.platform == 'win32':
            subprocess.run(['explorer', '/select,', str(path)], check=True)
            log(f"已在资源管理器中打开: {path}")
            return {
                'success': True,
                'message': '已在资源管理器中打开',
                'path': str(path)
            }

        else:
            return {
                'success': False,
                'error': f'不支持的操作系统: {sys.platform}'
            }

    except Exception as e:
        log(f"错误: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """主函数"""
    log("Native Host 已启动")

    try:
        while True:
            message = read_message()

            if message is None:
                break

            action = message.get('action')

            if action == 'showInFinder':
                file_path = message.get('path', '')
                result = show_in_finder(file_path)
                send_message(result)

            else:
                send_message({
                    'success': False,
                    'error': f'未知操作: {action}'
                })

    except Exception as e:
        log(f"主循环错误: {str(e)}")
        send_message({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    main()
