import { runBackendRouteRuntimeSmokeContract, writeBackendRouteRuntimeSmokeContractEvidence } from '../src/core/release/backendRouteRuntimeSmokeContract';
const report = await runBackendRouteRuntimeSmokeContract();
writeBackendRouteRuntimeSmokeContractEvidence(report);
if (!report.gates.overallPassed) {
  console.error('Backend route runtime smoke contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Backend route runtime smoke contract passed.');
  console.log(`Backend route handlers contract: ${report.gates.backendRouteHandlersContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Runtime create/read/delete flow: ${report.gates.createReadDeleteRuntimeFlowPassed ? 'passed' : 'failed'}.`);
  console.log(`Status mapping: ${report.gates.statusMappingPreserved ? 'passed' : 'failed'}.`);
  console.log(`DTO-only runtime responses: ${report.gates.dtoOnlyRuntimeResponsesPreserved ? 'passed' : 'failed'}.`);
  console.log('Evidence written: docs/evidence/backend-route-runtime-smoke-latest.json');
}
