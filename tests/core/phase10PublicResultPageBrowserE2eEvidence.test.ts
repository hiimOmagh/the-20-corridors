import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID,
  PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_SCHEMA_VERSION,
  runPhase10PublicResultPageBrowserE2eEvidenceGate,
} from "@/core/release/phase10PublicResultPageBrowserE2eEvidence";

function createFixtureRepo(): string {
  const root = path.join(
    tmpdir(),
    `phase10-1-public-result-e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const directories = [
    "scripts",
    "src/core/release",
    "src/features/results",
    "src/app/r/[publicId]",
    "tests/core",
    "tests/ui",
    "docs/evidence",
    "docs/release",
    "docs/ui",
  ];

  for (const directory of directories) {
    mkdirSync(path.join(root, directory), { recursive: true });
  }

  writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify(
      {
        scripts: {
          validate:
            "npm run evidence:quiz-browser-e2e && npm run evidence:public-result-page-browser-e2e",
          "evidence:public-result-page-browser-e2e":
            "tsx scripts/phase10-public-result-page-browser-e2e-evidence.ts",
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "scripts/phase10-public-result-page-browser-e2e-evidence.ts",
    ),
    "export {};\n",
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "src/core/release/phase10PublicResultPageBrowserE2eEvidence.ts",
    ),
    [
      "const RAW_ANSWER_LEAK_SIGNALS = ['rawAnswers', 'selectedOption'];",
      "const PERSISTENCE_CHANGE_SIGNALS = ['createPublicResult(', 'localStorage.setItem('];",
      "const DATABASE_BINDING_CHANGE_SIGNALS = ['@neondatabase/serverless', 'executeQuery('];",
      "const NETWORK_SMOKE_CHANGE_SIGNALS = ['fetch('];",
      "export {};",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "src/features/results/publicResultPageBrowserE2eEvidence.ts",
    ),
    "export {};\n",
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "tests/core/phase10PublicResultPageBrowserE2eEvidence.test.ts",
    ),
    "export {};\n",
    "utf8",
  );
  writeFileSync(
    path.join(root, "tests/ui/publicResultPageBrowserE2eEvidence.test.ts"),
    "export {};\n",
    "utf8",
  );
  writeFileSync(
    path.join(root, "src/app/r/[publicId]/page.tsx"),
    [
      "export default function PublicResultPage() {",
      '  return <main aria-labelledby="public-result-heading">',
      '    <h1 id="public-result-heading">Public result</h1>',
      '    <section aria-label="Result report">Archetype Axis Contradiction Motive Share Copy</section>',
      '    <section role="status">Not found Deleted Expired Disabled Unavailable Removed</section>',
      "  </main>;",
      "}",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "docs/evidence/phase10-quiz-browser-e2e-interaction-evidence-latest.json",
    ),
    '{"gates":{"overallPassed":true}}\n',
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "docs/release/phase-10-1-public-result-page-browser-e2e-evidence.md",
    ),
    "# release\n",
    "utf8",
  );
  writeFileSync(
    path.join(
      root,
      "docs/ui/phase-10-1-public-result-page-browser-e2e-evidence-status.md",
    ),
    "# status\n",
    "utf8",
  );
  writeFileSync(
    path.join(root, "docs/ui/phase-10-transition-plan.md"),
    "# Phase 10 Transition Plan\n\n## Phase 10.0 — Quiz Browser E2E Interaction Evidence\n\n## Phase 10.1 — Public Result Page Browser E2E Evidence\n",
    "utf8",
  );

  return root;
}

describe("phase 10.1 public result page browser E2E evidence gate", () => {
  it("passes when public result browser-state evidence and source contracts are present", () => {
    const report =
      runPhase10PublicResultPageBrowserE2eEvidenceGate(createFixtureRepo());

    expect(report.schemaVersion).toBe(
      PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_SCHEMA_VERSION,
    );
    expect(report.gateId).toBe(
      PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID,
    );
    expect(report.gates).toMatchObject({
      gateScriptExists: true,
      gateModuleExists: true,
      e2eHelperExists: true,
      gateTestsExist: true,
      packageScriptExists: true,
      validateRunsGate: true,
      phase10QuizBrowserEvidenceCurrent: true,
      renderableResultStatePasses: true,
      notFoundStatePasses: true,
      deletedStatePasses: true,
      expiredStatePasses: true,
      disabledStatePasses: true,
      shareCopyRenderableOnly: true,
      publicUrlDoesNotExposeRawAnswers: true,
      visibleTextDoesNotExposeRawAnswers: true,
      accessibilityFrameCovered: true,
      publicResultPageSourceExists: true,
      sourceHasRenderableStateSignals: true,
      sourceHasNonRenderableStateSignals: true,
      sourceHasAccessibilitySignals: true,
      sourceDoesNotExposeRawAnswerSignals: true,
      noPersistenceChangeSignals: true,
      noDatabaseBindingChangeSignals: true,
      noNetworkSmokeChangeSignals: true,
      docsExist: true,
      overallPassed: true,
    });
    expect(report.scenario.allStatesPassed).toBe(true);
    expect(report.sourceScan.checkedFiles).toEqual([
      "src/features/results/publicResultPageBrowserE2eEvidence.ts",
    ]);
    expect(report.sourceScan.rawAnswerLeakSignals).toEqual([]);
    expect(report.sourceScan.persistenceChangeSignals).toEqual([]);
    expect(report.sourceScan.databaseBindingChangeSignals).toEqual([]);
    expect(report.sourceScan.networkSmokeChangeSignals).toEqual([]);
    expect(report.issues).toEqual([]);
  });
});
