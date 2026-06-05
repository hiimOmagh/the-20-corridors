import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runEngineReleaseGate } from '../src/core/release/releaseGate';

const report = runEngineReleaseGate();
const evidencePath = path.join(process.cwd(), 'docs/evidence/engine-release-gate-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('Engine release gate failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Engine release gate passed.');
console.log(`Methodology audit: ${report.gates.methodologyAuditPassed ? 'passed' : 'failed'}.`);
console.log(`Methodology evidence current: ${report.gates.methodologyEvidenceCurrent ? 'yes' : 'no'}.`);
console.log(`Golden snapshots current: ${report.gates.goldenSnapshotsCurrent ? 'yes' : 'no'}.`);
console.log(
  `Forbidden generated artifacts: ${report.hygiene.forbiddenGeneratedArtifacts.length}; ` +
    `blocked backend/database/AI scope artifacts: ${report.hygiene.blockedScopeArtifacts.length}; ` +
    `approved UI scope artifacts: ${report.hygiene.approvedUiScopeArtifacts.length}.`
);
console.log(`Evidence written: ${evidencePath}`);
