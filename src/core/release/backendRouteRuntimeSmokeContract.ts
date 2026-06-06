import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildPublicResultCreateRequestDto, buildPublicResultDeleteRequestDto, containsForbiddenPublicResultApiPayloadKeys, PUBLIC_RESULT_API_SCHEMA_VERSION, type PublicResultApiErrorResponseDto, type PublicResultReadResponseDto } from '../public-link/publicResultApi';
import { buildPublicResultDto } from '../public-link/publicResultDto';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE, PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION } from '../public-link/publicResultRouteHandlers';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../public-link/publicResultStorage';
import { runBackendRouteHandlersContract } from './backendRouteHandlersContract';
import { POST } from '../../app/api/public-results/route';
import { GET, DELETE } from '../../app/api/public-results/[publicId]/route';

export const BACKEND_ROUTE_RUNTIME_SMOKE_SCHEMA_VERSION = 'phase-7.4-backend-route-runtime-smoke-v1' as const;
export const BACKEND_ROUTE_RUNTIME_SMOKE_ID = 'phase-7-backend-route-runtime-smoke-contract' as const;

export interface BackendRouteRuntimeSmokeReport {
  readonly schemaVersion: typeof BACKEND_ROUTE_RUNTIME_SMOKE_SCHEMA_VERSION;
  readonly contractId: typeof BACKEND_ROUTE_RUNTIME_SMOKE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-7-backend-route-runtime-smoke-contract';
    readonly routeHandlersSchemaVersion: typeof PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
    readonly backendRouteHandlersContractSchemaVersion: string;
  };
  readonly gates: Record<string, boolean> & { readonly overallPassed: boolean };
  readonly scripts: { readonly validate: string; readonly runtimeSmoke: string | undefined; readonly backendRouteHandlers: string | undefined };
  readonly docs: { readonly runtimeSmokeContract: string; readonly phase74Status: string; readonly phase7ClosureCriteria: string };
  readonly routes: { readonly collectionRouteFile: string; readonly itemRouteFile: string; readonly approvedRouteCount: number; readonly helperSignals: readonly string[] };
  readonly runtimeFlow: { readonly createStatus: number; readonly readStatus: number; readonly wrongDeleteStatus: number; readonly deleteStatus: number; readonly readAfterDeleteStatus: number; readonly malformedCreateStatus: number; readonly unknownReadStatus: number; readonly createHeaderMode: string | null; readonly readHeaderMode: string | null; readonly deleteHeaderMode: string | null };
  readonly responseSafety: { readonly createKeys: readonly string[]; readonly readKeys: readonly string[]; readonly deleteKeys: readonly string[]; readonly createIncludesDeleteToken: boolean; readonly readIncludesDeleteToken: boolean; readonly deleteIncludesDeleteToken: boolean; readonly readAfterDeleteDtoIsNull: boolean };
  readonly implementationScan: { readonly checkedFiles: readonly string[]; readonly blockedImplementationSignals: readonly string[]; readonly rawOrFullResultSignals: readonly string[]; readonly persistentPublicLookupRouteFiles: readonly string[]; readonly missingContractPhrases: readonly string[] };
  readonly coverage: { readonly backendRouteHandlersIssueCount: number; readonly runtimeStatusCodeCount: number; readonly checkedFileCount: number; readonly routeFileCount: number };
  readonly issues: readonly string[];
}

