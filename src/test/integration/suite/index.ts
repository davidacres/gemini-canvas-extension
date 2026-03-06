import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import Mocha from 'mocha';

async function collectTestFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectTestFiles(fullPath);
      }

      return fullPath.endsWith('.test.js') ? [fullPath] : [];
    }),
  );

  return files.flat().sort();
}

export async function run(): Promise<void> {
  const mocha = new Mocha({
    color: true,
    ui: 'bdd',
  });
  const testsRoot = __dirname;
  const testFiles = await collectTestFiles(testsRoot);

  for (const file of testFiles) {
    mocha.addFile(file);
  }

  await new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} integration test(s) failed.`));
        return;
      }

      resolve();
    });
  });
}
