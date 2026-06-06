import { runBackendRouteHandlersContract, writeBackendRouteHandlersContractEvidence } from '../src/core/release/backendRouteHandlersContract';

const report = await runBackendRouteHandlersContract();
writeBackendRouteHandlersContractEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Backend route handlers contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Backend route handlers contract passed.');
  console.log(`Backend handler dry-run contract: ${report.gates.backendHandlerDryRunContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Approved route files: ${report.gates.approvedRouteFilesExist ? 'present' : 'missing'}.`);
  console.log(`Route dry-run flow: ${report.gates.routeHelpersRunCreateReadDeleteFlow ? 'passed' : 'failed'}.`);
  console.log(`DTO-only route responses: ${report.gates.dtoOnlyResponsesPreserved ? 'passed' : 'failed'}.`);
  console.log('Evidence written: docs/evidence/backend-route-handlers-latest.json');
}
