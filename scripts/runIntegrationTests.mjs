import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

const scriptPath = './dist/test/integration/runTest.js';

const command = platform() === 'linux' ? 'xvfb-run' : process.execPath;
const args =
  platform() === 'linux' ? ['-a', process.execPath, scriptPath] : [scriptPath];

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);