import { vi } from 'vitest';

const commands = {
  registerCommand: vi.fn((_command: string, _callback: (...args: unknown[]) => unknown) => ({
    dispose: vi.fn(),
  })),
};

const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
};

const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn(),
    update: vi.fn(),
  })),
};

const Uri = {
  file: vi.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
  parse: vi.fn((uri: string) => ({ fsPath: uri, scheme: 'file' })),
};

export { commands, window, workspace, Uri };
