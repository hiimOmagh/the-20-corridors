import { runBackendRouteSkeletonGuard, writeBackendRouteSkeletonGuardEvidence } from '../src/core/release/backendRouteSkeletonGuard';

const report = await runBackendRouteSkeletonGuard();
writeBackendRouteSkeletonGuardEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Backend route skeleton guard failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Backend route skeleton guard passed.');
  console.log(`Backend API boundary: ${report.gates.backendApiBoundaryPassed ? 'passed' : 'failed'}.`);
  console.log(`Planned route files: ${report.coverage.plannedRouteFileCount}.`);
  console.log(`Planned methods: ${report.routeSkeleton.plannedMethods.join(', ')}.`);
  console.log(`Actual route files: ${report.coverage.actualRouteFileCount}.`);
  console.log(`Request handlers: ${report.implementationScan.requestHandlerSignals.length}.`);
  console.log('Evidence written: docs/evidence/backend-route-skeleton-latest.json');
}
