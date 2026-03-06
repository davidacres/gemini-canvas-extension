import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('geminiCanvas.helloWorld', () => {
    vscode.window.showInformationMessage('Gemini Canvas is active.');
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  // Clean up resources
}
