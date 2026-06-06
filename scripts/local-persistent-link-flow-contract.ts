import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runLocalPersistentLinkFlowContract } from '../src/core/release/localPersistentLinkFlowContract';

const report = await runLocalPersistentLinkFlowContract();
const outputPath = path.resolve('docs/evidence/local-persistent-link-flow-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Local persistent-link flow contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Local persistent-link flow contract passed.');
  console.log(`In-memory adapter: ${report.gates.inMemoryAdapterContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Lifecycle simulation: ${report.gates.createReadDeleteLifecyclePassed ? 'passed' : 'failed'}.`);
  console.log(`DTO-only storage: ${report.gates.dtoOnlyStoragePreserved ? 'passed' : 'failed'}.`);
  console.log(`No route/API/database: ${report.gates.noRouteApiDatabaseOrPersistentLookup ? 'passed' : 'failed'}.`);
  console.log(`Evidence written: ${outputPath}`);
}
