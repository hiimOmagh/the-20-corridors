import { runDatabaseAdapterContract, writeDatabaseAdapterContractEvidence } from '../src/core/release/databaseAdapterContract';

const report = await runDatabaseAdapterContract();
writeDatabaseAdapterContractEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Database adapter contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Database adapter contract passed.');
  console.log(`Phase 7 closure: ${report.gates.phase7ClosurePassed ? 'passed' : 'failed'}.`);
  console.log(`Adapter contract interface: ${report.gates.adapterContractExtendsPublicResultStorageAdapter ? 'defined' : 'missing'}.`);
  console.log(`Database record shape: ${report.gates.databaseRecordShapeDefined ? 'defined' : 'missing'}.`);
  console.log(`Raw delete token storage: ${report.gates.rawDeleteTokenNeverStored ? 'blocked' : 'not blocked'}.`);
  console.log(`Route handler mode: ${report.metadata.routeHandlerMode}.`);
  console.log('Evidence written: docs/evidence/database-adapter-contract-latest.json');
}
