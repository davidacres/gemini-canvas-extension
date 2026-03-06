import { describe, expect, it } from 'vitest';

import { isScaffoldReady, missingScaffoldItems } from '../../domain/scaffoldStatus';

describe('scaffoldStatus', () => {
  it('reports ready when all scaffold parts are present', () => {
    expect(
      isScaffoldReady({
        extensionHost: true,
        testHarness: true,
        webviewBundle: true,
      }),
    ).toBe(true);
  });

  it('lists missing scaffold parts in a stable order', () => {
    expect(
      missingScaffoldItems({
        extensionHost: false,
        testHarness: true,
        webviewBundle: false,
      }),
    ).toEqual(['extension host', 'webview bundle']);
  });
});
