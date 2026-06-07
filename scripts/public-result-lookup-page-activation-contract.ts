import { runPublicResultLookupPageActivationContract, writePublicResultLookupPageActivationContractEvidence } from '../src/core/release/publicResultLookupPageActivationContract';

const evidencePath = 'docs/evidence/public-result-lookup-page-activation-contract-latest.json';
const report = await runPublicResultLookupPageActivationContract();
writePublicResultLookupPageActivationContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public result lookup page activation contract failed.');
  console.error(`Issues: ${report.issues.join(', ')}`);
  process.exit(1);
}

console.log('Public result lookup page activation contract passed.');
console.log(`Dry-run: ${report.gates.dryRunContractPassed ? 'passed' : 'failed'}.`);
console.log(`Activation status: ${report.activation.status}.`);
console.log(`Activation ready: ${report.activation.activationDecisionReady ? 'yes' : 'no'}.`);
console.log(`Public lookup page binding applied: ${report.activation.actualPublicLookupPageBindingApplied ? 'yes' : 'no'}.`);
console.log(`Real page database read executed: ${report.activation.realPublicResultPageDatabaseReadExecuted ? 'yes' : 'no'}.`);
console.log(`Network lookup executed: ${report.activation.networkLookupExecuted ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
