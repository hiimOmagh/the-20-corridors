import {
  runDatabaseAdapterRuntimeSelectionGuard,
  writeDatabaseAdapterRuntimeSelectionGuardEvidence
} from '../src/core/release/databaseAdapterRuntimeSelectionGuard';

const report = await runDatabaseAdapterRuntimeSelectionGuard();
writeDatabaseAdapterRuntimeSelectionGuardEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Database adapter runtime selection guard failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Database adapter runtime selection guard passed.');
  console.log(`Database adapter contract: ${report.gates.databaseAdapterContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Default storage mode: ${report.runtimeSelection.defaultStatus}.`);
  console.log(`Database mode with missing env: ${report.runtimeSelection.missingDatabaseEnvStatus}.`);
  console.log(`Complete database env mode: ${report.runtimeSelection.completeDatabaseEnvStatus}.`);
  console.log(`Route binding allowed for database mode: ${report.runtimeSelection.completeDatabaseRouteBindingAllowed ? 'yes' : 'no'}.`);
  console.log('Evidence written: docs/evidence/database-adapter-runtime-selection-guard-latest.json');
}
