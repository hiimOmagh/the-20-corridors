import path from 'node:path';
import {
  runDatabaseAdapterFactoryActivationContract,
  writeDatabaseAdapterFactoryActivationContractEvidence
} from '../src/core/release/databaseAdapterFactoryActivationContract';

const evidencePath = path.join(process.cwd(), 'docs/evidence/database-adapter-factory-activation-contract-latest.json');
const report = await runDatabaseAdapterFactoryActivationContract();
writeDatabaseAdapterFactoryActivationContractEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database adapter factory activation contract failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Database adapter factory activation contract passed.');
console.log(`Activation dry-run: ${report.gates.activationDryRunGatePassed ? 'passed' : 'failed'}.`);
console.log(`Explicit non-route adapter created: ${report.activation.databaseAdapterCreated ? 'yes' : 'no'}.`);
console.log(`Database mode alone status: ${report.activation.defaultDatabaseModeStatus}.`);
console.log(`Route-handler context status: ${report.activation.routeHandlerContextStatus}.`);
console.log(`Route binding allowed: ${report.activation.routeBindingAllowed ? 'yes' : 'no'}.`);
console.log(`Observed query intents: ${report.coverage.observedQueryIntentCount}.`);
console.log('Evidence written: docs/evidence/database-adapter-factory-activation-contract-latest.json');
