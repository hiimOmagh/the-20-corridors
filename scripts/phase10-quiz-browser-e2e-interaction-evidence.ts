import {
  runPhase10QuizBrowserE2eInteractionEvidenceGate,
  writePhase10QuizBrowserE2eInteractionEvidence
} from '../src/core/release/phase10QuizBrowserE2eInteractionEvidence';

const evidencePath = 'docs/evidence/phase10-quiz-browser-e2e-interaction-evidence-latest.json';
const report = runPhase10QuizBrowserE2eInteractionEvidenceGate();
writePhase10QuizBrowserE2eInteractionEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 10.0 quiz browser E2E interaction evidence gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 10.0 quiz browser E2E interaction evidence gate passed.');
console.log(`Mouse click advances exactly one question: ${report.gates.mouseClickAdvancesExactlyOneQuestion ? 'yes' : 'no'}.`);
console.log(`Keyboard A/B/C/D advances exactly one question: ${report.gates.keyboardShortcutAdvancesExactlyOneQuestion ? 'yes' : 'no'}.`);
console.log(`Focused Enter advances exactly one question: ${report.gates.focusedEnterAdvancesExactlyOneQuestion ? 'yes' : 'no'}.`);
console.log(`Focused Space advances exactly one question: ${report.gates.focusedSpaceAdvancesExactlyOneQuestion ? 'yes' : 'no'}.`);
console.log(`Timer starts at 10 seconds: ${report.gates.timerStartsAtTenSeconds ? 'yes' : 'no'}.`);
console.log(`Timer counts down: ${report.gates.timerCountsDown ? 'yes' : 'no'}.`);
console.log(`Timeout forces restart: ${report.gates.timeoutForcesRestart ? 'yes' : 'no'}.`);
console.log(`Pointer/click fallback avoids double-skip: ${report.gates.noDoubleSkipFromPointerClickFallback ? 'yes' : 'no'}.`);
console.log(`No pre-completion result hints: ${report.gates.noPreCompletionResultHints ? 'yes' : 'no'}.`);
console.log(`Completion still generates report: ${report.gates.completionStillGeneratesReport ? 'yes' : 'no'}.`);
console.log(`Phase 9 closure evidence current: ${report.gates.phase9ClosureEvidenceCurrent ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
