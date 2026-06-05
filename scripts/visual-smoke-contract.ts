import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runVisualSmokeContract } from '../src/core/release/visualSmokeContract';

const report = runVisualSmokeContract();
const evidencePath = path.join(process.cwd(), 'docs/evidence/visual-smoke-contract-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('Phase 3 visual smoke contract failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 3 visual smoke contract passed.');
console.log(`Landing visual smoke: ${report.gates.landingVisualSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Quiz visual smoke: ${report.gates.quizVisualSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Result visual smoke: ${report.gates.resultVisualSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Share-card visual smoke: ${report.gates.shareCardVisualSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Reduced-motion smoke: ${report.gates.reducedMotionSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Local-only visual boundary: ${report.gates.localOnlyVisualBoundaryPassed ? 'passed' : 'failed'}.`);
console.log(`Evidence written: ${evidencePath}`);
