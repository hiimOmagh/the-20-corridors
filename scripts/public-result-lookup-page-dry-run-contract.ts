import {
  runPublicResultLookupPageDryRunContract,
  writePublicResultLookupPageDryRunContractEvidence
} from '../src/core/release/publicResultLookupPageDryRunContract';

const evidencePath = 'docs/evidence/public-result-lookup-page-dry-run-contract-latest.json';
const report = await runPublicResultLookupPageDryRunContract();
writePublicResultLookupPageDryRunContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public result lookup page dry-run contract failed.');
  console.error(JSON.stringify({ issues: report.issues, gates: report.gates }, null, 2));
  process.exit(1);
}

console.log('Public result lookup page dry-run contract passed.');
console.log(`Preflight: ${report.gates.preflightContractPassed ? 'passed' : 'failed'}.`);
console.log(`Dry-run status: ${report.dryRun.status}.`);
console.log(`Active lookup: ${report.dryRun.activeLookupStatus} (${report.dryRun.activeLookupHttpStatus}).`);
console.log(`Read miss: ${report.dryRun.readMissStatus} (${report.dryRun.readMissHttpStatus}).`);
console.log(`Deleted lookup: ${report.dryRun.deletedLookupStatus} (${report.dryRun.deletedLookupHttpStatus}).`);
console.log(`Expired lookup: ${report.dryRun.expiredLookupStatus} (${report.dryRun.expiredLookupHttpStatus}).`);
console.log(`Public lookup page binding applied: ${report.dryRun.actualPublicLookupPageBindingApplied ? 'yes' : 'no'}.`);
console.log(`Network lookup executed: ${report.dryRun.networkQueryExecuted ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
