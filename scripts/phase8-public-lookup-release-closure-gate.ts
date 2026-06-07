import {
  runPhase8PublicLookupReleaseClosureGate,
  writePhase8PublicLookupReleaseClosureEvidence
} from '../src/core/release/phase8PublicLookupReleaseClosureGate';

const evidencePath = 'docs/evidence/phase8-public-lookup-release-closure-latest.json';
const report = runPhase8PublicLookupReleaseClosureGate();
writePhase8PublicLookupReleaseClosureEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Phase 8 public lookup release closure gate failed.');
  console.error(`Issues: ${report.issues.join(', ') || 'none'}`);
  console.error(`Evidence written: ${evidencePath}`);
  process.exit(1);
}

console.log('Phase 8 public lookup release closure gate passed.');
console.log(`Database adapter evidence: ${report.gates.databaseAdapterEvidenceCurrent ? 'current' : 'stale'}.`);
console.log(`API route database binding evidence: ${report.gates.apiRouteDatabaseBindingEvidenceCurrent ? 'current' : 'stale'}.`);
console.log(`Public lookup evidence: ${report.gates.publicLookupEvidenceCurrent ? 'current' : 'stale'}.`);
console.log(`Operational smoke evidence: ${report.gates.operationalSmokeEvidenceCurrent ? 'current' : 'stale'}.`);
console.log(`Rollback drill evidence: ${report.gates.rollbackDrillEvidenceCurrent ? 'current' : 'stale'}.`);
console.log(`Raw answers blocked: ${report.gates.rawAnswersRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Raw delete tokens blocked: ${report.gates.rawDeleteTokensRemainBlocked ? 'yes' : 'no'}.`);
console.log(`Production network lookup smoke disabled by default: ${report.gates.productionNetworkLookupSmokeDisabledByDefault ? 'yes' : 'no'}.`);
console.log(`Public lookup route implementation present: ${report.gates.publicLookupRouteImplementationExists ? 'yes' : 'no'}.`);
console.log(`Phase 9 transition plan: ${report.gates.phase9TransitionPlanExists ? 'present' : 'missing'}.`);
console.log(`Evidence written: ${evidencePath}`);
