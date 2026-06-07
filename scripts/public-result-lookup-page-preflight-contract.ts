import {
  runPublicResultLookupPagePreflightContract,
  writePublicResultLookupPagePreflightContractEvidence
} from '../src/core/release/publicResultLookupPagePreflightContract';

const evidencePath = 'docs/evidence/public-result-lookup-page-preflight-contract-latest.json';
const report = await runPublicResultLookupPagePreflightContract();
writePublicResultLookupPagePreflightContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public result lookup page preflight contract failed.');
  console.error(JSON.stringify({ issues: report.issues, gates: report.gates }, null, 2));
  process.exit(1);
}

console.log('Public result lookup page preflight contract passed.');
console.log(`API route database binding gate: ${report.gates.apiRouteDatabaseBindingGatePassed ? 'passed' : 'failed'}.`);
console.log(`Rollback/failure evidence: ${report.gates.rollbackFailureEvidencePackPassed ? 'passed' : 'failed'}.`);
console.log(`Preflight status: ${report.preflight.status}.`);
console.log(`API route binding without public lookup: ${report.preflight.apiRouteBindingCanBeActiveWithoutPublicLookup ? 'yes' : 'no'}.`);
console.log(`Public lookup page binding applied: ${report.preflight.actualPublicLookupPageBindingApplied ? 'yes' : 'no'}.`);
console.log(`Network lookup executed: ${report.preflight.networkQueryExecuted ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
