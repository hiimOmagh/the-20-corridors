import {
  buildPublicResultStorageRecord,
  doesDeleteTokenMatchHash,
  isSafeAnonymousPublicResultId,
  resolvePublicResultStorageStatus,
  type PublicResultDeleteRequest,
  type PublicResultStorageAdapter,
  type PublicResultStorageCreateInput,
  type PublicResultStorageReadResult,
  type PublicResultStorageRecord
} from './publicResultStorage';

export const IN_MEMORY_PUBLIC_RESULT_STORAGE_PHASE = 'phase-6.1-in-memory-public-result-storage-adapter' as const;

export interface InMemoryPublicResultStorageOptions {
  readonly nowIso?: () => string;
  readonly initialRecords?: readonly PublicResultStorageRecord[];
}

export interface InMemoryPublicResultStorageDiagnostics {
  readonly phase: typeof IN_MEMORY_PUBLIC_RESULT_STORAGE_PHASE;
  readonly recordCount: number;
  readonly publicIds: readonly string[];
}

export function createInMemoryPublicResultStorageAdapter(
  options: InMemoryPublicResultStorageOptions = {}
): PublicResultStorageAdapter & { readonly diagnostics: () => InMemoryPublicResultStorageDiagnostics } {
  const nowIso = options.nowIso ?? (() => new Date().toISOString());
  const records = new Map<string, PublicResultStorageRecord>();

  for (const record of options.initialRecords ?? []) {
    records.set(record.publicId, cloneRecord(record));
  }

  return {
    create: async (input: PublicResultStorageCreateInput): Promise<PublicResultStorageRecord> => {
      const record = buildPublicResultStorageRecord(input);
      if (records.has(record.publicId)) {
        throw new Error('In-memory public result storage refuses duplicate public ids.');
      }
      records.set(record.publicId, cloneRecord(record));
      return cloneRecord(record);
    },

    read: async (publicId: string): Promise<PublicResultStorageReadResult> => {
      if (!isSafeAnonymousPublicResultId(publicId)) return { status: 'not-found', record: null };
      const record = records.get(publicId);
      if (!record) return { status: 'not-found', record: null };

      const status = resolvePublicResultStorageStatus(record, nowIso());
      const resolvedRecord = status === record.status ? record : { ...record, status };
      if (status !== record.status) records.set(publicId, cloneRecord(resolvedRecord));

      return { status, record: cloneRecord(resolvedRecord) };
    },

    delete: async (request: PublicResultDeleteRequest): Promise<PublicResultStorageReadResult> => {
      const current = await thisRead(records, request.publicId, nowIso());
      if (!current.record) return current;
      if (!doesDeleteTokenMatchHash(request.deleteToken, current.record.deleteTokenHash)) return current;

      const deletedRecord: PublicResultStorageRecord = { ...current.record, status: 'deleted' };
      records.set(request.publicId, cloneRecord(deletedRecord));
      return { status: 'deleted', record: cloneRecord(deletedRecord) };
    },

    pruneExpired: async (pruneNowIso: string): Promise<{ readonly deletedCount: number }> => {
      let deletedCount = 0;
      for (const [publicId, record] of records.entries()) {
        const status = resolvePublicResultStorageStatus(record, pruneNowIso);
        if (status === 'expired' || status === 'deleted') {
          records.delete(publicId);
          deletedCount += 1;
        }
      }
      return { deletedCount };
    },

    diagnostics: (): InMemoryPublicResultStorageDiagnostics => ({
      phase: IN_MEMORY_PUBLIC_RESULT_STORAGE_PHASE,
      recordCount: records.size,
      publicIds: [...records.keys()].sort()
    })
  };
}

async function thisRead(
  records: Map<string, PublicResultStorageRecord>,
  publicId: string,
  nowIso: string
): Promise<PublicResultStorageReadResult> {
  if (!isSafeAnonymousPublicResultId(publicId)) return { status: 'not-found', record: null };
  const record = records.get(publicId);
  if (!record) return { status: 'not-found', record: null };
  const status = resolvePublicResultStorageStatus(record, nowIso);
  const resolvedRecord = status === record.status ? record : { ...record, status };
  if (status !== record.status) records.set(publicId, cloneRecord(resolvedRecord));
  return { status, record: cloneRecord(resolvedRecord) };
}

function cloneRecord(record: PublicResultStorageRecord): PublicResultStorageRecord {
  return JSON.parse(JSON.stringify(record)) as PublicResultStorageRecord;
}
