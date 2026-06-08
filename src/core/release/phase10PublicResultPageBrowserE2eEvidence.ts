import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { runPublicResultPageBrowserE2eEvidence } from "@/features/results/publicResultPageBrowserE2eEvidence";

export const PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_SCHEMA_VERSION =
  "phase-10.1-public-result-page-browser-e2e-evidence-v1" as const;
export const PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID =
  "phase-10-1-public-result-page-browser-e2e-evidence" as const;

const PACKAGE_JSON_PATH = "package.json";
const GATE_SCRIPT_PATH =
  "scripts/phase10-public-result-page-browser-e2e-evidence.ts";
const GATE_MODULE_PATH =
  "src/core/release/phase10PublicResultPageBrowserE2eEvidence.ts";
const E2E_HELPER_PATH =
  "src/features/results/publicResultPageBrowserE2eEvidence.ts";
const GATE_TEST_PATH =
  "tests/core/phase10PublicResultPageBrowserE2eEvidence.test.ts";
const E2E_TEST_PATH = "tests/ui/publicResultPageBrowserE2eEvidence.test.ts";
const EVIDENCE_PATH =
  "docs/evidence/phase10-public-result-page-browser-e2e-evidence-latest.json";
const RELEASE_DOC_PATH =
  "docs/release/phase-10-1-public-result-page-browser-e2e-evidence.md";
const STATUS_DOC_PATH =
  "docs/ui/phase-10-1-public-result-page-browser-e2e-evidence-status.md";
const PHASE_10_TRANSITION_DOC_PATH = "docs/ui/phase-10-transition-plan.md";
const PHASE_10_0_EVIDENCE_PATH =
  "docs/evidence/phase10-quiz-browser-e2e-interaction-evidence-latest.json";

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

type JsonRecord = Record<string, unknown>;

type SourceScan = {
  readonly checkedFiles: readonly string[];
  readonly publicResultPageSourceFiles: readonly string[];
  readonly publicResultStateSignals: readonly string[];
  readonly accessibilitySignals: readonly string[];
  readonly rawAnswerLeakSignals: readonly string[];
  readonly persistenceChangeSignals: readonly string[];
  readonly databaseBindingChangeSignals: readonly string[];
  readonly networkSmokeChangeSignals: readonly string[];
};

export interface Phase10PublicResultPageBrowserE2eEvidenceReport {
  readonly schemaVersion: typeof PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID;
  readonly metadata: {
    readonly evidenceMode: "deterministic-public-result-browser-state-runner";
    readonly runtimeChange: "none";
    readonly checkedAt: "static-and-simulated-e2e";
  };
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly e2eHelperExists: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsGate: boolean;
    readonly phase10QuizBrowserEvidenceCurrent: boolean;
    readonly renderableResultStatePasses: boolean;
    readonly notFoundStatePasses: boolean;
    readonly deletedStatePasses: boolean;
    readonly expiredStatePasses: boolean;
    readonly disabledStatePasses: boolean;
    readonly shareCopyRenderableOnly: boolean;
    readonly publicUrlDoesNotExposeRawAnswers: boolean;
    readonly visibleTextDoesNotExposeRawAnswers: boolean;
    readonly accessibilityFrameCovered: boolean;
    readonly publicResultPageSourceExists: boolean;
    readonly sourceHasRenderableStateSignals: boolean;
    readonly sourceHasNonRenderableStateSignals: boolean;
    readonly sourceHasAccessibilitySignals: boolean;
    readonly sourceDoesNotExposeRawAnswerSignals: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly docsExist: boolean;
    readonly overallPassed: boolean;
  };
  readonly scenario: ReturnType<typeof runPublicResultPageBrowserE2eEvidence>;
  readonly sourceScan: SourceScan;
  readonly issues: readonly string[];
}

const PUBLIC_RESULT_SOURCE_ROOTS = [
  "src/app/r",
  "app/r",
  "src/app/results",
  "app/results",
  "src/features/results",
  "src/features/public-result",
] as const;

const SOURCE_BOUNDARY_SCAN_FILES = [E2E_HELPER_PATH] as const;

