import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const publicIndex = path.join(repoRoot, 'src/core/index.ts');
const allowedPublicExports = ['./engine', './publicTypes', './serialization/resultSerialization', './serialization/goldenSnapshots', './public-link/publicResultDto'];
const uiRoots = ['app', 'components', 'ui', 'src/app', 'src/components', 'src/ui'];
const forbiddenInternalImportPatterns = [
  /from\s+['"][^'"]*core\/methodology[^'"]*['"]/,
  /from\s+['"][^'"]*core\/scoring[^'"]*['"]/,
  /from\s+['"][^'"]*core\/report[^'"]*['"]/,
  /from\s+['"][^'"]*core\/audit[^'"]*['"]/,
  /from\s+['"][^'"]*src\/core\/methodology[^'"]*['"]/,
  /from\s+['"][^'"]*src\/core\/scoring[^'"]*['"]/,
  /from\s+['"][^'"]*src\/core\/report[^'"]*['"]/,
  /from\s+['"][^'"]*src\/core\/audit[^'"]*['"]/,
  /import\([^)]*['"][^'"]*core\/methodology[^'"]*['"]\)/,
  /import\([^)]*['"][^'"]*core\/scoring[^'"]*['"]\)/,
  /import\([^)]*['"][^'"]*core\/report[^'"]*['"]\)/,
  /import\([^)]*['"][^'"]*core\/audit[^'"]*['"]\)/
];

describe('public API import boundary', () => {
  it('keeps src/core/index.ts limited to the public engine and public types', () => {
    const indexSource = readFileSync(publicIndex, 'utf8');
    const exportedModules = Array.from(indexSource.matchAll(/from\s+['"]([^'"]+)['"]/g)).map((match) => match[1]);

    expect(exportedModules.length).toBeGreaterThan(0);
    expect(exportedModules.every((modulePath) => modulePath !== undefined && allowedPublicExports.includes(modulePath))).toBe(true);
  });

  it('requires future UI/app layers to import only from src/core public entrypoint', () => {
    const violations: string[] = [];

    for (const root of uiRoots.map((item) => path.join(repoRoot, item)).filter((item) => existsSync(item))) {
      for (const file of listSourceFiles(root)) {
        const source = readFileSync(file, 'utf8');
        const hasForbiddenImport = forbiddenInternalImportPatterns.some((pattern) => pattern.test(source));

        if (hasForbiddenImport) {
          violations.push(path.relative(repoRoot, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

function listSourceFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(root, entry);
    const stat = statSync(absolute);

    if (stat.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'coverage'].includes(entry)) continue;
      files.push(...listSourceFiles(absolute));
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(absolute);
    }
  }

  return files;
}
