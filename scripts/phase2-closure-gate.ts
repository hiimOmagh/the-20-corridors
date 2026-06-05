import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase2ClosureGate } from '../src/core/release/phase2ClosureGate';

const report = runPhase2ClosureGate();
const evidencePath = path.join(process.cwd(), 'docs/evidence/phase2-closure-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('Phase 2 closure gate failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 2 closure gate passed.');
console.log(`Readiness gate: ${report.gates.phase2ReadinessPassed ? 'passed' : 'failed'}.`);
console.log(`UI smoke contract: ${report.gates.uiSmokeContractPassed ? 'passed' : 'failed'}.`);
console.log(`Local-only scope preserved: ${report.gates.localOnlyScopePreserved ? 'yes' : 'no'}.`);
console.log(`Phase 3 transition document: ${report.gates.phase3TransitionDocExists ? 'present' : 'missing'}.`);
console.log(`Evidence written: ${evidencePath}`);
