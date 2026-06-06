import path from 'node:path';
import {
  runDatabaseAdapterImplementationDisabledFactoryGate,
  writeDatabaseAdapterImplementationDisabledFactoryGateEvidence
} from '../src/core/release/databaseAdapterImplementationDisabledFactoryGate';

const evidencePath = path.join(process.cwd(), 'docs/evidence/database-adapter-implementation-disabled-factory-gate-latest.json');
const report = await runDatabaseAdapterImplementationDisabledFactoryGate();
writeDatabaseAdapterImplementationDisabledFactoryGateEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database adapter implementation disabled factory gate failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Database adapter implementation disabled factory gate passed.');
console.log(`Database client query readiness: ${report.gates.databaseClientQueryReadinessPassed ? 'passed' : 'failed'}.`);
console.log(`Adapter implementation phase: ${report.adapter.phase}.`);
console.log(`Observed query intents: ${report.coverage.observedQueryIntentCount}.`);
console.log(`Factory database adapter binding allowed: ${report.gates.factoryStillRefusesDatabaseAdapterBinding ? 'no' : 'yes'}.`);
console.log(`Route binding signals: ${report.coverage.routeBindingSignalCount}.`);
console.log('Evidence written: docs/evidence/database-adapter-implementation-disabled-factory-gate-latest.json');
