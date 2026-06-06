import path from 'node:path';
import {
  runDatabaseClientQueryReadinessGuard,
  writeDatabaseClientQueryReadinessGuardEvidence
} from '../src/core/release/databaseClientQueryReadinessGuard';

const evidencePath = path.join(process.cwd(), 'docs/evidence/database-client-query-readiness-guard-latest.json');
const report = await runDatabaseClientQueryReadinessGuard();
writeDatabaseClientQueryReadinessGuardEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database client query readiness guard failed.');
  console.error(JSON.stringify(report.issues, null, 2));
  process.exit(1);
}

console.log('Database client query readiness guard passed.');
console.log(`Database client smoke: ${report.gates.databaseClientSmokePassed ? 'passed' : 'failed'}.`);
console.log(`Query descriptors: ${report.coverage.queryDescriptorCount}.`);
console.log(`Mapped intents: ${report.coverage.mappedIntentCount}.`);
console.log(`Placeholder mismatches: ${report.coverage.placeholderMismatchCount}.`);
console.log(`SQL execution allowed: ${report.readiness.sqlExecutionAllowed ? 'yes' : 'no'}.`);
console.log(`Route binding allowed: ${report.readiness.routeBindingAllowed ? 'yes' : 'no'}.`);
console.log('Evidence written: docs/evidence/database-client-query-readiness-guard-latest.json');
