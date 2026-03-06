import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commands } from '../test/__mocks__/vscode';
import { activate, deactivate } from '../extension/extension';

describe('extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports activate function', () => {
    expect(typeof activate).toBe('function');
  });

  it('exports deactivate function', () => {
    expect(typeof deactivate).toBe('function');
  });

  it('registers geminiCanvas.helloWorld command on activate', () => {
    const subscriptions: { dispose: () => void }[] = [];
    const context = { subscriptions } as unknown as Parameters<typeof activate>[0];
    activate(context);
    expect(commands.registerCommand).toHaveBeenCalledWith(
      'geminiCanvas.helloWorld',
      expect.any(Function),
    );
    expect(subscriptions).toHaveLength(1);
  });

  it('deactivate returns void', () => {
    expect(deactivate()).toBeUndefined();
  });
});
