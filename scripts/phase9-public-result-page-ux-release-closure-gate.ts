import {
  runPhase9PublicResultPageUxReleaseClosureGate,
  writePhase9PublicResultPageUxReleaseClosureGateEvidence
} from '../src/core/release/phase9PublicResultPageUxReleaseClosureGate';

const evidencePath = 'docs/evidence/phase9-public-result-page-ux-release-closure-latest.json';
const report = runPhase9PublicResultPageUxReleaseClosureGate();
writePhase9PublicResultPageUxReleaseClosureGateEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.5 public result page UX release closure gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.5 public result page UX release closure gate passed.');
console.log(`Phase 9.0 copy evidence: ${report.gates.phase90CopyEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Phase 9.1 share/copy evidence: ${report.gates.phase91ShareCopyEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Phase 9.2 accessibility evidence: ${report.gates.phase92AccessibilityEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Phase 9.3 visual layout evidence: ${report.gates.phase93VisualLayoutEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Phase 9.4 browser/static evidence: ${report.gates.phase94BrowserEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Phase 9.4.1 timer/no-hints evidence: ${report.gates.phase941QuizTimerNoHintsEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Phase 9.4.2 browser interaction evidence: ${report.gates.phase942QuizBrowserInteractionEvidenceCurrent ? 'current' : 'missing/stale'}.`);
console.log(`Manual browser check recorded: ${report.gates.manualBrowserCheckRecorded ? 'yes' : 'no'}.`);
console.log(`Further UX investigation deferred: ${report.gates.deeperUxInvestigationDeferredToNextTrack ? 'yes' : 'no'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
