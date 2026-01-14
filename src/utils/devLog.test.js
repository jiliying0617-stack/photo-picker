import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('devLog', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should call console.log in development mode', async () => {
    // In vitest, import.meta.env.DEV is true by default
    const { devLog } = await import('./devLog.js');

    devLog('test message', 123, { key: 'value' });

    if (import.meta.env.DEV) {
      expect(consoleLogSpy).toHaveBeenCalledWith('test message', 123, { key: 'value' });
    }
  });

  it('should call console.warn in development mode', async () => {
    const { devWarn } = await import('./devLog.js');

    devWarn('warning message');

    if (import.meta.env.DEV) {
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
    }
  });

  it('should call console.error in development mode', async () => {
    const { devError } = await import('./devLog.js');

    devError('error message', new Error('test error'));

    if (import.meta.env.DEV) {
      expect(consoleErrorSpy).toHaveBeenCalled();
    }
  });

  it('should pass multiple arguments correctly', async () => {
    const { devLog } = await import('./devLog.js');

    devLog('arg1', 'arg2', 'arg3', 'arg4');

    if (import.meta.env.DEV) {
      expect(consoleLogSpy).toHaveBeenCalledWith('arg1', 'arg2', 'arg3', 'arg4');
    }
  });

  it('should handle complex objects', async () => {
    const { devLog } = await import('./devLog.js');

    const complexObject = {
      nested: {
        array: [1, 2, 3],
        string: 'test',
      },
    };

    devLog('Complex:', complexObject);

    if (import.meta.env.DEV) {
      expect(consoleLogSpy).toHaveBeenCalledWith('Complex:', complexObject);
    }
  });
});
