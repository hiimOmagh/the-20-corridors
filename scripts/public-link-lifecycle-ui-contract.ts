import { runPublicLinkLifecycleUiContract, writePublicLinkLifecycleUiEvidence } from '../src/core/release/publicLinkLifecycleUiContract';

const report = await runPublicLinkLifecycleUiContract();
await writePublicLinkLifecycleUiEvidence(report);

if (!report.gates.overallPassed) {
  console.error('Public-link lifecycle UI contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Public-link lifecycle UI contract passed.');
  console.log(`Local flow contract: ${report.gates.localFlowContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Lifecycle UI controls: ${report.gates.lifecycleControlsRendered ? 'present' : 'missing'}.`);
  console.log(`Local-only route boundary: ${report.gates.usesLocalPreviewRouteOnly ? 'passed' : 'failed'}.`);
  console.log('Evidence written: docs/evidence/public-link-lifecycle-ui-latest.json');
}
