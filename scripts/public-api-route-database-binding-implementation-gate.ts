import { runPublicApiRouteDatabaseBindingImplementationGate, writePublicApiRouteDatabaseBindingImplementationGateEvidence } from '../src/core/release/publicApiRouteDatabaseBindingImplementationGate';

const evidencePath = 'docs/evidence/public-api-route-database-binding-implementation-gate-latest.json';
const report = await runPublicApiRouteDatabaseBindingImplementationGate();
writePublicApiRouteDatabaseBindingImplementationGateEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public API route database binding implementation gate failed.');
  console.error(JSON.stringify({ issues: report.issues, gates: report.gates }, null, 2));
  process.exit(1);
}

console.log('Public API route database binding implementation gate passed.');
console.log(`Route binding activation: ${report.gates.routeBindingActivationContractPassed ? 'passed' : 'failed'}.`);
console.log(`Default status: ${report.implementation.defaultStatus}.`);
console.log(`Rollback status: ${report.implementation.rollbackStatus}.`);
console.log(`Database status: ${report.implementation.databaseStatus}.`);
console.log(`Route flow simulation: ${report.gates.routeFlowDatabaseBindingSimulationPassed ? 'passed' : 'failed'}.`);
console.log(`Actual API route binding decision applied: ${report.implementation.routeBindingAppliedInDecision ? 'yes' : 'no'}.`);
console.log(`Public /r/[publicId] lookup activation allowed: no.`);
console.log(`Evidence written: ${evidencePath}`);
