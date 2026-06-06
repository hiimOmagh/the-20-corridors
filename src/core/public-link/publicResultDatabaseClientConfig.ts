import { DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION } from "./databasePublicResultStorage";

export const PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION =
  "phase-8.3-database-client-configuration-contract-v1" as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_PHASE =
  "phase-8.3-database-client-configuration-contract" as const;
export const PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE =
  "server-only-env-contract-no-client-instantiation" as const;

export const PUBLIC_RESULT_DATABASE_URL_ENV =
  "PUBLIC_RESULT_DATABASE_URL" as const;
export const PUBLIC_RESULT_DATABASE_PROVIDER_ENV =
  "PUBLIC_RESULT_DATABASE_PROVIDER" as const;
export const PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV =
  "PUBLIC_RESULT_DATABASE_SCHEMA_VERSION" as const;
export const PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV =
  "PUBLIC_RESULT_DATABASE_SERVICE_KEY" as const;

export const NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL_ENV =
  "NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL" as const;
export const NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER_ENV =
  "NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER" as const;
export const NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV =
  "NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION" as const;
export const NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV =
  "NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY" as const;

export const PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS = [
  PUBLIC_RESULT_DATABASE_URL_ENV,
  PUBLIC_RESULT_DATABASE_PROVIDER_ENV,
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV,
] as const;

export const PUBLIC_RESULT_DATABASE_OPTIONAL_SERVER_ONLY_ENV_KEYS = [
  PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
] as const;

export const PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS = [
  ...PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
  ...PUBLIC_RESULT_DATABASE_OPTIONAL_SERVER_ONLY_ENV_KEYS,
] as const;

export const PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS = [
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL_ENV,
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER_ENV,
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV,
  NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV,
] as const;

export const PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS = [
  "postgresql",
] as const;

export const PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_RULES = [
  "database-client-config-is-contract-only",
  "database-env-names-are-centralized",
  "database-env-access-is-server-only",
  "client-exposed-database-env-vars-are-blocked",
  "database-url-shape-is-validated-without-creating-a-client",
  "database-provider-is-validated-without-creating-a-client",
  "database-record-schema-version-is-validated",
  "database-service-key-shape-is-validated-without-creating-a-client",
  "database-client-creation-remains-blocked",
  "no-database-sdk-import-or-migration-is-introduced",
] as const;

export type PublicResultDatabaseProvider =
  (typeof PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS)[number];
export type PublicResultDatabaseClientConfigStatus =
  | "configured-contract-only"
  | "blocked";
export type PublicResultDatabaseClientConfigValueStatus =
  | "configured-valid-contract-only"
  | "configured-contract-only"
  | "not-configured-contract-only"
  | "missing"
  | "invalid";

export interface PublicResultDatabaseClientConfigEnvironment {
  readonly [key: string]: string | undefined;
  readonly [PUBLIC_RESULT_DATABASE_URL_ENV]?: string;
  readonly [PUBLIC_RESULT_DATABASE_PROVIDER_ENV]?: string;
  readonly [PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV]?: string;
  readonly [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]?: string;
  readonly [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL_ENV]?: string;
  readonly [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER_ENV]?: string;
  readonly [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV]?: string;
  readonly [NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]?: string;
}

export interface PublicResultDatabaseClientConfigContract {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_PHASE;
  readonly configMode: typeof PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE;
  readonly status: PublicResultDatabaseClientConfigStatus;
  readonly provider: PublicResultDatabaseProvider | "unset" | "unsupported";
  readonly databaseUrlStatus: PublicResultDatabaseClientConfigValueStatus;
  readonly providerStatus: PublicResultDatabaseClientConfigValueStatus;
  readonly recordSchemaVersionStatus: PublicResultDatabaseClientConfigValueStatus;
  readonly serviceKeyStatus: PublicResultDatabaseClientConfigValueStatus;
  readonly databaseClientCreationAllowed: false;
  readonly routeBindingAllowed: false;
  readonly serverOnly: true;
  readonly requiredDatabaseEnvKeys: readonly string[];
  readonly optionalServerOnlyDatabaseEnvKeys: readonly string[];
  readonly serverOnlyDatabaseEnvKeys: readonly string[];
  readonly forbiddenPublicDatabaseEnvKeys: readonly string[];
  readonly configuredDatabaseEnvKeys: readonly string[];
  readonly missingDatabaseEnvKeys: readonly string[];
  readonly configuredForbiddenPublicDatabaseEnvKeys: readonly string[];
  readonly issues: readonly string[];
}

