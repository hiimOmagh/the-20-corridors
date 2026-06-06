import { runPublicResultApiBoundaryContract, writePublicResultApiBoundaryContractEvidence } from '../src/core/release/publicResultApiBoundaryContract';

const report = await runPublicResultApiBoundaryContract();
writePublicResultApiBoundaryContractEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Backend API boundary contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Backend API boundary contract passed.');
  console.log(`Phase 6 closure: ${report.gates.phase6ClosurePassed ? 'passed' : 'failed'}.`);
  console.log(`Public storage contract: ${report.gates.publicStorageContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Endpoints defined: ${report.apiContract.allowedEndpoints.length}.`);
  console.log(`Delete-token transport rules: ${report.coverage.deleteTokenRuleCount}.`);
  console.log(`Abuse-control expectations: ${report.coverage.abuseExpectationCount}.`);
  console.log(`Blocked implementation artifacts: ${report.implementationScan.blockedPaths.length}; blocked signals: ${report.implementationScan.blockedImplementationSignals.length}.`);
  console.log('Evidence written: docs/evidence/backend-api-boundary-latest.json');
}
