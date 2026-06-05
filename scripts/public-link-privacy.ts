import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPublicLinkPrivacy } from '../src/core/release/publicLinkPrivacy';

const report = runPublicLinkPrivacy();
const evidencePath = path.resolve(process.cwd(), 'docs/evidence/public-link-privacy-latest.json');

writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Public result link privacy contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Public result link privacy contract passed.');
console.log(`Allowed public fields: ${report.coverage.allowedFieldCount}.`);
console.log(`Forbidden private fields: ${report.coverage.forbiddenFieldCount}.`);
console.log(`Persistence policies: ${report.coverage.persistencePolicyCount}.`);
console.log(`Public-link smoke expectations: ${report.coverage.publicLinkSmokeExpectationCount}.`);
console.log(`Blocked implementation artifacts: ${report.coverage.blockedImplementationPathCount}; blocked signals: ${report.coverage.blockedSignalCount}.`);
console.log(`Evidence written: ${evidencePath}`);
