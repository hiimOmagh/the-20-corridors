import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const UI_IMPORT_BOUNDARY_SCHEMA_VERSION = 'phase-2.0-ui-import-boundary-v1' as const;

export interface UiImportBoundaryOptions {
  readonly repoRoot?: string;
}

export interface UiImportBoundaryViolation {
  readonly file: string;
  readonly importPath: string;
  readonly reason: 'internal_core_import' | 'blocked_scope_import';
}

export interface UiImportBoundaryReport {
  readonly schemaVersion: typeof UI_IMPORT_BOUNDARY_SCHEMA_VERSION;
  readonly roots: readonly string[];
  readonly allowedCoreEntrypoints: readonly string[];
  readonly forbiddenCorePrefixes: readonly string[];
  readonly gates: {
    readonly uiRootsExist: boolean;
    readonly noForbiddenCoreImports: boolean;
    readonly noBlockedScopeImports: boolean;
    readonly overallPassed: boolean;
  };
  readonly summary: {
    readonly scannedFileCount: number;
    readonly violationCount: number;
  };
  readonly violations: readonly UiImportBoundaryViolation[];
  readonly issues: readonly string[];
}

export const UI_IMPORT_ROOTS = ['src/app', 'src/components', 'src/features'] as const;

export const ALLOWED_CORE_ENTRYPOINTS = ['@/core', '@/core/index', '../../core', '../core'] as const;

export const FORBIDDEN_CORE_IMPORT_PREFIXES = [
  '@/core/methodology',
  '@/core/scoring',
  '@/core/report',
  '@/core/audit',
  '@/core/release',
  '@/core/serialization',
  'src/core/methodology',
  'src/core/scoring',
  'src/core/report',
  'src/core/audit',
  'src/core/release',
  'src/core/serialization',
  '../../core/methodology',
  '../../core/scoring',
  '../../core/report',
  '../../core/audit',
  '../../core/release',
  '../../core/serialization',
  '../core/methodology',
  '../core/scoring',
  '../core/report',
  '../core/audit',
  '../core/release',
  '../core/serialization'
] as const;

export const BLOCKED_SCOPE_IMPORT_PREFIXES = [
  '@/server',
  '@/api',
  '@/db',
  '@/database',
  '@/ai',
  '@/llm',
  '@/prompts',
  'src/server',
  'src/api',
  'src/db',
  'src/database',
  'src/ai',
  'src/llm',
  'src/prompts'
] as const;

export function runUiImportBoundary(options: UiImportBoundaryOptions = {}): UiImportBoundaryReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const existingRoots = UI_IMPORT_ROOTS.filter((root) => existsSync(path.join(repoRoot, root)));
  const sourceFiles = existingRoots.flatMap((root) => listSourceFiles(path.join(repoRoot, root)));
  const violations = sourceFiles.flatMap((file) => findViolations(repoRoot, file));
  const noForbiddenCoreImports = !violations.some((violation) => violation.reason === 'internal_core_import');
  const noBlockedScopeImports = !violations.some((violation) => violation.reason === 'blocked_scope_import');

  const gates = {
    uiRootsExist: existingRoots.length > 0,
    noForbiddenCoreImports,
    noBlockedScopeImports,
    overallPassed: false
  };
  const completeGates = {
    ...gates,
    overallPassed: gates.uiRootsExist && gates.noForbiddenCoreImports && gates.noBlockedScopeImports
  };

  return {
    schemaVersion: UI_IMPORT_BOUNDARY_SCHEMA_VERSION,
    roots: UI_IMPORT_ROOTS,
    allowedCoreEntrypoints: ALLOWED_CORE_ENTRYPOINTS,
    forbiddenCorePrefixes: FORBIDDEN_CORE_IMPORT_PREFIXES,
    gates: completeGates,
    summary: {
      scannedFileCount: sourceFiles.length,
      violationCount: violations.length
    },
    violations,
    issues: buildIssues(completeGates, violations)
  };
}

function findViolations(repoRoot: string, file: string): UiImportBoundaryViolation[] {
  const source = readFileSync(file, 'utf8');
  const imports = extractImportPaths(source);
  const relativeFile = path.relative(repoRoot, file).replaceAll(path.sep, '/');
  const violations: UiImportBoundaryViolation[] = [];

  for (const importPath of imports) {
    if (FORBIDDEN_CORE_IMPORT_PREFIXES.some((prefix) => importPath === prefix || importPath.startsWith(`${prefix}/`))) {
      violations.push({ file: relativeFile, importPath, reason: 'internal_core_import' });
    }

    if (BLOCKED_SCOPE_IMPORT_PREFIXES.some((prefix) => importPath === prefix || importPath.startsWith(`${prefix}/`))) {
      violations.push({ file: relativeFile, importPath, reason: 'blocked_scope_import' });
    }
  }

  return violations;
}

function extractImportPaths(source: string): string[] {
  const matches = [
    ...source.matchAll(/from\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...source.matchAll(/import\s+['"]([^'"]+)['"]/g)
  ];
  return matches.map((match) => match[1]).filter((item): item is string => typeof item === 'string');
}

function listSourceFiles(root: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(root).sort()) {
    if (['node_modules', '.next', 'dist', 'coverage'].includes(entry)) {
      continue;
    }

    const absolute = path.join(root, entry);
    const stat = statSync(absolute);

    if (stat.isDirectory()) {
      files.push(...listSourceFiles(absolute));
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(absolute);
    }
  }

  return files;
}

function buildIssues(
  gates: UiImportBoundaryReport['gates'],
  violations: readonly UiImportBoundaryViolation[]
): string[] {
  const issues: string[] = [];

  if (!gates.uiRootsExist) {
    issues.push('ui_import_boundary_no_ui_roots_found');
  }

  for (const violation of violations) {
    issues.push(`ui_import_boundary_violation:${violation.reason}:${violation.file}:${violation.importPath}`);
  }

  return issues;
}
