import type { ReactElement } from 'react';

export function App(): ReactElement {
  return (
    <main className="canvas-shell">
      <section className="panel panel-preview">
        <p className="eyebrow">Gemini Canvas</p>
        <h1>M0 scaffold is wired.</h1>
        <p>
          The extension host, test harness, and webview build pipeline are in place. Later milestones can
          now add the custom editor and interactive layout on top of this baseline.
        </p>
      </section>
      <aside className="panel panel-context">
        <h2>Ready for next milestone</h2>
        <ul>
          <li>Strict TypeScript compilation</li>
          <li>Vitest unit coverage for pure logic</li>
          <li>VS Code integration harness</li>
          <li>Vite webview bundling</li>
        </ul>
      </aside>
    </main>
  );
}
