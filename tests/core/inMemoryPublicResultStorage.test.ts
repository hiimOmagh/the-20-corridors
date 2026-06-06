import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '../../src/core/engine';
import { createInMemoryPublicResultStorageAdapter } from '../../src/core/public-link/inMemoryPublicResultStorage';
import { buildPublicResultDto, type PublicResultDtoMetadata } from '../../src/core/public-link/publicResultDto';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash,
  containsForbiddenPublicResultStorageKeys,
  findForbiddenPublicResultStorageKeys,
  type PublicResultStorageCreateInput
} from '../../src/core/public-link/publicResultStorage';

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const PUBLIC_ID = 'pub_7Kf9sQ2mN8xR4vB6tY3cH1pZ';
const DELETE_TOKEN = 'tok_7Kf9sQ2mN8xR4vB6tY3cH1pZ_secret';

function buildCreateInput(overrides: Partial<PublicResultStorageCreateInput> = {}): PublicResultStorageCreateInput {
  const createdAt = '2026-06-06T00:00:00.000Z';
  const expiresAt = buildDefaultPublicResultExpiry(createdAt);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const metadata: PublicResultDtoMetadata = {
    resultId: PUBLIC_ID,
    createdAt,
    expiresAt,
    deleteTokenHash
  };
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), metadata);

  return {
    publicId: PUBLIC_ID,
    dto,
    createdAt,
    expiresAt,
    deleteTokenHash,
    ...overrides
  };
}

describe('in-memory public result storage adapter', () => {
  it('creates and reads minimized DTO-only public result records', async () => {
    const storage = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-06-07T00:00:00.000Z' });
    const created = await storage.create(buildCreateInput());
    const read = await storage.read(PUBLIC_ID);

    expect(created.publicId).toBe(PUBLIC_ID);
    expect(read.status).toBe('active');
    expect(read.record?.publicId).toBe(PUBLIC_ID);
    expect(read.record?.dto.resultId).toBe(PUBLIC_ID);
    expect(containsForbiddenPublicResultStorageKeys(read.record)).toBe(false);
    expect(storage.diagnostics()).toMatchObject({ recordCount: 1, publicIds: [PUBLIC_ID] });
  });

  it('refuses duplicate public ids', async () => {
    const storage = createInMemoryPublicResultStorageAdapter();
    await storage.create(buildCreateInput());
    await expect(storage.create(buildCreateInput())).rejects.toThrow('duplicate public ids');
  });

  it('marks records expired at read time without exposing private fields', async () => {
    const storage = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-07-10T00:00:00.000Z' });
    await storage.create(buildCreateInput());
    const read = await storage.read(PUBLIC_ID);

    expect(read.status).toBe('expired');
    expect(read.record?.status).toBe('expired');
    expect(findForbiddenPublicResultStorageKeys(read.record)).toEqual([]);
  });

  it('deletes only with the matching delete-token proof', async () => {
    const storage = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-06-07T00:00:00.000Z' });
    await storage.create(buildCreateInput());

    const wrongDelete = await storage.delete({ publicId: PUBLIC_ID, deleteToken: 'tok_wrongWrongWrongWrongWrongWrongWrong' });
    expect(wrongDelete.status).toBe('active');

    const deleted = await storage.delete({ publicId: PUBLIC_ID, deleteToken: DELETE_TOKEN });
    expect(deleted.status).toBe('deleted');

    const readDeleted = await storage.read(PUBLIC_ID);
    expect(readDeleted.status).toBe('deleted');
  });

  it('prunes expired and deleted records from memory only', async () => {
    const storage = createInMemoryPublicResultStorageAdapter({ nowIso: () => '2026-06-07T00:00:00.000Z' });
    await storage.create(buildCreateInput());
    await storage.delete({ publicId: PUBLIC_ID, deleteToken: DELETE_TOKEN });

    const pruneDeleted = await storage.pruneExpired('2026-06-08T00:00:00.000Z');
    expect(pruneDeleted.deletedCount).toBe(1);
    expect(await storage.read(PUBLIC_ID)).toEqual({ status: 'not-found', record: null });

    const laterId = 'pub_9Lf8sQ2mN8xR4vB6tY3cH9qR';
    const createdAt = '2026-06-06T00:00:00.000Z';
    const expiresAt = '2026-06-07T00:00:00.000Z';
    const deleteTokenHash = buildPublicResultDeleteTokenHash('tok_9Lf8sQ2mN8xR4vB6tY3cH9qR_secret');
    const metadata = { resultId: laterId, createdAt, expiresAt, deleteTokenHash };
    await storage.create({
      publicId: laterId,
      dto: buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), metadata),
      createdAt,
      expiresAt,
      deleteTokenHash
    });

    const pruneExpired = await storage.pruneExpired('2026-06-08T00:00:00.000Z');
    expect(pruneExpired.deletedCount).toBe(1);
    expect(await storage.read(laterId)).toEqual({ status: 'not-found', record: null });
  });
});
