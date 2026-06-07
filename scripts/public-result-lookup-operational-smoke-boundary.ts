import {
  runPublicResultLookupOperationalSmokeBoundaryGate,
  writePublicResultLookupOperationalSmokeBoundaryEvidence
} from '../src/core/release/publicResultLookupOperationalSmokeBoundary';

const evidencePath = 'docs/evidence/public-result-lookup-operational-smoke-boundary-latest.json';
const report = await runPublicResultLookupOperationalSmokeBoundaryGate();
writePublicResultLookupOperationalSmokeBoundaryEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public result lookup operational smoke boundary failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Public result lookup operational smoke boundary passed.');
console.log(`Implementation gate evidence: ${report.gates.implementationGateEvidencePassed ? 'passed' : 'failed'}.`);
console.log(`Default smoke status: ${report.smoke.defaultStatus}.`);
console.log(`Production smoke status: ${report.smoke.productionStatus}.`);
console.log(`Rollback smoke status: ${report.smoke.rollbackStatus}.`);
console.log(`Invalid env smoke status: ${report.smoke.invalidEnvStatus}.`);
console.log(`Opt-in smoke status: ${report.smoke.optInStatus}.`);
console.log(`Active lookup: ${report.smoke.activeLookupStatus} (${report.smoke.activeLookupHttpStatus}).`);
console.log(`Read miss: ${report.smoke.readMissStatus} (${report.smoke.readMissHttpStatus}).`);
console.log(`Deleted: ${report.smoke.deletedStatus} (${report.smoke.deletedHttpStatus}).`);
console.log(`Expired: ${report.smoke.expiredStatus} (${report.smoke.expiredHttpStatus}).`);
console.log(`Network lookup smoke executed: ${report.smoke.networkLookupSmokeExecuted ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
