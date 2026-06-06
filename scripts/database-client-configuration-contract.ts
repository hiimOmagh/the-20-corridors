import path from 'node:path';
import {
  runDatabaseClientConfigurationContract,
  writeDatabaseClientConfigurationContractEvidence
} from '../src/core/release/databaseClientConfigurationContract';

const report = await runDatabaseClientConfigurationContract();
const evidencePath = path.join(process.cwd(), 'docs/evidence/database-client-configuration-contract-latest.json');
writeDatabaseClientConfigurationContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database client configuration contract failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Database client configuration contract passed.');
console.log(`Database adapter contract: ${report.gates.databaseAdapterContractPassed ? 'passed' : 'failed'}.`);
console.log(`Runtime selection guard: ${report.gates.runtimeSelectionGuardPassed ? 'passed' : 'failed'}.`);
console.log(`Adapter factory contract: ${report.gates.adapterFactoryContractPassed ? 'passed' : 'failed'}.`);
console.log(`Complete database config: ${report.config.completeConfigStatus}.`);
console.log(`Database client creation allowed: ${report.config.databaseClientCreationAllowed ? 'yes' : 'no'}.`);
console.log(`Route binding allowed: ${report.config.routeBindingAllowed ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${path.relative(process.cwd(), evidencePath)}`);
