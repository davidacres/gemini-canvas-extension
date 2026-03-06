# Testing

The M0 scaffold uses two test layers:

- `npm run test:unit`: fast unit tests with Vitest for pure domain logic
- `npm run test:integration`: VS Code host integration tests with Mocha and `@vscode/test-electron`

Run the full suite with:

```bash
npm test
```

Build validation remains separate:

```bash
npm run build
```

CI runs `lint`, `typecheck`, `test`, and `build` in that order.