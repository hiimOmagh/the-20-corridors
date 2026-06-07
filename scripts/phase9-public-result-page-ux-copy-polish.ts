import {
  runPhase9PublicResultPageUxCopyPolishGate,
  writePhase9PublicResultPageUxCopyPolishEvidence
} from '../src/core/release/phase9PublicResultPageUxCopyPolish';

const evidencePath = 'docs/evidence/phase9-public-result-page-ux-copy-polish-latest.json';
const report = runPhase9PublicResultPageUxCopyPolishGate();
writePhase9PublicResultPageUxCopyPolishEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.0 public result page UX copy polish gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.0 public result page UX copy polish gate passed.');
console.log(`Renderable copy polished: ${report.gates.renderableCopyPolished ? 'yes' : 'no'}.`);
console.log(`Not-found copy polished: ${report.gates.notFoundCopyPolished ? 'yes' : 'no'}.`);
console.log(`Deleted copy polished: ${report.gates.deletedCopyPolished ? 'yes' : 'no'}.`);
console.log(`Expired copy polished: ${report.gates.expiredCopyPolished ? 'yes' : 'no'}.`);
console.log(`Disabled/rollback copy polished: ${report.gates.disabledRollbackCopyPolished ? 'yes' : 'no'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Phase 8 closure evidence current: ${report.gates.phase8ClosureEvidenceCurrent ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
