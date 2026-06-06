import { describe, expect, it } from 'vitest';
import {
  runPublicResultDatabaseAdapterActivationDryRun,
  summarizePublicResultDatabaseAdapterActivationDryRunRules
} from '../../src/core/public-link/publicResultDatabaseAdapterActivationDryRun';

const result = await runPublicResultDatabaseAdapterActivationDryRun();

describe('database adapter activation dry-run', () => {
  it('selects the database adapter in a controlled simulation only', () => {
    expect(result).toMatchObject({
      schemaVersion: 'phase-8.9-database-adapter-activation-dry-run-gate-v1',
      phase: 'phase-8.9-database-adapter-activation-dry-run-gate',
      mode: 'activation-simulation-only-no-route-binding',
      status: 'database-adapter-selected-dry-run',
      requestedFactoryStatus: 'database-factory-contract-only',
      dryRunAdapterCreated: true,
      dryRunExecutorUsed: true,
      factoryDatabaseAdapterCreated: false,
      factoryRouteBindingAllowed: false,
      routeBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      sqlMutationExecuted: false
    });
    expect(result.issues).toEqual([]);
  });

  it('exercises adapter create/read/delete/prune without missing query intents', () => {
    expect(result).toMatchObject({
      createStatus: 'active',
      readStatus: 'active',
      deleteStatus: 'deleted',
      pruneDeletedCount: 1,
      missingQueryIntents: []
    });
    expect(new Set(result.uniqueObservedQueryIntents)).toEqual(
      new Set([
        'insert-public-result-record',
        'read-active-public-result-by-public-id',
        'verify-delete-token-hash-for-public-id',
        'soft-delete-public-result-by-public-id',
        'mark-expired-public-results',
        'prune-deleted-or-expired-public-results'
      ])
    );
    expect(result.observedQueryIntents.length).toBeGreaterThanOrEqual(result.expectedQueryIntents.length);
  });

  it('summarizes the activation dry-run rules', () => {
    expect(summarizePublicResultDatabaseAdapterActivationDryRunRules()).toContain(
      'database-adapter-can-be-selected-in-controlled-simulation'
    );
    expect(summarizePublicResultDatabaseAdapterActivationDryRunRules()).toContain('factory-route-binding-remains-disabled');
  });
});
