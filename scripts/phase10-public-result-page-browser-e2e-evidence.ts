import {
  runPhase10PublicResultPageBrowserE2eEvidenceGate,
  writePhase10PublicResultPageBrowserE2eEvidence
} from '../src/core/release/phase10PublicResultPageBrowserE2eEvidence';

const evidencePath = 'docs/evidence/phase10-public-result-page-browser-e2e-evidence-latest.json';
const report = runPhase10PublicResultPageBrowserE2eEvidenceGate();
writePhase10PublicResultPageBrowserE2eEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 10.1 public result page browser E2E evidence gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 10.1 public result page browser E2E evidence gate passed.');
console.log(`Phase 10.0 quiz browser evidence current: ${report.gates.phase10QuizBrowserEvidenceCurrent ? 'yes' : 'no'}.`);
console.log(`Renderable result state passes: ${report.gates.renderableResultStatePasses ? 'yes' : 'no'}.`);
console.log(`Not-found state passes: ${report.gates.notFoundStatePasses ? 'yes' : 'no'}.`);
console.log(`Deleted state passes: ${report.gates.deletedStatePasses ? 'yes' : 'no'}.`);
console.log(`Expired state passes: ${report.gates.expiredStatePasses ? 'yes' : 'no'}.`);
console.log(`Disabled state passes: ${report.gates.disabledStatePasses ? 'yes' : 'no'}.`);
console.log(`Share/copy renderable-only boundary: ${report.gates.shareCopyRenderableOnly ? 'yes' : 'no'}.`);
console.log(`Public URL avoids raw answers: ${report.gates.publicUrlDoesNotExposeRawAnswers ? 'yes' : 'no'}.`);
console.log(`Visible text avoids raw answers: ${report.gates.visibleTextDoesNotExposeRawAnswers ? 'yes' : 'no'}.`);
console.log(`Accessibility frame covered: ${report.gates.accessibilityFrameCovered ? 'yes' : 'no'}.`);
console.log(`Public result page source exists: ${report.gates.publicResultPageSourceExists ? 'yes' : 'no'}.`);
console.log(`Persistence unchanged: ${report.gates.noPersistenceChangeSignals ? 'yes' : 'no'}.`);
console.log(`Database binding unchanged: ${report.gates.noDatabaseBindingChangeSignals ? 'yes' : 'no'}.`);
console.log(`Network smoke unchanged: ${report.gates.noNetworkSmokeChangeSignals ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${evidencePath}`);
