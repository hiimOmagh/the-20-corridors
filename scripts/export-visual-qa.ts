import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runExportVisualQa } from '../src/core/release/exportVisualQa';

const report = runExportVisualQa();
const outputPath = path.resolve('docs/evidence/export-visual-qa-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Export visual QA contract failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log('Export visual QA contract passed.');
  console.log(`SVG dimensions: ${report.visual.width} × ${report.visual.height}.`);
  console.log(`Download filename: ${report.download.actualFileName}.`);
  console.log(`Local-only signals: ${report.privacy.localOnlySignals.length}; blocked scope signals: ${report.privacy.blockedScopeSignals.length}.`);
  console.log(`Evidence written: ${outputPath}`);
}
