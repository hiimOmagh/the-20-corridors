import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase2Readiness } from '../src/core/release/phase2Readiness';

const report = runPhase2Readiness();
const evidencePath = path.join(process.cwd(), 'docs/evidence/phase2-readiness-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('Phase 2 readiness gate failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Phase 2 readiness gate passed.');
console.log(`Engine release gate: ${report.gates.engineReleaseGatePassed ? 'passed' : 'failed'}.`);
console.log(`UI import boundary: ${report.gates.uiImportBoundaryPassed ? 'passed' : 'failed'}.`);
console.log(`Route skeletons ready: ${report.gates.routeSkeletonsUsePublicApiOnly ? 'yes' : 'no'}.`);
console.log(`Backend/AI/auth/payment scope blocked: ${report.gates.stillNoBackendAiAuthPaymentScope ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
