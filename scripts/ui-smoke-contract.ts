import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runUiSmokeContract } from '../src/core/release/uiSmokeContract';

const report = runUiSmokeContract();
const evidencePath = path.join(process.cwd(), 'docs/evidence/ui-smoke-contract-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('UI smoke contract failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('UI smoke contract passed.');
console.log(`Landing route: ${report.gates.landingRouteSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Quiz route: ${report.gates.quizRouteSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Results route: ${report.gates.resultsRouteSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Local-only boundary: ${report.gates.localOnlyBoundaryPassed ? 'passed' : 'failed'}.`);
console.log(`Evidence written: ${evidencePath}`);