const COLLECTION_ROUTE_FILE = 'src/app/api/public-results/route.ts';
const ITEM_ROUTE_FILE = 'src/app/api/public-results/[publicId]/route.ts';
const RUNTIME_SMOKE_CONTRACT_DOC = 'docs/release/phase-7-backend-route-runtime-smoke-contract.md';
const PHASE_7_4_STATUS_DOC = 'docs/ui/phase-7-4-backend-route-runtime-smoke-contract-status.md';
const PHASE_7_CLOSURE_CRITERIA_DOC = 'docs/release/phase-7-closure-criteria.md';
const CHECKED_FILES = [COLLECTION_ROUTE_FILE, ITEM_ROUTE_FILE, 'src/core/public-link/publicResultRouteHandlers.ts', 'src/core/public-link/publicResultHandlerDryRun.ts', 'src/core/public-link/publicResultApi.ts', RUNTIME_SMOKE_CONTRACT_DOC, PHASE_7_4_STATUS_DOC, PHASE_7_CLOSURE_CRITERIA_DOC] as const;
const ROUTE_HELPER_SIGNALS = ['handlePublicResultCreateRouteBody', 'handlePublicResultReadRoute', 'handlePublicResultDeleteRouteBody'] as const;
const BLOCKED = ['@supabase','createClient(','new PrismaClient','drizzle(','mongoose.connect','database.write','db.insert','db.select','OpenAI(','generateText(','streamText(','@stripe','stripe.checkout','auth(','signIn(','signOut(','posthog.capture','analytics.track','localStorage.setItem','indexedDB.open'] as const;
const RAW = ['raw'+'Answers','question'+'Answers','selected'+'Answer','answer'+'Text','question'+'Id','tag'+'Scores','axis'+'ScoresRaw','private'+'ReportSeed','session'+'StorageEnvelope','evidence'+'Digest','evidence'+'Refs','serializeCorridorsResult','SerializedCorridorsResultEnvelope'] as const;
const PERSISTENT = ['src/app/r/[resultId]','src/app/r/[publicId]','src/app/r/[slug]','src/app/results/[resultId]'] as const;
const REQUIRED = ['actual route files and route helpers stay aligned','API route status mapping','DTO-only route responses','no raw answers or full-result transport','no database, auth, payment, AI, or analytics','in-memory adapter only','Phase 7 closure criteria'] as const;
let sequence = 0;

