import { runUiImportBoundary } from '../src/core/release/uiImportBoundary';

const report = runUiImportBoundary();

if (!report.gates.overallPassed) {
  console.error('UI import boundary failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('UI import boundary passed.');
console.log(`Scanned files: ${report.summary.scannedFileCount}; violations: ${report.summary.violationCount}.`);
