import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase3ClosureGate } from '../src/core/release/phase3ClosureGate';

const report = runPhase3ClosureGate();
const evidencePath = path.join(process.cwd(), 'docs/evidence/phase3-closure-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('Phase 3 closure gate failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 3 closure gate passed.');
console.log(`Phase 2 closure: ${report.gates.phase2ClosurePassed ? 'passed' : 'failed'}.`);
console.log(`Visual smoke contract: ${report.gates.visualSmokeContractPassed ? 'passed' : 'failed'}.`);
console.log(`Local-only visual scope preserved: ${report.gates.localOnlyVisualScopePreserved ? 'yes' : 'no'}.`);
console.log(`Phase 4 transition document: ${report.gates.phase4TransitionDocExists ? 'present' : 'missing'}.`);
console.log(`Evidence written: ${evidencePath}`);
