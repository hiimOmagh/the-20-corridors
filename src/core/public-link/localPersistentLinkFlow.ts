import type { CorridorsPublicResultDto } from '../publicTypes';
import { buildPublicResultDto, type PublicResultDto } from './publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash,
  type PublicResultStorageAdapter,
  type PublicResultStorageReadResult,
  type PublicResultStorageRecord
} from './publicResultStorage';

export const LOCAL_PERSISTENT_LINK_FLOW_PHASE = 'phase-6.2-local-persistent-link-flow-stub' as const;
export const LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE = '/r/preview' as const;

export interface LocalPersistentLinkFlowCreateInput {
  readonly sourceResult: CorridorsPublicResultDto;
  readonly publicId: string;
  readonly deleteToken: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface LocalPersistentLinkFlowCreateResult {
  readonly phase: typeof LOCAL_PERSISTENT_LINK_FLOW_PHASE;
  readonly publicId: string;
  readonly previewRoute: typeof LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE;
  readonly dto: PublicResultDto;
  readonly record: PublicResultStorageRecord;
  readonly deleteToken: string;
  readonly deleteTokenHash: string;
  readonly lifecycleNote: string;
}

export interface LocalPersistentLinkFlowLifecycleResult {
  readonly phase: typeof LOCAL_PERSISTENT_LINK_FLOW_PHASE;
  readonly previewRoute: typeof LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE;
  readonly created: LocalPersistentLinkFlowCreateResult;
  readonly readAfterCreate: PublicResultStorageReadResult;
  readonly wrongDeleteAttempt: PublicResultStorageReadResult;
  readonly deleteResult: PublicResultStorageReadResult;
  readonly readAfterDelete: PublicResultStorageReadResult;
  readonly pruneResult: { readonly deletedCount: number };
  readonly rawAnswerLeakageCount: number;
  readonly fullResultLeakageCount: number;
}

const RAW_ANSWER_KEYS = [
  'answer' + 's',
  'raw' + 'Answers',
  'question' + 'Answers',
  'selected' + 'Answer',
  'answer' + 'Text',
  'question' + 'Id'
] as const;

const FULL_RESULT_INTERNAL_KEYS = [
  'tag' + 'Scores',
  'axis' + 'ScoresRaw',
  'private' + 'ReportSeed',
  'session' + 'StorageEnvelope',
  'evidence' + 'Digest',
  'evidence' + 'Refs'
] as const;

export async function createLocalPersistentLinkFlowResult(
  adapter: PublicResultStorageAdapter,
  input: LocalPersistentLinkFlowCreateInput
): Promise<LocalPersistentLinkFlowCreateResult> {
  const deleteTokenHash = buildPublicResultDeleteTokenHash(input.deleteToken);
  const expiresAt = input.expiresAt ?? buildDefaultPublicResultExpiry(input.createdAt);
  const dto = buildPublicResultDto(input.sourceResult, {
    resultId: input.publicId,
    createdAt: input.createdAt,
    expiresAt,
    deleteTokenHash
  });

  const record = await adapter.create({
    publicId: input.publicId,
    dto,
    createdAt: input.createdAt,
    expiresAt,
    deleteTokenHash
  });

  return {
    phase: LOCAL_PERSISTENT_LINK_FLOW_PHASE,
    publicId: input.publicId,
    previewRoute: LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE,
    dto,
    record,
    deleteToken: input.deleteToken,
    deleteTokenHash,
    lifecycleNote: 'Local flow stub only: in-memory adapter, minimized DTO, no API route, no database, no persistent public lookup.'
  };
}

export async function runLocalPersistentLinkFlowLifecycle(
  adapter: PublicResultStorageAdapter,
  input: LocalPersistentLinkFlowCreateInput,
  wrongDeleteToken: string,
  pruneNowIso: string
): Promise<LocalPersistentLinkFlowLifecycleResult> {
  const created = await createLocalPersistentLinkFlowResult(adapter, input);
  const readAfterCreate = await adapter.read(input.publicId);
  const wrongDeleteAttempt = await adapter.delete({ publicId: input.publicId, deleteToken: wrongDeleteToken });
  const deleteResult = await adapter.delete({ publicId: input.publicId, deleteToken: input.deleteToken });
  const readAfterDelete = await adapter.read(input.publicId);
  const pruneResult = await adapter.pruneExpired(pruneNowIso);

  return {
    phase: LOCAL_PERSISTENT_LINK_FLOW_PHASE,
    previewRoute: LOCAL_PERSISTENT_LINK_PREVIEW_ROUTE,
    created,
    readAfterCreate,
    wrongDeleteAttempt,
    deleteResult,
    readAfterDelete,
    pruneResult,
    rawAnswerLeakageCount: countSignals(created.record, RAW_ANSWER_KEYS),
    fullResultLeakageCount: countSignals(created.record, FULL_RESULT_INTERNAL_KEYS)
  };
}

export function buildLocalPersistentLinkFlowSummary(result: LocalPersistentLinkFlowLifecycleResult): readonly string[] {
  return [
    `phase:${result.phase}`,
    `previewRoute:${result.previewRoute}`,
    `created:${result.created.record.status}`,
    `readAfterCreate:${result.readAfterCreate.status}`,
    `wrongDelete:${result.wrongDeleteAttempt.status}`,
    `delete:${result.deleteResult.status}`,
    `readAfterDelete:${result.readAfterDelete.status}`,
    `pruned:${result.pruneResult.deletedCount}`,
    `rawLeaks:${result.rawAnswerLeakageCount}`,
    `fullResultLeaks:${result.fullResultLeakageCount}`
  ];
}

function countSignals(value: unknown, signals: readonly string[]): number {
  const serialized = JSON.stringify(value);
  return signals.filter((signal) => serialized.includes(signal)).length;
}
