import {
  runPhase9QuizInteractionTimerNoHintsHotfixGate,
  writePhase9QuizInteractionTimerNoHintsHotfixEvidence
} from '../src/core/release/phase9QuizInteractionTimerNoHintsHotfix';

const evidencePath = 'docs/evidence/phase9-quiz-interaction-timer-no-hints-hotfix-latest.json';
const report = runPhase9QuizInteractionTimerNoHintsHotfixGate();
writePhase9QuizInteractionTimerNoHintsHotfixEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.4.1 quiz interaction/timer/no-hints hotfix gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.4.1 quiz interaction/timer/no-hints hotfix gate passed.');
console.log(`Mouse click selection hardened: ${report.gates.mouseClickSelectionHardened ? 'yes' : 'no'}.`);
console.log(`Keyboard selection hardened: ${report.gates.keyboardSelectionHardened ? 'yes' : 'no'}.`);
console.log(`Per-question timer is 10 seconds: ${report.gates.perQuestionTimerIsTenSeconds ? 'yes' : 'no'}.`);
console.log(`Timeout forces restart: ${report.gates.timeoutForcesRestart ? 'yes' : 'no'}.`);
console.log(`Review dots hide answer keys before completion: ${report.gates.reviewDotsHideAnswerKeysBeforeCompletion ? 'yes' : 'no'}.`);
console.log(`In-progress result hints removed: ${report.gates.inProgressResultHintsRemoved ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
