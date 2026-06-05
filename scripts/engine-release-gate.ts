import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { runEngineReleaseGate } from '../src/core/release/releaseGate';

const outputPath = resolve(process.cwd(), 'docs/evidence/engine-release-gate-latest.json');
const report = runEngineReleaseGate();
const serialized = `${JSON.stringify(report, null, 2)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialized, 'utf8');

const status = report.gates.overallPassed ? 'passed' : 'failed';
console.log(`Engine release gate ${status}.`);
console.log(`Methodology audit: ${report.gates.methodologyAuditPassed ? 'passed' : 'failed'}.`);
console.log(`Methodology evidence current: ${report.gates.methodologyEvidenceCurrent ? 'yes' : 'no'}.`);
console.log(`Golden snapshots current: ${report.gates.goldenSnapshotsCurrent ? 'yes' : 'no'}.`);
console.log(
  `Forbidden generated artifacts: ${report.hygiene.forbiddenGeneratedArtifacts.length}; premature scope artifacts: ${report.hygiene.prematureScopeArtifacts.length}.`
);
console.log(`Evidence written: ${outputPath}`);

if (!report.gates.overallPassed) {
  console.error(JSON.stringify(report.issues, null, 2));
  process.exitCode = 1;
}
