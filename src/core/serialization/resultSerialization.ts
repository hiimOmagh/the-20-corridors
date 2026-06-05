import { runCorridorsEngine } from '../engine';
import {
  CORRIDORS_ENGINE_API_VERSION,
  type CorridorsAnswerInput,
  type CorridorsPublicResultDto
} from '../publicTypes';

export const CORRIDORS_RESULT_SERIALIZATION_VERSION = 'phase-1.6-result-serialization-v1' as const;

export type CorridorsResultSerializationVersion = typeof CORRIDORS_RESULT_SERIALIZATION_VERSION;

export interface SerializedCorridorsResultEnvelope {
  readonly serializationVersion: CorridorsResultSerializationVersion;
  readonly engineApiVersion: typeof CORRIDORS_ENGINE_API_VERSION;
  readonly result: CorridorsPublicResultDto;
}

export function buildSerializableCorridorsResult(input: CorridorsAnswerInput): SerializedCorridorsResultEnvelope {
  return createSerializedCorridorsResultEnvelope(runCorridorsEngine(input));
}

export function createSerializedCorridorsResultEnvelope(
  result: CorridorsPublicResultDto
): SerializedCorridorsResultEnvelope {
  assertPublicResultVersion(result);

  return {
    serializationVersion: CORRIDORS_RESULT_SERIALIZATION_VERSION,
    engineApiVersion: CORRIDORS_ENGINE_API_VERSION,
    result
  };
}

export function serializeCorridorsResult(result: CorridorsPublicResultDto): string {
  return stableStringify(createSerializedCorridorsResultEnvelope(result));
}

export function serializeCorridorsResultEnvelope(envelope: SerializedCorridorsResultEnvelope): string {
  assertSerializedCorridorsResultEnvelope(envelope);
  return stableStringify(envelope);
}

export function deserializeCorridorsResult(serialized: string): SerializedCorridorsResultEnvelope {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid serialized corridors result JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  assertSerializedCorridorsResultEnvelope(parsed);
  return parsed;
}

export function assertSerializedCorridorsResultEnvelope(
  value: unknown
): asserts value is SerializedCorridorsResultEnvelope {
  if (!isRecord(value)) {
    throw new Error('Serialized corridors result must be an object envelope.');
  }

  if (value.serializationVersion !== CORRIDORS_RESULT_SERIALIZATION_VERSION) {
    throw new Error(
      `Unsupported corridors result serialization version: ${String(value.serializationVersion ?? 'missing')}`
    );
  }

  if (value.engineApiVersion !== CORRIDORS_ENGINE_API_VERSION) {
    throw new Error(`Unsupported corridors engine API version: ${String(value.engineApiVersion ?? 'missing')}`);
  }

  assertPublicResult(value.result);
}

export function assertPublicResult(value: unknown): asserts value is CorridorsPublicResultDto {
  if (!isRecord(value)) {
    throw new Error('Corridors public result must be an object.');
  }

  if (value.schemaVersion !== CORRIDORS_ENGINE_API_VERSION) {
    throw new Error(`Unsupported public result schema version: ${String(value.schemaVersion ?? 'missing')}`);
  }

  if (value.apiVersion !== CORRIDORS_ENGINE_API_VERSION) {
    throw new Error(`Unsupported public result API version: ${String(value.apiVersion ?? 'missing')}`);
  }

  assertArrayLength(value.answers, 20, 'answers');
  assertRequiredRecord(value.archetype, 'archetype');
  assertRequiredRecord(value.runnerUp, 'runnerUp');
  assertArray(value.dominantTraits, 'dominantTraits');
  assertArrayLength(value.axes, 6, 'axes');
  assertArray(value.contradictions, 'contradictions');
  assertRequiredRecord(value.deepMotive, 'deepMotive');
  assertRequiredRecord(value.report, 'report');

  const report = value.report as Record<string, unknown>;
  assertRequiredRecord(report.overview, 'report.overview');
  assertArrayLength(report.axisCards, 6, 'report.axisCards');
  assertArray(report.contradictionMap, 'report.contradictionMap');
  assertArray(report.strengths, 'report.strengths');
  assertArray(report.failureModes, 'report.failureModes');
  assertArray(report.growthDirections, 'report.growthDirections');
  assertArray(report.disprovenIf, 'report.disprovenIf');
  assertArrayLength(report.evidenceDigest, 20, 'report.evidenceDigest');
}

export function stableStringify(value: unknown): string {
  return `${JSON.stringify(sortForStableJson(value), null, 2)}\n`;
}

function assertPublicResultVersion(result: CorridorsPublicResultDto): void {
  assertPublicResult(result);
}

function sortForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortForStableJson(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForStableJson(value[key])])
  );
}

function assertRequiredRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Serialized corridors result is missing object field: ${label}`);
  }
}

function assertArray(value: unknown, label: string): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Serialized corridors result is missing array field: ${label}`);
  }
}

function assertArrayLength(value: unknown, expectedLength: number, label: string): asserts value is readonly unknown[] {
  assertArray(value, label);

  if (value.length !== expectedLength) {
    throw new Error(`Serialized corridors result field ${label} must contain ${expectedLength} items.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
