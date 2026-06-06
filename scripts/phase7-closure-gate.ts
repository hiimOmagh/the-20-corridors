import { runPhase7ClosureGate, writePhase7ClosureEvidence } from '../src/core/release/phase7ClosureGate';

const report = await runPhase7ClosureGate();
writePhase7ClosureEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Phase 7 closure gate failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Phase 7 closure gate passed.');
  console.log(`Backend API boundary: ${report.gates.backendApiBoundaryPassed ? 'passed' : 'failed'}.`);
  console.log(`Backend route skeleton guard: ${report.gates.backendRouteSkeletonPassed ? 'passed' : 'failed'}.`);
  console.log(`Backend dry-run handlers: ${report.gates.backendHandlerDryRunPassed ? 'passed' : 'failed'}.`);
  console.log(`Backend route handlers: ${report.gates.backendRouteHandlersPassed ? 'passed' : 'failed'}.`);
  console.log(`Backend runtime smoke: ${report.gates.backendRouteRuntimeSmokePassed ? 'passed' : 'failed'}.`);
  console.log(`Phase 8 transition document: ${report.gates.phase8TransitionDocExists ? 'present' : 'missing'}.`);
  console.log('Evidence written: docs/evidence/phase7-closure-latest.json');
}
