import path from 'node:path';
import {
  runDatabaseAdapterFactoryContract,
  writeDatabaseAdapterFactoryContractEvidence
} from '../src/core/release/databaseAdapterFactoryContract';

const report = await runDatabaseAdapterFactoryContract();
const evidencePath = path.join(process.cwd(), 'docs/evidence/database-adapter-factory-contract-latest.json');
writeDatabaseAdapterFactoryContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database adapter factory contract failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Database adapter factory contract passed.');
console.log(`Database adapter contract: ${report.gates.databaseAdapterContractPassed ? 'passed' : 'failed'}.`);
console.log(`Runtime selection guard: ${report.gates.runtimeSelectionGuardPassed ? 'passed' : 'failed'}.`);
console.log(`Default factory status: ${report.factory.unsetModeStatus}.`);
console.log(`Database factory status: ${report.factory.completeDatabaseStatus}.`);
console.log(`Database adapter created: ${report.factory.completeDatabaseAdapterCreated ? 'yes' : 'no'}.`);
console.log(`Route binding allowed for database mode: ${report.factory.completeDatabaseRouteBindingAllowed ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${path.relative(process.cwd(), evidencePath)}`);