const RENDERABLE_STATE_SIGNALS = [
  "archetype",
  "axis",
  "contradiction",
  "motive",
  "share",
  "copy",
] as const;
const NON_RENDERABLE_STATE_SIGNALS = [
  "not found",
  "deleted",
  "expired",
  "disabled",
  "unavailable",
  "removed",
] as const;
const ACCESSIBILITY_SIGNALS = [
  "<main",
  'role="main"',
  "aria-",
  "<h1",
  'role="heading"',
  'role="status"',
  'role="alert"',
] as const;
const RAW_ANSWER_LEAK_SIGNALS = [
  "raw answers:",
  "rawanswers:",
  "selectedoption=",
  "?answers=",
  "&answers=",
  "?rawanswers=",
  "&rawanswers=",
  "json.stringify(result.answers",
  "json.stringify(publicresult.answers",
  "searchparams.get('answers'",
  "searchparams.get('rawanswers'",
] as const;
const PERSISTENCE_CHANGE_SIGNALS = [
  "createPublicResult(",
  "savePublicResult(",
  "localStorage.setItem(",
  "indexedDB.",
  "new PrismaClient",
] as const;
const DATABASE_BINDING_CHANGE_SIGNALS = [
  "@neondatabase/serverless",
  "executeQuery(",
  "PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION",
  "PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION",
] as const;
const NETWORK_SMOKE_CHANGE_SIGNALS = [
  "fetch(",
  "networkLookupSmokeExecuted",
  "productionNetworkLookupSmokeExecuted",
] as const;

