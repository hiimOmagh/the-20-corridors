import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPublicLinkPreviewContract } from '../src/core/release/publicLinkPreviewContract';

const report = runPublicLinkPreviewContract();
const evidencePath = path.join(process.cwd(), 'docs/evidence/public-link-preview-latest.json');
writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.gates.overallPassed) {
  console.error('Public-link preview contract failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Public-link preview contract passed.');
console.log(`Route exists: ${report.gates.previewRouteExists ? 'yes' : 'no'}.`);
console.log(`Client exists: ${report.gates.previewClientExists ? 'yes' : 'no'}.`);
console.log(`Local DTO preview: ${report.gates.localDtoPreviewPassed ? 'passed' : 'failed'}.`);
console.log(`Raw-answer exclusion: ${report.gates.rawAnswerPreviewLeakageAbsent ? 'passed' : 'failed'}.`);
console.log(`Evidence written: ${evidencePath}`);
