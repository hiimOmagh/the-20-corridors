import {
  runDatabaseQueryContract,
  writeDatabaseQueryContractEvidence
} from '../src/core/release/databaseQueryContract';

const report = await runDatabaseQueryContract();
writeDatabaseQueryContractEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Database query contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Database query contract passed.');
console.log(`Database SDK decision: ${report.gates.databaseSdkDecisionPassed ? 'passed' : 'failed'}.`);
console.log(`Table contract: ${report.queryContract.tableName}.`);
console.log(`Columns defined: ${report.coverage.columnCount}.`);
console.log(`Query intents defined: ${report.coverage.queryIntentCount}.`);
console.log(`SQL execution allowed: ${report.queryContract.queryExecutionAllowed ? 'yes' : 'no'}.`);
console.log(`SDK installed/imported: ${report.coverage.installedDatabasePackageCount + report.coverage.importedDatabaseSdkSignalCount === 0 ? 'no' : 'yes'}.`);
console.log('Evidence written: docs/evidence/database-query-contract-latest.json');