export function runPhase10PublicResultPageBrowserE2eEvidenceGate(
  repoRoot = process.cwd(),
): Phase10PublicResultPageBrowserE2eEvidenceReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? {
    scripts: {},
  };
  const validateScript = packageJson.scripts?.validate ?? "";
  const phase10Transition = readOptionalFile(
    root,
    PHASE_10_TRANSITION_DOC_PATH,
  );
  const phase10QuizEvidence = readJson<JsonRecord>(
    root,
    PHASE_10_0_EVIDENCE_PATH,
  );
  const scenario = runPublicResultPageBrowserE2eEvidence();
  const sourceScan = scanSources(root);

  const nonRenderableStatesPass =
    scenario.notFound.passed &&
    scenario.deleted.passed &&
    scenario.expired.passed &&
    scenario.disabled.passed;

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    e2eHelperExists: existsSync(path.join(root, E2E_HELPER_PATH)),
    gateTestsExist:
      existsSync(path.join(root, GATE_TEST_PATH)) &&
      existsSync(path.join(root, E2E_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.["evidence:public-result-page-browser-e2e"] ===
      "tsx scripts/phase10-public-result-page-browser-e2e-evidence.ts",
    validateRunsGate: validateScript.includes(
      "npm run evidence:public-result-page-browser-e2e",
    ),
    phase10QuizBrowserEvidenceCurrent:
      phase10QuizEvidence !== null && readOverallPassed(phase10QuizEvidence),
    renderableResultStatePasses: scenario.renderable.passed,
    notFoundStatePasses: scenario.notFound.passed,
    deletedStatePasses: scenario.deleted.passed,
    expiredStatePasses: scenario.expired.passed,
    disabledStatePasses: scenario.disabled.passed,
    shareCopyRenderableOnly:
      scenario.renderable.shareCopyVisible &&
      scenario.notFound.shareCopySuppressed &&
      scenario.deleted.shareCopySuppressed &&
      scenario.expired.shareCopySuppressed &&
      scenario.disabled.shareCopySuppressed,
    publicUrlDoesNotExposeRawAnswers:
      scenario.renderable.noRawAnswersInUrl &&
      scenario.notFound.noRawAnswersInUrl &&
      scenario.deleted.noRawAnswersInUrl &&
      scenario.expired.noRawAnswersInUrl &&
      scenario.disabled.noRawAnswersInUrl,
    visibleTextDoesNotExposeRawAnswers:
      scenario.renderable.noRawAnswersInVisibleText &&
      scenario.notFound.noRawAnswersInVisibleText &&
      scenario.deleted.noRawAnswersInVisibleText &&
      scenario.expired.noRawAnswersInVisibleText &&
      scenario.disabled.noRawAnswersInVisibleText,
    accessibilityFrameCovered:
      scenario.renderable.accessibilityLandmarksVisible &&
      scenario.notFound.accessibilityLandmarksVisible &&
      scenario.deleted.accessibilityLandmarksVisible &&
      scenario.expired.accessibilityLandmarksVisible &&
      scenario.disabled.accessibilityLandmarksVisible,
    publicResultPageSourceExists:
      sourceScan.publicResultPageSourceFiles.length > 0,
    sourceHasRenderableStateSignals:
      sourceScan.publicResultStateSignals.filter((signal) =>
        signal.startsWith("renderable:"),
      ).length >= 3,
    sourceHasNonRenderableStateSignals:
      sourceScan.publicResultStateSignals.filter((signal) =>
        signal.startsWith("non-renderable:"),
      ).length >= 2,
    sourceHasAccessibilitySignals: sourceScan.accessibilitySignals.length >= 2,
    sourceDoesNotExposeRawAnswerSignals:
      sourceScan.rawAnswerLeakSignals.length === 0,
    noPersistenceChangeSignals:
      sourceScan.persistenceChangeSignals.length === 0,
    noDatabaseBindingChangeSignals:
      sourceScan.databaseBindingChangeSignals.length === 0,
    noNetworkSmokeChangeSignals:
      sourceScan.networkSmokeChangeSignals.length === 0,
    docsExist:
      existsSync(path.join(root, RELEASE_DOC_PATH)) &&
      existsSync(path.join(root, STATUS_DOC_PATH)) &&
      phase10Transition.includes(
        "Phase 10.1 — Public Result Page Browser E2E Evidence",
      ) &&
      phase10Transition.includes(
        "Phase 10.0 — Quiz Browser E2E Interaction Evidence",
      ) &&
      nonRenderableStatesPass,
    overallPassed: false,
  };

  const finalizedGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== "overallPassed")
      .every(([, value]) => value === true),
  };

  const issues = Object.entries(finalizedGates)
    .filter(([key, value]) => key !== "overallPassed" && value !== true)
    .map(([key]) => key);

  return {
    schemaVersion:
      PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_SCHEMA_VERSION,
    gateId: PHASE_10_PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID,
    metadata: {
      evidenceMode: "deterministic-public-result-browser-state-runner",
      runtimeChange: "none",
      checkedAt: "static-and-simulated-e2e",
    },
    gates: finalizedGates,
    scenario,
    sourceScan,
    issues,
  };
}

export function writePhase10PublicResultPageBrowserE2eEvidence(
  report: Phase10PublicResultPageBrowserE2eEvidenceReport,
  outputPath = EVIDENCE_PATH,
): void {
  const targetPath = path.resolve(outputPath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function scanSources(root: string): SourceScan {
  const publicResultPageSourceFiles = findPublicResultPageSourceFiles(root);
  const publicResultCombinedSource = publicResultPageSourceFiles
    .map((relativePath) => readOptionalFile(root, relativePath))
    .join("\n")
    .toLowerCase();
  const checkedFiles = SOURCE_BOUNDARY_SCAN_FILES.filter((relativePath) =>
    existsSync(path.join(root, relativePath)),
  );

  return {
    checkedFiles,
    publicResultPageSourceFiles,
    publicResultStateSignals: [
      ...findTextSignals(
        publicResultCombinedSource,
        RENDERABLE_STATE_SIGNALS,
        "renderable",
      ),
      ...findTextSignals(
        publicResultCombinedSource,
        NON_RENDERABLE_STATE_SIGNALS,
        "non-renderable",
      ),
    ],
    accessibilitySignals: findTextSignals(
      publicResultCombinedSource,
      ACCESSIBILITY_SIGNALS,
      "accessibility",
    ),
    rawAnswerLeakSignals: findTextSignals(
      publicResultCombinedSource,
      RAW_ANSWER_LEAK_SIGNALS,
      "raw-answer",
    ),
    persistenceChangeSignals: findSignals(
      root,
      checkedFiles,
      PERSISTENCE_CHANGE_SIGNALS,
    ),
    databaseBindingChangeSignals: findSignals(
      root,
      checkedFiles,
      DATABASE_BINDING_CHANGE_SIGNALS,
    ),
    networkSmokeChangeSignals: findSignals(
      root,
      checkedFiles,
      NETWORK_SMOKE_CHANGE_SIGNALS,
    ),
  };
}

function findPublicResultPageSourceFiles(root: string): readonly string[] {
  const candidates: string[] = [];

  for (const relativeRoot of PUBLIC_RESULT_SOURCE_ROOTS) {
    const absoluteRoot = path.join(root, relativeRoot);

    if (!existsSync(absoluteRoot)) {
      continue;
    }

    for (const relativePath of walkSourceFiles(root, absoluteRoot)) {
      if (isPublicResultPageSource(root, relativePath)) {
        candidates.push(relativePath);
      }
    }
  }

  return [...new Set(candidates)].sort();
}

function walkSourceFiles(root: string, directory: string): readonly string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist"
      ) {
        continue;
      }

      files.push(...walkSourceFiles(root, absolutePath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!/\.(tsx?|jsx?|mdx?)$/i.test(entry.name)) {
      continue;
    }

    if (statSync(absolutePath).size > 250_000) {
      continue;
    }

    files.push(path.relative(root, absolutePath).split(path.sep).join("/"));
  }

  return files;
}

