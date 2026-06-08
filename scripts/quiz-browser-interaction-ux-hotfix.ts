import {
  runPhase9QuizBrowserInteractionUxHotfixGate,
  writePhase9QuizBrowserInteractionUxHotfixEvidence
} from '../src/core/release/phase9QuizBrowserInteractionUxHotfix';

const evidencePath = 'docs/evidence/phase9-quiz-browser-interaction-ux-hotfix-latest.json';
const report = runPhase9QuizBrowserInteractionUxHotfixGate();
writePhase9QuizBrowserInteractionUxHotfixEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.4.2 quiz browser interaction UX hotfix gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.4.2 quiz browser interaction UX hotfix gate passed.');
console.log(`Next dev origin allows 172.21.48.1: ${report.gates.nextDevOriginAllowsUserNetworkHost ? 'yes' : 'no'}.`);
console.log(`Client hydration marker exists: ${report.gates.clientHydrationMarkerExists ? 'yes' : 'no'}.`);
console.log(`Countdown visible marker exists: ${report.gates.countdownVisibleMarkerExists ? 'yes' : 'no'}.`);
console.log(`Pointer activation path exists: ${report.gates.pointerActivationPathExists ? 'yes' : 'no'}.`);
console.log(`Click fallback blocks double submit: ${report.gates.clickFallbackDoesNotDoubleSubmit ? 'yes' : 'no'}.`);
console.log(`Keyboard shortcuts use key and code: ${report.gates.keyboardShortcutUsesKeyAndCode ? 'yes' : 'no'}.`);
console.log(`Stale closure protection exists: ${report.gates.staleClosureProtectionExists ? 'yes' : 'no'}.`);
console.log(`Timeout still forces restart: ${report.gates.timeoutStillForcesRestart ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
