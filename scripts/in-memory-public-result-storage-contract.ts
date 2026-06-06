import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runInMemoryPublicResultStorageContract } from '../src/core/release/inMemoryPublicResultStorageContract';

const report = await runInMemoryPublicResultStorageContract();
const outputPath = path.resolve('docs/evidence/in-memory-public-result-storage-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('In-memory public result storage contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('In-memory public result storage contract passed.');
  console.log(`Public storage contract: ${report.gates.publicStorageContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Create/read/delete/prune flow: ${report.gates.createReadDeletePruneFlowPassed ? 'passed' : 'failed'}.`);
  console.log(`DTO-only records: ${report.gates.dtoOnlyRecordsPreserved ? 'passed' : 'failed'}.`);
  console.log(`Persistent route guard: ${report.gates.noPersistentPublicRouteYet ? 'passed' : 'failed'}.`);
  console.log(`Evidence written: ${outputPath}`);
}
