import path from 'node:path';
import {
  runDatabaseClientSmokeBoundary,
  writeDatabaseClientSmokeBoundaryEvidence
} from '../src/core/release/databaseClientSmokeBoundary';

const evidencePath = path.join(process.cwd(), 'docs/evidence/database-client-smoke-boundary-latest.json');
const report = await runDatabaseClientSmokeBoundary();
writeDatabaseClientSmokeBoundaryEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database client smoke boundary failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Database client smoke boundary passed.');
console.log(`Database query contract: ${report.gates.databaseQueryContractPassed ? 'passed' : 'failed'}.`);
console.log(`Selected SDK: ${report.smoke.selectedSdkName}.`);
console.log(`SDK installed and locked: ${report.gates.selectedSdkInstalledAndLocked ? 'yes' : 'no'}.`);
console.log(`SDK imported only in smoke boundary: ${report.gates.selectedSdkImportedOnlyInSmokeBoundary ? 'yes' : 'no'}.`);
console.log(`Complete env smoke status: ${report.smoke.completeEnvStatus}.`);
console.log(`Network query executed: ${report.smoke.completeEnvNetworkQueryExecuted ? 'yes' : 'no'}.`);
console.log(`Route binding allowed: ${report.smoke.completeEnvRouteBindingAllowed ? 'yes' : 'no'}.`);
console.log('Evidence written: docs/evidence/database-client-smoke-boundary-latest.json');
