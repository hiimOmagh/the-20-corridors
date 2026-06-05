import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { serializeGoldenProfileSnapshotDocument } from '../src/core/serialization/goldenSnapshots';

const snapshotPath = path.join(process.cwd(), 'docs/evidence/golden-public-results-latest.json');

if (!existsSync(snapshotPath)) {
  throw new Error(`Missing golden public result snapshot: ${path.relative(process.cwd(), snapshotPath)}`);
}

const expected = serializeGoldenProfileSnapshotDocument();
const actual = readFileSync(snapshotPath, 'utf8');

if (actual !== expected) {
  throw new Error('Golden public result snapshot is stale. Run npm run snapshots:generate.');
}

console.log('Golden public result snapshots are current.');
