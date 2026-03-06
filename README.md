# Gemini Canvas Extension

Gemini Canvas Extension is a VS Code extension scaffold for building a design-first workspace inside the editor area. This milestone establishes the project foundation only: strict TypeScript, linting and formatting, unit and integration test harnesses, and a reproducible build pipeline for the extension host plus webview bundle.

## Current scope

- VS Code extension entrypoint with a minimal command contribution
- React and Vite webview placeholder bundle for later custom-editor work
- Vitest unit tests for pure domain logic
- Mocha plus `@vscode/test-electron` integration tests to verify the extension loads
- GitHub Actions CI wired to `lint`, `typecheck`, `test`, and `build`

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

## Project layout

- `src/extension/`: extension host activation and commands
- `src/domain/`: pure, testable logic
- `src/webview/`: React + Vite webview scaffold
- `src/test/`: unit and integration tests
- `media/webview/`: generated webview assets

## M0 exit criteria

M0 is complete when:

- `npm test` is green
- `npm run build` succeeds
- the integration suite can activate the extension in a VS Code test host