function isPublicResultPageSource(root: string, relativePath: string): boolean {
  if (
    relativePath === E2E_HELPER_PATH ||
    relativePath.startsWith("src/core/release/")
  ) {
    return false;
  }

  const normalizedPath = relativePath.toLowerCase();

  if (
    normalizedPath.includes("/api/") ||
    normalizedPath.endsWith("/route.ts") ||
    normalizedPath.endsWith("/route.tsx") ||
    normalizedPath.includes("contract") ||
    normalizedPath.includes("storage") ||
    normalizedPath.includes("adapter") ||
    normalizedPath.includes("database") ||
    normalizedPath.includes("dto") ||
    normalizedPath.includes("serializer") ||
    normalizedPath.includes("serialization")
  ) {
    return false;
  }

  const content = readOptionalFile(root, relativePath).toLowerCase();
  const pathSuggestsPublicResult =
    (normalizedPath.includes("result") && normalizedPath.includes("public")) ||
    normalizedPath.includes("/r/") ||
    normalizedPath.includes("[publicid]") ||
    normalizedPath.includes("[public-id]");
  const contentSuggestsPublicResult =
    content.includes("public result") ||
    content.includes("publicresult") ||
    content.includes("publicid") ||
    content.includes("public id") ||
    content.includes("/r/");

  return pathSuggestsPublicResult || contentSuggestsPublicResult;
}

function findTextSignals(
  source: string,
  signals: readonly string[],
  prefix: "renderable" | "non-renderable" | "accessibility" | "raw-answer",
): readonly string[] {
  return signals
    .filter((signal) => source.includes(signal.toLowerCase()))
    .map((signal) => `${prefix}:${signal}`);
}

function findSignals(
  root: string,
  relativePaths: readonly string[],
  signals: readonly string[],
): readonly string[] {
  const findings: string[] = [];

  for (const relativePath of relativePaths) {
    const content = readOptionalFile(root, relativePath);

    for (const signal of signals) {
      if (content.includes(signal)) {
        findings.push(`${relativePath}: ${signal}`);
      }
    }
  }

  return findings;
}

function readOptionalFile(root: string, relativePath: string): string {
  const filePath = path.join(root, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function readJson<T>(root: string, relativePath: string): T | null {
  try {
    return JSON.parse(readOptionalFile(root, relativePath)) as T;
  } catch {
    return null;
  }
}

function readOverallPassed(evidence: JsonRecord): boolean {
  if (evidence.overallPassed === true) {
    return true;
  }

  const gates = evidence.gates;
  return (
    typeof gates === "object" &&
    gates !== null &&
    "overallPassed" in gates &&
    gates.overallPassed === true
  );
}
