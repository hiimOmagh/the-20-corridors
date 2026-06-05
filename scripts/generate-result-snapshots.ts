import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serializeGoldenProfileSnapshotDocument } from '../src/core/serialization/goldenSnapshots';

const outputPath = path.join(process.cwd(), 'docs/evidence/golden-public-results-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serializeGoldenProfileSnapshotDocument(), 'utf8');
console.log(`Golden public result snapshots written to ${path.relative(process.cwd(), outputPath)}`);
