import {
  runPhase9PublicResultPageBrowserEvidenceGate,
  writePhase9PublicResultPageBrowserEvidenceGateEvidence
} from '../src/core/release/phase9PublicResultPageBrowserEvidenceGate';

const evidencePath = 'docs/evidence/phase9-public-result-page-browser-evidence-gate-latest.json';
const report = runPhase9PublicResultPageBrowserEvidenceGate();
writePhase9PublicResultPageBrowserEvidenceGateEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.4 public result page browser evidence gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.4 public result page browser evidence gate passed.');
console.log(`Renderable visible text verified: ${report.gates.renderableStateVisibleTextVerified ? 'yes' : 'no'}.`);
console.log(`Not-found visible text verified: ${report.gates.notFoundStateVisibleTextVerified ? 'yes' : 'no'}.`);
console.log(`Deleted visible text verified: ${report.gates.deletedStateVisibleTextVerified ? 'yes' : 'no'}.`);
console.log(`Expired visible text verified: ${report.gates.expiredStateVisibleTextVerified ? 'yes' : 'no'}.`);
console.log(`Disabled/rollback visible text verified: ${report.gates.disabledRollbackStateVisibleTextVerified ? 'yes' : 'no'}.`);
console.log(`Share/copy block only renderable: ${report.gates.shareCopyBlockOnlyRenderable ? 'yes' : 'no'}.`);
console.log(`Accessibility landmarks visible: ${report.gates.accessibilityLandmarksVisible ? 'yes' : 'no'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
