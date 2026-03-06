import assert from 'node:assert/strict';

import * as vscode from 'vscode';

describe('extension activation', () => {
  it('loads the extension manifest and activates successfully', async () => {
    const extension = vscode.extensions.getExtension('davidacres.gemini-canvas-extension');

    assert.ok(extension, 'Expected the extension to be discoverable in the test host.');

    await extension.activate();

    assert.equal(extension.isActive, true);
  });
});
