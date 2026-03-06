import * as vscode from 'vscode';

import { isScaffoldReady, missingScaffoldItems } from '../domain/scaffoldStatus';

const scaffoldStatus = {
  extensionHost: true,
  testHarness: true,
  webviewBundle: true,
};

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Gemini Canvas');
  context.subscriptions.push(output);

  const showWelcome = vscode.commands.registerCommand('geminiCanvas.showWelcome', async () => {
    const ready = isScaffoldReady(scaffoldStatus);
    const missing = missingScaffoldItems(scaffoldStatus);

    output.appendLine('Gemini Canvas scaffold activated.');
    output.appendLine(ready ? 'M0 scaffold is ready for iteration.' : `Missing: ${missing.join(', ')}`);
    output.show(true);

    await vscode.window.showInformationMessage(
      ready
        ? 'Gemini Canvas scaffold is ready for the next milestone.'
        : `Gemini Canvas scaffold is missing: ${missing.join(', ')}`,
    );
  });

  context.subscriptions.push(showWelcome);
}

export function deactivate(): void {}
