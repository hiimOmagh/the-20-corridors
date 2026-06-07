import {
  runPublicLookupOperationalRollbackDrillGate,
  writePublicLookupOperationalRollbackDrillEvidence
} from '../src/core/release/publicLookupOperationalRollbackDrill';

const evidencePath = 'docs/evidence/public-lookup-operational-rollback-drill-latest.json';
const report = await runPublicLookupOperationalRollbackDrillGate();
writePublicLookupOperationalRollbackDrillEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public lookup operational rollback drill failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Public lookup operational rollback drill passed.');
console.log(`Operational smoke evidence: ${report.gates.operationalSmokeEvidencePassed ? 'passed' : 'failed'}.`);
console.log(`API route before rollback: ${report.drill.apiRouteBeforeRollbackStatus}.`);
console.log(`Public lookup before rollback: ${report.drill.publicLookupBeforeRollbackStatus} (${report.drill.publicLookupBeforeRollbackHttpStatus}).`);
console.log(`API route after rollback: ${report.drill.apiRouteAfterRollbackStatus}.`);
console.log(`Public lookup after rollback: ${report.drill.publicLookupAfterRollbackStatus} (${report.drill.publicLookupAfterRollbackHttpStatus}).`);
console.log(`Rollback disables public lookup rendering: ${report.gates.rollbackDisablesPublicLookupRendering ? 'yes' : 'no'}.`);
console.log(`Rollback exposes stale DTO: ${report.gates.rollbackDoesNotExposeStaleDatabaseDto ? 'no' : 'yes'}.`);
console.log(`Network lookup smoke executed: ${report.drill.networkLookupSmokeExecuted ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
