import {
  assertDatabaseRouteRollbackFailureEvidencePackPassed,
  runDatabaseRouteRollbackFailureEvidencePack,
  writeDatabaseRouteRollbackFailureEvidencePack
} from '../src/core/release/databaseRouteRollbackFailureEvidencePack';

const report = await runDatabaseRouteRollbackFailureEvidencePack();
assertDatabaseRouteRollbackFailureEvidencePackPassed(report);
const evidencePath = writeDatabaseRouteRollbackFailureEvidencePack(report);

console.log('Database route rollback + failure-mode evidence pack passed.');
console.log(`API route database binding gate: ${report.gates.apiRouteDatabaseBindingGatePassed ? 'passed' : 'failed'}.`);
console.log(`Rollback status: ${report.evidence.rollbackStatus}.`);
console.log(`Missing env create status: ${report.evidence.missingEnvCreateStatus}.`);
console.log(`Invalid env create status: ${report.evidence.invalidEnvCreateStatus}.`);
console.log(`Partial activation create status: ${report.evidence.partialActivationCreateStatus}.`);
console.log(`Database unavailable create status: ${report.evidence.databaseUnavailableCreateStatus}.`);
console.log(`Write failure create status: ${report.evidence.writeFailureCreateStatus}.`);
console.log(`Read miss status: ${report.evidence.readMissStatus}.`);
console.log(`Delete-token mismatch status: ${report.evidence.deleteTokenMismatchStatus}.`);
console.log(`Delete failure status: ${report.evidence.deleteFailureStatus}.`);
console.log(`Public /r/[publicId] lookup activation allowed: ${report.evidence.publicLookupActivationAllowed ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
