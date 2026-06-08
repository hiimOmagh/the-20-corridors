import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildHostedPublicResultPageUrlConfigFromEnv,
  runHostedPublicResultPageEvidence,
  type HostedFetchLike,
  type HostedPublicResultPageEvidenceReport,
  type HostedPublicResultPageFetchResult,
} from "@/features/results/hostedPublicResultPageEvidence";

export const PHASE_10_HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_SCHEMA_VERSION =
  "phase-10.2-hosted-public-result-page-evidence-v1" as const;
export const PHASE_10_HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_ID =
  "phase-10-2-hosted-public-result-page-evidence" as const;

const PACKAGE_JSON_PATH = "package.json";
const GATE_SCRIPT_PATH = "scripts/phase10-hosted-public-result-page-evidence.ts";
const GATE_MODULE_PATH = "src/core/release/phase10HostedPublicResultPageEvidence.ts";
const HOSTED_HELPER_PATH = "src/features/results/hostedPublicResultPageEvidence.ts";
const GATE_TEST_PATH = "tests/core/phase10HostedPublicResultPageEvidence.test.ts";
const HOSTED_TEST_PATH = "tests/ui/hostedPublicResultPageEvidence.test.ts";
const EVIDENCE_PATH = "docs/evidence/phase10-hosted-public-result-page-evidence-latest.json";
const RELEASE_DOC_PATH = "docs/release/phase-10-2-hosted-public-result-page-evidence.md";
const STATUS_DOC_PATH = "docs/ui/phase-10-2-hosted-public-result-page-evidence-status.md";
const PHASE_10_TRANSITION_DOC_PATH = "docs/ui/phase-10-transition-plan.md";
const PHASE_10_1_EVIDENCE_PATH =
  "docs/evidence/phase10-public-result-page-browser-e2e-evidence-latest.json";

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

type JsonRecord = Record<string, unknown>;

type SourceScan = {
  readonly checkedFiles: readonly string[];
  readonly mutationMethodSignals: readonly string[];
  readonly persistenceChangeSignals: readonly string[];
  readonly databaseBindingChangeSignals: readonly string[];
  readonly hostedGetOnlySignals: readonly string[];
};

export interface Phase10HostedPublicResultPageEvidenceReport {
  readonly schemaVersion: typeof PHASE_10_HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_10_HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_ID;
  readonly metadata: {
    readonly evidenceMode: "opt-in-hosted-public-result-page-http-evidence";
    readonly runtimeChange: "none";
    readonly networkScope: "hosted-get-only";
    readonly validateWiring: "not-in-local-validate";
  };
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly hostedHelperExists: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateDoesNotRunHostedGate: boolean;
    readonly phase10PublicResultPageEvidenceCurrent: boolean;
    readonly hostedRequiredUrlsConfigured: boolean;
    readonly hostedRenderableStatePasses: boolean;
    readonly hostedNotFoundStatePasses: boolean;
    readonly hostedOptionalUnavailableStatesDoNotFail: boolean;
    readonly hostedUnavailableStatesNonActionable: boolean;
    readonly hostedPublicUrlsDoNotExposeRawAnswers: boolean;
    readonly hostedVisibleTextDoesNotExposeRawAnswers: boolean;
    readonly hostedHtmlDoesNotExposeRawAnswers: boolean;
    readonly hostedDeleteTokensRemainBlocked: boolean;
    readonly hostedAccessibilityFrameCovered: boolean;
    readonly hostedUrlsStayOnExpectedOrigin: boolean;
    readonly hostedNetworkIsGetOnly: boolean;
    readonly noMutationMethodSignals: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly docsExist: boolean;
    readonly overallPassed: boolean;
  };
  readonly hostedEvidence: HostedPublicResultPageEvidenceReport;
  readonly sourceScan: SourceScan;
  readonly issues: readonly string[];
}

