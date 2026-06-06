import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase4ClosureGate } from '../src/core/release/phase4ClosureGate';

const report = runPhase4ClosureGate();
const outputPath = path.resolve('docs/evidence/phase4-closure-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Phase 4 closure gate failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Phase 4 closure gate passed.');
  console.log(`Export readiness: ${report.gates.localExportReadinessPassed ? 'passed' : 'failed'}.`);
  console.log(`Export visual QA: ${report.gates.exportVisualQaPassed ? 'passed' : 'failed'}.`);
  console.log(`Export smoke contract: ${report.gates.exportSmokeContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Phase 5 transition document: ${report.gates.phase5TransitionDocExists ? 'present' : 'missing'}.`);
  console.log(`Evidence written: ${outputPath}`);
}
