import path from 'node:path';
import {
  runPublicRouteDatabaseBindingDryRunContract,
  writePublicRouteDatabaseBindingDryRunContractEvidence
} from '../src/core/release/publicRouteDatabaseBindingDryRunContract';

const evidencePath = path.join(process.cwd(), 'docs/evidence/public-route-database-binding-dry-run-contract-latest.json');
const report = await runPublicRouteDatabaseBindingDryRunContract();
writePublicRouteDatabaseBindingDryRunContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Public route database binding dry-run contract failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Public route database binding dry-run contract passed.');
console.log(`Preflight: ${report.gates.preflightContractPassed ? 'passed' : 'failed'}.`);
console.log(`Dry-run status: ${report.dryRun.status}.`);
console.log(`Fake route-bound adapter created: ${report.gates.fakeRouteBoundDatabaseAdapterCreated ? 'yes' : 'no'}.`);
console.log(`Route flow simulation: ${report.gates.routeHandlerCreateReadDeletePruneSimulationPassed ? 'passed' : 'failed'}.`);
console.log(`Route binding allowed: ${report.dryRun.routeBindingAllowed ? 'yes' : 'no'}.`);
console.log(`Network query executed: ${report.dryRun.networkQueryExecuted ? 'yes' : 'no'}.`);
console.log('Evidence written: docs/evidence/public-route-database-binding-dry-run-contract-latest.json');
