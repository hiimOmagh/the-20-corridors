import { runPhase6ClosureGate, writePhase6ClosureEvidence } from '../src/core/release/phase6ClosureGate';

const report = await runPhase6ClosureGate();
await writePhase6ClosureEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Phase 6 closure gate failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Phase 6 closure gate passed.');
  console.log(`Public storage contract: ${report.gates.publicStorageContractPassed ? 'passed' : 'failed'}.`);
  console.log(`In-memory adapter: ${report.gates.inMemoryAdapterContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Local persistent-link flow: ${report.gates.localPersistentFlowContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Lifecycle UI contract: ${report.gates.lifecycleUiContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Persistent public lookup route: ${report.gates.noPersistentPublicLookupRoute ? 'blocked' : 'present'}.`);
  console.log(`Phase 7 transition document: ${report.gates.phase7TransitionDocExists ? 'present' : 'missing'}.`);
  console.log('Evidence written: docs/evidence/phase6-closure-latest.json');
}
