import {
  runPhase10HostedPublicResultPageEvidenceGate,
  writePhase10HostedPublicResultPageEvidence,
} from "@/core/release/phase10HostedPublicResultPageEvidence";

const report = await runPhase10HostedPublicResultPageEvidenceGate();
writePhase10HostedPublicResultPageEvidence(report);

if (!report.gates.overallPassed) {
  console.error("Phase 10.2 hosted public result page evidence gate failed.");
  console.error(`Issues: ${report.issues.join(", ") || "unknown"}`);
  console.error("Evidence written: docs/evidence/phase10-hosted-public-result-page-evidence-latest.json");
  process.exitCode = 1;
} else {
  console.log("Phase 10.2 hosted public result page evidence gate passed.");
  console.log(`Renderable hosted page: ${report.gates.hostedRenderableStatePasses ? "yes" : "no"}.`);
  console.log(`Not-found hosted page: ${report.gates.hostedNotFoundStatePasses ? "yes" : "no"}.`);
  console.log(`Unavailable states non-actionable: ${report.gates.hostedUnavailableStatesNonActionable ? "yes" : "no"}.`);
  console.log(`Public URLs avoid raw answers: ${report.gates.hostedPublicUrlsDoNotExposeRawAnswers ? "yes" : "no"}.`);
  console.log(`Visible hosted text avoids raw answers: ${report.gates.hostedVisibleTextDoesNotExposeRawAnswers ? "yes" : "no"}.`);
  console.log(`Hosted HTML avoids raw answers: ${report.gates.hostedHtmlDoesNotExposeRawAnswers ? "yes" : "no"}.`);
  console.log(`Delete tokens remain blocked: ${report.gates.hostedDeleteTokensRemainBlocked ? "yes" : "no"}.`);
  console.log(`Accessibility frame covered: ${report.gates.hostedAccessibilityFrameCovered ? "yes" : "no"}.`);
  console.log(`Hosted network is GET-only: ${report.gates.hostedNetworkIsGetOnly ? "yes" : "no"}.`);
  console.log(`Local validate excludes hosted gate: ${report.gates.validateDoesNotRunHostedGate ? "yes" : "no"}.`);
  console.log("Evidence written: docs/evidence/phase10-hosted-public-result-page-evidence-latest.json");
}
