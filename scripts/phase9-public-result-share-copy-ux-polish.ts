import {
  runPhase9PublicResultShareCopyUxPolishGate,
  writePhase9PublicResultShareCopyUxPolishEvidence
} from '../src/core/release/phase9PublicResultShareCopyUxPolish';

const evidencePath = 'docs/evidence/phase9-public-result-share-copy-ux-polish-latest.json';
const report = runPhase9PublicResultShareCopyUxPolishGate();
writePhase9PublicResultShareCopyUxPolishEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.1 public result share/copy UX polish gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.1 public result share/copy UX polish gate passed.');
console.log(`Copy-link affordance text clear: ${report.gates.copyLinkAffordanceTextClear ? 'yes' : 'no'}.`);
console.log(`Manual copy guidance exists: ${report.gates.manualCopyGuidanceExists ? 'yes' : 'no'}.`);
console.log(`Unavailable states block copy action: ${report.gates.unavailableStatesBlockCopyAction ? 'yes' : 'no'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
