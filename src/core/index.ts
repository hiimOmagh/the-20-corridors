export {
  CORRIDORS_ENGINE_API_VERSION,
  getCorridorQuestions,
  normalizeCorridorAnswers,
  parseCorridorAnswerSequence,
  runCorridorsEngine
} from './engine';

export {
  CORRIDORS_RESULT_SERIALIZATION_VERSION,
  assertPublicResult,
  assertSerializedCorridorsResultEnvelope,
  buildSerializableCorridorsResult,
  createSerializedCorridorsResultEnvelope,
  deserializeCorridorsResult,
  serializeCorridorsResult,
  serializeCorridorsResultEnvelope,
  stableStringify
} from './serialization/resultSerialization';

export {
  CORRIDORS_GOLDEN_SNAPSHOT_VERSION,
  buildGoldenProfileSnapshotDocument,
  serializeGoldenProfileSnapshotDocument
} from './serialization/goldenSnapshots';

export type {
  CorridorsAnswerInput,
  CorridorsAnswerMap,
  CorridorsArchetypeDto,
  CorridorsArchetypeId,
  CorridorsAxisCardDto,
  CorridorsConfidenceBand,
  CorridorsContradictionCardDto,
  CorridorsContradictionId,
  CorridorsDominantTraitDto,
  CorridorsEvidenceReferenceDto,
  CorridorsOptionKey,
  CorridorsPublicReportDto,
  CorridorsPublicResultDto,
  CorridorsQuestionDto,
  CorridorsQuestionId,
  CorridorsQuestionOptionDto,
  CorridorsReportBulletDto,
  CorridorsRunnerUpDto,
  CorridorsSelectedAnswerDto,
  CorridorsTraitCode
} from './publicTypes';

export type {
  CorridorsResultSerializationVersion,
  SerializedCorridorsResultEnvelope
} from './serialization/resultSerialization';

export type {
  CorridorsGoldenProfileSnapshot,
  CorridorsGoldenSnapshotDocument,
  CorridorsGoldenSnapshotVersion
} from './serialization/goldenSnapshots';

export {
  PUBLIC_RESULT_DTO_ALLOWED_KEYS,
  PUBLIC_RESULT_DTO_FORBIDDEN_KEYS,
  PUBLIC_RESULT_DTO_SCHEMA_VERSION,
  assertPublicResultDtoMetadata,
  buildPublicResultDto,
  containsForbiddenPublicResultDtoKeys,
  findForbiddenPublicResultDtoKeys,
  listPublicResultDtoKeys
} from './public-link/publicResultDto';

export type {
  PublicResultAxisSummaryDto,
  PublicResultContradictionSummaryDto,
  PublicResultDto,
  PublicResultDtoMetadata,
  PublicResultDtoSchemaVersion,
  PublicResultShareCardDto,
  PublicResultTraitDto
} from './public-link/publicResultDto';
