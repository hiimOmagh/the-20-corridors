import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase5PreviewClosureGate } from '../src/core/release/phase5PreviewClosureGate';

const report = runPhase5PreviewClosureGate();
const outputPath = path.resolve('docs/evidence/phase5-preview-closure-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Phase 5 preview closure gate failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Phase 5 preview closure gate passed.');
  console.log(`Phase 4 closure: ${report.gates.phase4ClosurePassed ? 'passed' : 'failed'}.`);
  console.log(`Public-link privacy: ${report.gates.publicLinkPrivacyPassed ? 'passed' : 'failed'}.`);
  console.log(`Public DTO contract: ${report.gates.publicResultDtoContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Public-link preview: ${report.gates.publicLinkPreviewContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Local DTO-only scope preserved: ${report.gates.dtoOnlyPreviewScopePreserved ? 'yes' : 'no'}.`);
  console.log(`Phase 6 transition document: ${report.gates.phase6TransitionDocExists ? 'present' : 'missing'}.`);
  console.log(`Evidence written: ${outputPath}`);
}
