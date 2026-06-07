import {
  runPublicResultLookupPageImplementationGate,
  writePublicResultLookupPageImplementationGateEvidence
} from '../src/core/release/publicResultLookupPageImplementationGate';

const evidencePath = 'docs/evidence/public-result-lookup-page-implementation-gate-latest.json';
const report = await runPublicResultLookupPageImplementationGate();
writePublicResultLookupPageImplementationGateEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public result lookup page implementation gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Public result lookup page implementation gate passed.');
console.log(`Activation: ${report.implementation.activeStatus} (${report.implementation.activeHttpStatus}).`);
console.log(`Read miss: ${report.implementation.readMissStatus} (${report.implementation.readMissHttpStatus}).`);
console.log(`Deleted: ${report.implementation.deletedStatus} (${report.implementation.deletedHttpStatus}).`);
console.log(`Expired: ${report.implementation.expiredStatus} (${report.implementation.expiredHttpStatus}).`);
console.log(`Default status: ${report.implementation.defaultStatus}.`);
console.log(`Rollback status: ${report.implementation.rollbackStatus}.`);
console.log(`Network lookup smoke executed: ${report.implementation.networkLookupSmokeExecuted ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
