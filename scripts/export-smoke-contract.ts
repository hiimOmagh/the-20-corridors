import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runExportSmokeContract } from '../src/core/release/exportSmokeContract';

const report = runExportSmokeContract();
const outputPath = path.resolve('docs/evidence/export-smoke-contract-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Export smoke contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Export smoke contract passed.');
  console.log(`Readiness gate: ${report.gates.localExportReadinessPassed ? 'passed' : 'failed'}.`);
  console.log(`Export visual QA: ${report.gates.exportVisualQaPassed ? 'passed' : 'failed'}.`);
  console.log(`Runtime signals: ${report.coverage.runtimeSignalCount}; UI signals: ${report.coverage.uiSignalCount}.`);
  console.log(`Local-only export boundary: ${report.gates.noBackendAiAuthPaymentPersistenceScope ? 'passed' : 'failed'}.`);
  console.log(`Evidence written: ${outputPath}`);
}
