export interface ScaffoldStatus {
  extensionHost: boolean;
  testHarness: boolean;
  webviewBundle: boolean;
}

const statusLabels: Record<keyof ScaffoldStatus, string> = {
  extensionHost: 'extension host',
  testHarness: 'test harness',
  webviewBundle: 'webview bundle',
};

export function missingScaffoldItems(status: ScaffoldStatus): string[] {
  return (Object.entries(status) as Array<[keyof ScaffoldStatus, boolean]>)
    .filter(([, ready]) => !ready)
    .map(([key]) => statusLabels[key]);
}

export function isScaffoldReady(status: ScaffoldStatus): boolean {
  return missingScaffoldItems(status).length === 0;
}
