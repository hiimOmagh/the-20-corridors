import {
  runPhase9PublicResultPageVisualLayoutPolishGate,
  writePhase9PublicResultPageVisualLayoutPolishEvidence
} from '../src/core/release/phase9PublicResultPageVisualLayoutPolish';

const evidencePath = 'docs/evidence/phase9-public-result-page-visual-layout-polish-latest.json';
const report = runPhase9PublicResultPageVisualLayoutPolishGate();
writePhase9PublicResultPageVisualLayoutPolishEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.3 public result page visual layout polish gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.3 public result page visual layout polish gate passed.');
console.log(`Responsive shell spacing exists: ${report.gates.responsiveShellSpacingExists ? 'yes' : 'no'}.`);
console.log(`Renderable visual hierarchy exists: ${report.gates.renderableVisualHierarchyExists ? 'yes' : 'no'}.`);
console.log(`Unavailable visual structure exists: ${report.gates.unavailableVisualStructureExists ? 'yes' : 'no'}.`);
console.log(`Mobile layout remains usable: ${report.gates.mobileLayoutRemainsUsable ? 'yes' : 'no'}.`);
console.log(`Share/copy block visually distinct: ${report.gates.shareCopyBlockVisuallyDistinct ? 'yes' : 'no'}.`);
console.log(`Accessibility semantics intact: ${report.gates.accessibilitySemanticsRemainIntact ? 'yes' : 'no'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