export function resolvePublicResultDatabaseClientConfigContract(
  env: PublicResultDatabaseClientConfigEnvironment = process.env,
): PublicResultDatabaseClientConfigContract {
  const requiredValues = PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS.map(
    (key) => [key, normalizeOptionalEnvValue(env[key])] as const,
  );
  const optionalValues =
    PUBLIC_RESULT_DATABASE_OPTIONAL_SERVER_ONLY_ENV_KEYS.map(
      (key) => [key, normalizeOptionalEnvValue(env[key])] as const,
    );
  const missingDatabaseEnvKeys = requiredValues
    .filter(([, value]) => value === undefined)
    .map(([key]) => key);
  const configuredDatabaseEnvKeys = [...requiredValues, ...optionalValues]
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
  const configuredForbiddenPublicDatabaseEnvKeys =
    PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS.filter(
      (key) => normalizeOptionalEnvValue(env[key]) !== undefined,
    );

  const databaseUrl = normalizeOptionalEnvValue(
    env[PUBLIC_RESULT_DATABASE_URL_ENV],
  );
  const provider = normalizeOptionalEnvValue(
    env[PUBLIC_RESULT_DATABASE_PROVIDER_ENV],
  );
  const recordSchemaVersion = normalizeOptionalEnvValue(
    env[PUBLIC_RESULT_DATABASE_SCHEMA_VERSION_ENV],
  );
  const serviceKey = normalizeOptionalEnvValue(
    env[PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV],
  );

  const databaseUrlStatus = valueStatus(
    databaseUrl,
    isValidDatabaseUrl(databaseUrl),
  );
  const providerStatus = valueStatus(provider, isSupportedProvider(provider));
  const recordSchemaVersionStatus = valueStatus(
    recordSchemaVersion,
    recordSchemaVersion ===
      DATABASE_PUBLIC_RESULT_STORAGE_RECORD_SCHEMA_VERSION,
  );
  const serviceKeyStatus =
    serviceKey === undefined
      ? "not-configured-contract-only"
      : valueStatus(serviceKey, isValidServiceKey(serviceKey));

  const issues = [
    ...missingDatabaseEnvKeys.map((key) => `missing_database_env:${key}`),
    ...configuredForbiddenPublicDatabaseEnvKeys.map(
      (key) => `forbidden_public_database_env:${key}`,
    ),
    ...(databaseUrl !== undefined && databaseUrlStatus === "invalid"
      ? [`invalid_database_url:${PUBLIC_RESULT_DATABASE_URL_ENV}`]
      : []),
    ...(provider !== undefined && providerStatus === "invalid"
      ? [`unsupported_database_provider:${provider}`]
      : []),
    ...(recordSchemaVersion !== undefined &&
    recordSchemaVersionStatus === "invalid"
      ? [`database_schema_version_mismatch:${recordSchemaVersion}`]
      : []),
    ...(serviceKey !== undefined && serviceKeyStatus === "invalid"
      ? [
          `invalid_database_service_key:${PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV}`,
        ]
      : []),
  ];

  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_PHASE,
    configMode: PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE,
    status: issues.length === 0 ? "configured-contract-only" : "blocked",
    provider:
      provider === undefined
        ? "unset"
        : isSupportedProvider(provider)
          ? provider
          : "unsupported",
    databaseUrlStatus,
    providerStatus,
    recordSchemaVersionStatus,
    serviceKeyStatus,
    databaseClientCreationAllowed: false,
    routeBindingAllowed: false,
    serverOnly: true,
    requiredDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_REQUIRED_ENV_KEYS,
    optionalServerOnlyDatabaseEnvKeys:
      PUBLIC_RESULT_DATABASE_OPTIONAL_SERVER_ONLY_ENV_KEYS,
    serverOnlyDatabaseEnvKeys: PUBLIC_RESULT_DATABASE_SERVER_ONLY_ENV_KEYS,
    forbiddenPublicDatabaseEnvKeys:
      PUBLIC_RESULT_DATABASE_FORBIDDEN_PUBLIC_ENV_KEYS,
    configuredDatabaseEnvKeys,
    missingDatabaseEnvKeys,
    configuredForbiddenPublicDatabaseEnvKeys,
    issues,
  };
}

export function assertPublicResultDatabaseClientConfigContractOnly(
  config: PublicResultDatabaseClientConfigContract,
): asserts config is PublicResultDatabaseClientConfigContract & {
  readonly status: "configured-contract-only";
  readonly databaseClientCreationAllowed: false;
  readonly routeBindingAllowed: false;
} {
  if (
    config.status !== "configured-contract-only" ||
    config.databaseClientCreationAllowed ||
    config.routeBindingAllowed
  ) {
    throw new Error(
      `Public result database client configuration failed closed: ${config.issues.join(", ") || config.status}`,
    );
  }
}

export function summarizePublicResultDatabaseClientConfigRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_PHASE}`,
    `schema:${PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_MODE}`,
    ...PUBLIC_RESULT_DATABASE_CLIENT_CONFIG_RULES,
  ];
}

function normalizeOptionalEnvValue(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function valueStatus(
  value: string | undefined,
  valid: boolean,
): PublicResultDatabaseClientConfigValueStatus {
  if (value === undefined) return "missing";
  return valid ? "configured-valid-contract-only" : "invalid";
}

function isSupportedProvider(
  value: string | undefined,
): value is PublicResultDatabaseProvider {
  return PUBLIC_RESULT_DATABASE_SUPPORTED_PROVIDERS.some(
    (provider) => provider === value,
  );
}

function isValidDatabaseUrl(value: string | undefined): boolean {
  if (value === undefined) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
  } catch {
    return false;
  }
}

function isValidServiceKey(value: string | undefined): boolean {
  return value !== undefined && value.length >= 16;
}
