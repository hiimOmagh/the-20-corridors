import {
  runPhase9PublicResultPageAccessibilitySemanticsPolishGate,
  writePhase9PublicResultPageAccessibilitySemanticsPolishEvidence
} from '../src/core/release/phase9PublicResultPageAccessibilitySemanticsPolish';

const evidencePath = 'docs/evidence/phase9-public-result-page-accessibility-semantics-polish-latest.json';
const report = runPhase9PublicResultPageAccessibilitySemanticsPolishGate();
writePhase9PublicResultPageAccessibilitySemanticsPolishEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 9.2 public result page accessibility semantics polish gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 9.2 public result page accessibility semantics polish gate passed.');
console.log(`Main landmark explicit: ${report.gates.explicitMainLandmarkExists ? 'yes' : 'no'}.`);
console.log(`Heading hierarchy accessible: ${report.gates.accessibleHeadingHierarchyExists ? 'yes' : 'no'}.`);
console.log(`Status/error semantics exist: ${report.gates.statusAndErrorSemanticsExist ? 'yes' : 'no'}.`);
console.log(`Renderable regions labelled: ${report.gates.renderableRegionsLabelled ? 'yes' : 'no'}.`);
console.log(`Share/copy action has accessible help: ${report.gates.shareCopyActionHasAccessibleHelp ? 'yes' : 'no'}.`);
console.log(`Unavailable states non-actionable: ${report.gates.unavailableStatesRemainNonActionable ? 'yes' : 'no'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
