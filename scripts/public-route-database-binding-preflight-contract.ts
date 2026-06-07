import path from 'node:path';
import {
  runPublicRouteDatabaseBindingPreflightContract,
  writePublicRouteDatabaseBindingPreflightContractEvidence
} from '../src/core/release/publicRouteDatabaseBindingPreflightContract';

const evidencePath = path.join(process.cwd(), 'docs/evidence/public-route-database-binding-preflight-contract-latest.json');
const report = await runPublicRouteDatabaseBindingPreflightContract();
writePublicRouteDatabaseBindingPreflightContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public route database binding preflight contract failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Public route database binding preflight contract passed.');
console.log(`Factory activation: ${report.gates.factoryActivationContractPassed ? 'passed' : 'failed'}.`);
console.log(`Preflight status: ${report.preflight.status}.`);
console.log(`Database mode alone status: ${report.preflight.databaseModeAloneStatus}.`);
console.log(`Missing flag status: ${report.preflight.missingFlagStatus}.`);
console.log(`Route-handler context status: ${report.preflight.routeHandlerContextStatus}.`);
console.log(`Route binding allowed: ${report.preflight.routeBindingAllowed ? 'yes' : 'no'}.`);
console.log('Evidence written: docs/evidence/public-route-database-binding-preflight-contract-latest.json');
