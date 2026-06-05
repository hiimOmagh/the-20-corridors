import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runLocalExportReadiness } from '../src/core/release/localExportReadiness';

const report = runLocalExportReadiness();
const outputPath = path.resolve('docs/evidence/local-export-readiness-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Local export readiness gate failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log('Local export readiness gate passed.');
  console.log(`Phase 3 closure: ${report.gates.phase3ClosurePassed ? 'passed' : 'failed'}.`);
  console.log(`Raw-answer leakage in share card: ${report.privacy.rawAnswerLeakageSignals.length}.`);
  console.log(`Actual image export implementation signals: ${report.privacy.actualImageExportSignals.length}.`);
  console.log(`Evidence written: ${outputPath}`);
}
