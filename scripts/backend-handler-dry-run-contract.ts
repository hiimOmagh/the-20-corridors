import { runBackendHandlerDryRunContract, writeBackendHandlerDryRunContractEvidence } from '../src/core/release/backendHandlerDryRunContract';

const report = await runBackendHandlerDryRunContract();
writeBackendHandlerDryRunContractEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Backend handler dry-run contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Backend handler dry-run contract passed.');
  console.log(`Backend route skeleton guard: ${report.gates.backendRouteSkeletonGuardPassed ? 'passed' : 'failed'}.`);
  console.log(`Create/read/delete dry-run flow: ${report.gates.createReadDeleteDryRunFlowPassed ? 'passed' : 'failed'}.`);
  console.log(`DTO-only responses: ${report.gates.dtoOnlyResponsesPreserved ? 'passed' : 'failed'}.`);
  console.log(`Actual route files: ${report.implementationScan.actualRouteFiles.length}.`);
  console.log('Evidence written: docs/evidence/backend-handler-dry-run-latest.json');
}