export async function runBackendRouteRuntimeSmokeContract({ repoRoot = process.cwd() }: { readonly repoRoot?: string } = {}): Promise<BackendRouteRuntimeSmokeReport> {
  const root = path.resolve(repoRoot);
  const pkg = JSON.parse(read(root, 'package.json') || '{}') as { scripts?: Record<string,string> };
  const validate = pkg.scripts?.validate ?? '';
  const routeHandlers = await runBackendRouteHandlersContract({ repoRoot: root });
  const source = CHECKED_FILES.map((f) => read(root, f)).join('\n');
  const routeSource = [COLLECTION_ROUTE_FILE, ITEM_ROUTE_FILE].map((f) => read(root, f)).join('\n');
  const doc = read(root, RUNTIME_SMOKE_CONTRACT_DOC);
  const flow = await runtimeFlow();
  const helperSignals = find(routeSource, ROUTE_HELPER_SIGNALS);
  const blocked = find(source, BLOCKED);
  const raw = find(source, RAW);
  const persistent = PERSISTENT.filter((p) => existsSync(path.join(root, p)));
  const missing = REQUIRED.filter((p) => !doc.includes(p));
  const readAfterDelete = flow.readAfterDelete.body as Partial<PublicResultReadResponseDto>;
  const gates = {
    backendRouteHandlersContractPassed: routeHandlers.gates.overallPassed,
    runtimeSmokeScriptExists: pkg.scripts?.['smoke:backend-routes'] === 'tsx scripts/backend-route-runtime-smoke-contract.ts',
    validateScriptRunsRuntimeSmoke: validate.includes('npm run smoke:backend-routes'),
    runtimeSmokeContractDocExists: existsSync(path.join(root, RUNTIME_SMOKE_CONTRACT_DOC)),
    phase74StatusDocExists: existsSync(path.join(root, PHASE_7_4_STATUS_DOC)),
    phase7ClosureCriteriaDocExists: existsSync(path.join(root, PHASE_7_CLOSURE_CRITERIA_DOC)),
    actualRouteFilesExist: existsSync(path.join(root, COLLECTION_ROUTE_FILE)) && existsSync(path.join(root, ITEM_ROUTE_FILE)),
    routeFilesUseRouteHelperLayer: helperSignals.join('|') === ROUTE_HELPER_SIGNALS.join('|'),
    createReadDeleteRuntimeFlowPassed: flow.create.status === 201 && flow.read.status === 200 && flow.wrongDelete.status === 403 && flow.deleteResult.status === 200 && flow.readAfterDelete.status === 410,
    statusMappingPreserved: flow.malformedCreate.status === 400 && flow.unknownRead.status === 404 && flow.wrongDelete.status === 403 && flow.readAfterDelete.status === 410,
    dtoOnlyRuntimeResponsesPreserved: ![flow.create.body, flow.read.body, flow.deleteResult.body, flow.readAfterDelete.body].some(containsForbiddenPublicResultApiPayloadKeys),
    deleteTokenTransportPreserved: has(flow.create.body,'deleteToken') && !has(flow.read.body,'deleteToken') && !has(flow.deleteResult.body,'deleteToken') && !has(flow.readAfterDelete.body,'deleteToken'),
    responseHeadersPreserveDryRunMode: flow.create.modeHeader === PUBLIC_RESULT_ROUTE_HANDLERS_MODE && flow.read.modeHeader === PUBLIC_RESULT_ROUTE_HANDLERS_MODE && flow.deleteResult.modeHeader === PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
    malformedCreateHandled: flow.malformedCreate.status === 400 && errorCode(flow.malformedCreate.body,'invalid-request'),
    unknownReadHandled: flow.unknownRead.status === 404 && readStatus(flow.unknownRead.body,'not-found'),
    noRawAnswerOrFullResultTransport: raw.length === 0,
    noDatabaseAuthPaymentAiAnalyticsImplementation: blocked.length === 0,
    noPersistentPublicLookupRoute: persistent.length === 0,
    routeRuntimeSmokePreparesPhase7Closure: missing.length === 0,
    overallPassed: false
  };
  const complete = { ...gates, overallPassed: Object.entries(gates).filter(([k]) => k !== 'overallPassed').every(([,v]) => v === true) };
  const issues = Object.entries(complete).filter(([k,v]) => k !== 'overallPassed' && !v).map(([k]) => k).concat(missing.map((m) => `missing_contract_phrase:${m}`));
  return {
    schemaVersion: BACKEND_ROUTE_RUNTIME_SMOKE_SCHEMA_VERSION,
    contractId: BACKEND_ROUTE_RUNTIME_SMOKE_ID,
    metadata: { checkedAt: 'static', repoRootName: path.basename(root) || 'repository', phaseScope: 'phase-7-backend-route-runtime-smoke-contract', routeHandlersSchemaVersion: PUBLIC_RESULT_ROUTE_HANDLERS_SCHEMA_VERSION, routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE, backendRouteHandlersContractSchemaVersion: routeHandlers.schemaVersion },
    gates: complete,
    scripts: { validate, runtimeSmoke: pkg.scripts?.['smoke:backend-routes'], backendRouteHandlers: pkg.scripts?.['routes:backend-handlers'] },
    docs: { runtimeSmokeContract: RUNTIME_SMOKE_CONTRACT_DOC, phase74Status: PHASE_7_4_STATUS_DOC, phase7ClosureCriteria: PHASE_7_CLOSURE_CRITERIA_DOC },
    routes: { collectionRouteFile: COLLECTION_ROUTE_FILE, itemRouteFile: ITEM_ROUTE_FILE, approvedRouteCount: 2, helperSignals },
    runtimeFlow: { createStatus: flow.create.status, readStatus: flow.read.status, wrongDeleteStatus: flow.wrongDelete.status, deleteStatus: flow.deleteResult.status, readAfterDeleteStatus: flow.readAfterDelete.status, malformedCreateStatus: flow.malformedCreate.status, unknownReadStatus: flow.unknownRead.status, createHeaderMode: flow.create.modeHeader, readHeaderMode: flow.read.modeHeader, deleteHeaderMode: flow.deleteResult.modeHeader },
    responseSafety: { createKeys: keys(flow.create.body), readKeys: keys(flow.read.body), deleteKeys: keys(flow.deleteResult.body), createIncludesDeleteToken: has(flow.create.body,'deleteToken'), readIncludesDeleteToken: has(flow.read.body,'deleteToken'), deleteIncludesDeleteToken: has(flow.deleteResult.body,'deleteToken'), readAfterDeleteDtoIsNull: readAfterDelete.dto === null },
    implementationScan: { checkedFiles: CHECKED_FILES, blockedImplementationSignals: blocked, rawOrFullResultSignals: raw, persistentPublicLookupRouteFiles: persistent, missingContractPhrases: missing },
    coverage: { backendRouteHandlersIssueCount: routeHandlers.issues.length, runtimeStatusCodeCount: 7, checkedFileCount: CHECKED_FILES.length, routeFileCount: 2 },
    issues
  };
}

