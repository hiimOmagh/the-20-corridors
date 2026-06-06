import { createInMemoryPublicResultStorageAdapter } from './inMemoryPublicResultStorage';
import { DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND } from './databasePublicResultStorage';
import type { PublicResultStorageAdapter } from './publicResultStorage';
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND,
  PUBLIC_RESULT_STORAGE_MEMORY_MODE,
  PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND,
  PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
  resolvePublicResultStorageRuntimeSelection,
  type PublicResultStorageRuntimeEnvironment,
  type PublicResultStorageRuntimeSelection
} from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION =
  'phase-8.2-database-adapter-factory-contract-v1' as const;
export const PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE = 'phase-8.2-database-adapter-factory-contract' as const;
export const PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE =
  'memory-default-database-contract-only-no-route-binding' as const;

export type PublicResultStorageAdapterFactoryPurpose = 'route-handler' | 'contract-check';
export type PublicResultStorageAdapterFactoryStatus =
  | 'memory-adapter-created'
  | 'database-factory-contract-only'
  | 'factory-blocked';

export interface PublicResultStorageAdapterFactoryOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly memoryAdapter?: PublicResultStorageAdapter;
  readonly purpose?: PublicResultStorageAdapterFactoryPurpose;
}

export interface PublicResultStorageAdapterFactoryDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE;
  readonly factoryMode: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE;
  readonly purpose: PublicResultStorageAdapterFactoryPurpose;
  readonly runtimeSelectionSchemaVersion: typeof PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION;
  readonly runtimeSelection: PublicResultStorageRuntimeSelection;
  readonly requestedMode: PublicResultStorageRuntimeSelection['requestedMode'];
  readonly effectiveMode: PublicResultStorageRuntimeSelection['effectiveMode'];
  readonly status: PublicResultStorageAdapterFactoryStatus;
  readonly adapterKind:
    | typeof PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND
    | typeof DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND
    | typeof PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND;
  readonly adapterCreated: boolean;
  readonly memoryAdapterCreated: boolean;
  readonly databaseAdapterCreated: boolean;
  readonly routeBindingAllowed: boolean;
  readonly databaseClientAllowed: boolean;
  readonly factoryImplemented: true;
  readonly failClosed: boolean;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_RULES = [
  'factory-exists-before-real-database-client',
  'memory-mode-creates-in-memory-adapter',
  'unset-mode-creates-in-memory-adapter',
  'database-mode-is-contract-only',
  'database-mode-does-not-create-real-adapter',
  'database-mode-cannot-bind-to-route-handlers',
  'missing-database-env-fails-closed-through-runtime-selection',
  'invalid-storage-mode-fails-closed-through-runtime-selection',
  'client-exposed-database-env-remains-blocked',
  'no-supabase-prisma-drizzle-or-migration-client-in-factory-phase'
] as const;

export function resolvePublicResultStorageAdapterFactoryDecision(
  options: PublicResultStorageAdapterFactoryOptions = {}
): PublicResultStorageAdapterFactoryDecision {
  const purpose = options.purpose ?? 'route-handler';
  const runtimeSelection = resolvePublicResultStorageRuntimeSelection(options.env);

  if (
    runtimeSelection.status === 'memory-selected' &&
    runtimeSelection.effectiveMode === PUBLIC_RESULT_STORAGE_MEMORY_MODE &&
    runtimeSelection.routeBindingAllowed
  ) {
    return {
      schemaVersion: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE,
      factoryMode: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
      purpose,
      runtimeSelectionSchemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      runtimeSelection,
      requestedMode: runtimeSelection.requestedMode,
      effectiveMode: runtimeSelection.effectiveMode,
      status: 'memory-adapter-created',
      adapterKind: PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND,
      adapterCreated: true,
      memoryAdapterCreated: true,
      databaseAdapterCreated: false,
      routeBindingAllowed: true,
      databaseClientAllowed: false,
      factoryImplemented: true,
      failClosed: false,
      issues: []
    };
  }

  if (
    runtimeSelection.status === 'database-configured-contract-only' &&
    runtimeSelection.effectiveMode === PUBLIC_RESULT_STORAGE_DATABASE_MODE
  ) {
    return {
      schemaVersion: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
      phase: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE,
      factoryMode: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
      purpose,
      runtimeSelectionSchemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
      runtimeSelection,
      requestedMode: runtimeSelection.requestedMode,
      effectiveMode: runtimeSelection.effectiveMode,
      status: 'database-factory-contract-only',
      adapterKind: DATABASE_PUBLIC_RESULT_STORAGE_ADAPTER_KIND,
      adapterCreated: false,
      memoryAdapterCreated: false,
      databaseAdapterCreated: false,
      routeBindingAllowed: false,
      databaseClientAllowed: false,
      factoryImplemented: true,
      failClosed: true,
      issues: ['database_adapter_factory_contract_only_route_binding_blocked']
    };
  }

  return {
    schemaVersion: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE,
    factoryMode: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE,
    purpose,
    runtimeSelectionSchemaVersion: PUBLIC_RESULT_STORAGE_RUNTIME_SELECTION_SCHEMA_VERSION,
    runtimeSelection,
    requestedMode: runtimeSelection.requestedMode,
    effectiveMode: runtimeSelection.effectiveMode,
    status: 'factory-blocked',
    adapterKind: PUBLIC_RESULT_STORAGE_NO_ADAPTER_KIND,
    adapterCreated: false,
    memoryAdapterCreated: false,
    databaseAdapterCreated: false,
    routeBindingAllowed: false,
    databaseClientAllowed: false,
    factoryImplemented: true,
    failClosed: true,
    issues: [...runtimeSelection.issues, `runtime_selection_status:${runtimeSelection.status}`]
  };
}

export function createPublicResultStorageAdapterFromFactory(
  options: PublicResultStorageAdapterFactoryOptions = {}
): PublicResultStorageAdapter {
  const decision = resolvePublicResultStorageAdapterFactoryDecision(options);
  if (decision.status !== 'memory-adapter-created' || !decision.routeBindingAllowed) {
    throw new Error(`Public result storage adapter factory failed closed: ${decision.issues.join(', ') || decision.status}`);
  }

  return options.memoryAdapter ?? createInMemoryPublicResultStorageAdapter();
}

export function assertPublicResultStorageAdapterFactoryRouteBindingAllowed(
  decision: PublicResultStorageAdapterFactoryDecision
): asserts decision is PublicResultStorageAdapterFactoryDecision & {
  readonly status: 'memory-adapter-created';
  readonly routeBindingAllowed: true;
  readonly adapterKind: typeof PUBLIC_RESULT_STORAGE_MEMORY_ADAPTER_KIND;
} {
  if (decision.status !== 'memory-adapter-created' || !decision.routeBindingAllowed) {
    throw new Error(`Public result route adapter factory binding is blocked: ${decision.issues.join(', ') || decision.status}`);
  }
}

export function summarizePublicResultStorageAdapterFactoryRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE}`,
    `schema:${PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_MODE}`,
    ...PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_RULES
  ];
}