const SOURCE_BOUNDARY_SCAN_FILES = [GATE_SCRIPT_PATH, HOSTED_HELPER_PATH] as const;
const MUTATION_METHOD_SIGNALS = [
  'method: "POST"',
  "method: 'POST'",
  'method: "PUT"',
  "method: 'PUT'",
  'method: "PATCH"',
  "method: 'PATCH'",
  'method: "DELETE"',
  "method: 'DELETE'",
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
const HOSTED_GET_ONLY_SIGNALS = ["method: 'GET'", 'method: "GET"'] as const;

export async function runPhase10HostedPublicResultPageEvidenceGate(options: {
  readonly repoRoot?: string;
  readonly env?: Record<string, string | undefined>;
  readonly fetcher?: HostedFetchLike;
} = {}): Promise<Phase10HostedPublicResultPageEvidenceReport> {
  const root = path.resolve(options.repoRoot ?? process.cwd());
  const env = options.env ?? process.env;
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const validateScript = packageJson.scripts?.validate ?? "";
  const phase10Transition = readOptionalFile(root, PHASE_10_TRANSITION_DOC_PATH);
  const phase10PublicResultEvidence = readJson<JsonRecord>(root, PHASE_10_1_EVIDENCE_PATH);
  const hostedConfig = buildHostedPublicResultPageUrlConfigFromEnv(env);
  const hostedEvidence = await runHostedPublicResultPageEvidence(hostedConfig, options.fetcher);
  const sourceScan = scanSources(root);
  const configuredResults = Object.values(hostedEvidence.states).filter(
    (result): result is HostedPublicResultPageFetchResult => result !== undefined && result.configured,
  );
  const unavailableResults = configuredResults.filter((result) => result.state !== "renderable");

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    hostedHelperExists: existsSync(path.join(root, HOSTED_HELPER_PATH)),
    gateTestsExist:
      existsSync(path.join(root, GATE_TEST_PATH)) &&
      existsSync(path.join(root, HOSTED_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.["evidence:hosted-public-result-page"] ===
      "tsx scripts/phase10-hosted-public-result-page-evidence.ts",
    validateDoesNotRunHostedGate: !validateScript.includes(
      "npm run evidence:hosted-public-result-page",
    ),
    phase10PublicResultPageEvidenceCurrent:
      phase10PublicResultEvidence !== null && readOverallPassed(phase10PublicResultEvidence),
    hostedRequiredUrlsConfigured: hostedEvidence.requiredUrlsConfigured,
    hostedRenderableStatePasses: hostedEvidence.states.renderable.passed,
    hostedNotFoundStatePasses: hostedEvidence.states.notFound.passed,
    hostedOptionalUnavailableStatesDoNotFail:
      hostedEvidence.optionalStatesDeferred.length >= 0 &&
      configuredResults.every((result) => result.passed),
    hostedUnavailableStatesNonActionable:
      unavailableResults.length >= 1 &&
      unavailableResults.every((result) => result.shareCopySuppressed),
    hostedPublicUrlsDoNotExposeRawAnswers:
      configuredResults.length >= 2 &&
      configuredResults.every((result) => result.noRawAnswersInUrl),
    hostedVisibleTextDoesNotExposeRawAnswers:
      configuredResults.length >= 2 &&
      configuredResults.every((result) => result.noRawAnswersInVisibleText),
    hostedHtmlDoesNotExposeRawAnswers:
      configuredResults.length >= 2 &&
      configuredResults.every((result) => result.noRawAnswersInHtml),
    hostedDeleteTokensRemainBlocked:
      configuredResults.length >= 2 &&
      configuredResults.every(
        (result) => result.noRawDeleteTokenInHtml && result.noRawDeleteTokenInVisibleText,
      ),
    hostedAccessibilityFrameCovered:
      configuredResults.length >= 2 &&
      configuredResults.every((result) => result.accessibilityFrameVisible),
    hostedUrlsStayOnExpectedOrigin:
      configuredResults.length >= 2 &&
      configuredResults.every((result) => result.sameOriginAsExpected),
    hostedNetworkIsGetOnly: sourceScan.hostedGetOnlySignals.length > 0,
    noMutationMethodSignals: sourceScan.mutationMethodSignals.length === 0,
    noPersistenceChangeSignals: sourceScan.persistenceChangeSignals.length === 0,
    noDatabaseBindingChangeSignals: sourceScan.databaseBindingChangeSignals.length === 0,
    docsExist:
      existsSync(path.join(root, RELEASE_DOC_PATH)) &&
      existsSync(path.join(root, STATUS_DOC_PATH)) &&
      phase10Transition.includes("Phase 10.2 — Hosted Public Result Page Evidence") &&
      phase10Transition.includes("Phase 10.1 — Public Result Page Browser E2E Evidence"),
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
    schemaVersion: PHASE_10_HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_SCHEMA_VERSION,
    gateId: PHASE_10_HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_ID,
    metadata: {
      evidenceMode: "opt-in-hosted-public-result-page-http-evidence",
      runtimeChange: "none",
      networkScope: "hosted-get-only",
      validateWiring: "not-in-local-validate",
    },
    gates: finalizedGates,
    hostedEvidence,
    sourceScan,
    issues,
  };
}

export function writePhase10HostedPublicResultPageEvidence(
  report: Phase10HostedPublicResultPageEvidenceReport,
  outputPath = EVIDENCE_PATH,
): void {
  const targetPath = path.resolve(outputPath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function scanSources(root: string): SourceScan {
  const checkedFiles = SOURCE_BOUNDARY_SCAN_FILES.filter((relativePath) =>
    existsSync(path.join(root, relativePath)),
  );

  return {
    checkedFiles,
    mutationMethodSignals: findSignals(root, checkedFiles, MUTATION_METHOD_SIGNALS),
    persistenceChangeSignals: findSignals(root, checkedFiles, PERSISTENCE_CHANGE_SIGNALS),
    databaseBindingChangeSignals: findSignals(root, checkedFiles, DATABASE_BINDING_CHANGE_SIGNALS),
    hostedGetOnlySignals: findSignals(root, checkedFiles, HOSTED_GET_ONLY_SIGNALS),
  };
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