export function writeBackendRouteRuntimeSmokeContractEvidence(report: BackendRouteRuntimeSmokeReport, outputPath = 'docs/evidence/backend-route-runtime-smoke-latest.json'): void { mkdirSync(path.dirname(outputPath), { recursive: true }); writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`); }

async function runtimeFlow() {
  sequence += 1;
  const publicId = `pub_RuntimeSmoke_${String(sequence).padStart(4,'0')}_A1b2C3d4E5f6G7h8`;
  const createdAt = '2026-06-06T12:00:00.000Z';
  const deleteToken = 'delete_RuntimeSmokeToken_1234567890_ABCDEFG';
  const dto = buildPublicResultDto(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'), { resultId: publicId, createdAt, expiresAt: buildDefaultPublicResultExpiry(createdAt), deleteTokenHash: buildPublicResultDeleteTokenHash(deleteToken) });
  const create = await callPost({ ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_7_4'), deleteToken });
  const read = await callGet(publicId);
  const wrongDelete = await callDelete(publicId, buildPublicResultDeleteRequestDto(publicId, 'delete_RuntimeSmokeWrong_1234567890_ABCDEFG'));
  const deleteResult = await callDelete(publicId, buildPublicResultDeleteRequestDto(publicId, deleteToken));
  const readAfterDelete = await callGet(publicId);
  const malformedCreate = await callPost({ schemaVersion: PUBLIC_RESULT_API_SCHEMA_VERSION, rawAnswers: ['A'] });
  const unknownRead = await callGet('pub_RuntimeSmoke_NotFound_A1b2C3d4E5f6G7h8');
  return { create, read, wrongDelete, deleteResult, readAfterDelete, malformedCreate, unknownRead };
}
async function callPost(body: unknown) { const r = await POST(req('http://localhost/api/public-results','POST',body) as never) as Response; return rec(r); }
async function callGet(publicId: string) { const r = await GET(req(`http://localhost/api/public-results/${publicId}`,'GET',null) as never, { params: Promise.resolve({ publicId }) }) as Response; return rec(r); }
async function callDelete(publicId: string, body: unknown) { const r = await DELETE(req(`http://localhost/api/public-results/${publicId}`,'DELETE',body) as never, { params: Promise.resolve({ publicId }) }) as Response; return rec(r); }
function req(url: string, method: string, body: unknown): Request { return new Request(url, { method, headers: { 'content-type': 'application/json' }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) }); }
async function rec(response: Response) { return { status: response.status, body: await response.json(), modeHeader: response.headers.get('x-20c-route-mode') }; }
function read(root: string, rel: string) { const p = path.join(root, rel); return existsSync(p) ? readFileSync(p, 'utf8') : ''; }
function find(src: string, signals: readonly string[]) { return signals.filter((s) => src.includes(s)); }
function keys(v: unknown) { return typeof v === 'object' && v ? Object.keys(v).sort() : []; }
function has(v: unknown, key: string) { return typeof v === 'object' && v !== null && Object.prototype.hasOwnProperty.call(v, key); }
function errorCode(v: unknown, code: PublicResultApiErrorResponseDto['code']) { return typeof v === 'object' && v !== null && (v as { code?: string }).code === code; }
function readStatus(v: unknown, status: PublicResultReadResponseDto['status']) { return typeof v === 'object' && v !== null && (v as { status?: string }).status === status; }
