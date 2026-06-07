import path from 'node:path';
import {
  runPublicRouteDatabaseBindingActivationContract,
  writePublicRouteDatabaseBindingActivationContractEvidence
} from '../src/core/release/publicRouteDatabaseBindingActivationContract';

const evidencePath = path.join(process.cwd(), 'docs/evidence/public-route-database-binding-activation-contract-latest.json');
const report = await runPublicRouteDatabaseBindingActivationContract();
writePublicRouteDatabaseBindingActivationContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public route database binding activation contract failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Public route database binding activation contract passed.');
console.log(`Dry-run: ${report.gates.routeBindingDryRunContractPassed ? 'passed' : 'failed'}.`);
console.log(`Activation status: ${report.activation.status}.`);
console.log(`API route activation ready: ${report.activation.apiRouteDatabaseBindingActivationReady ? 'yes' : 'no'}.`);
console.log(`Actual route binding applied: ${report.activation.actualRouteBindingApplied ? 'yes' : 'no'}.`);
console.log(`Public /r/[publicId] lookup activation allowed: ${report.activation.publicResultPageLookupActivationAllowed ? 'yes' : 'no'}.`);
console.log(`Network query executed: ${report.activation.networkQueryExecuted ? 'yes' : 'no'}.`);
console.log('Evidence written: docs/evidence/public-route-database-binding-activation-contract-latest.json');
