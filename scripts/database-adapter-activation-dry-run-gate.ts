import path from 'node:path';
import {
  runDatabaseAdapterActivationDryRunGate,
  writeDatabaseAdapterActivationDryRunGateEvidence
} from '../src/core/release/databaseAdapterActivationDryRunGate';

const evidencePath = path.join(process.cwd(), 'docs/evidence/database-adapter-activation-dry-run-gate-latest.json');
const report = await runDatabaseAdapterActivationDryRunGate();
writeDatabaseAdapterActivationDryRunGateEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database adapter activation dry-run gate failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Database adapter activation dry-run gate passed.');
console.log(`Adapter implementation: ${report.gates.adapterImplementationGatePassed ? 'passed' : 'failed'}.`);
console.log(`Activation status: ${report.activation.status}.`);
console.log(`Dry-run adapter created: ${report.activation.dryRunAdapterCreated ? 'yes' : 'no'}.`);
console.log(`Factory route binding allowed: ${report.activation.factoryRouteBindingAllowed ? 'yes' : 'no'}.`);
console.log(`Route binding signals: ${report.coverage.routeBindingSignalCount}.`);
console.log(`Production mutation smoke: ${report.activation.productionMutationSmokeAllowed ? 'allowed' : 'blocked'}.`);
console.log(`Network query executed: ${report.activation.networkQueryExecuted ? 'yes' : 'no'}.`);
console.log('Evidence written: docs/evidence/database-adapter-activation-dry-run-gate-latest.json');
