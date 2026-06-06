import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runPublicResultStorageContract } from '../src/core/release/publicResultStorageContract';

const report = runPublicResultStorageContract();
const outputPath = path.resolve('docs/evidence/public-result-storage-latest.json');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Public result storage contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Public result storage contract passed.');
  console.log(`Phase 5 closure: ${report.gates.phase5ClosurePassed ? 'passed' : 'failed'}.`);
  console.log(`Public DTO contract: ${report.gates.publicResultDtoContractPassed ? 'passed' : 'failed'}.`);
  console.log(`Storage adapter interface: ${report.gates.adapterInterfaceDefined ? 'defined' : 'missing'}.`);
  console.log(`Minimized DTO-only storage: ${report.gates.minimizedDtoOnlyStorage ? 'passed' : 'failed'}.`);
  console.log(`Default expiry days: ${report.storageContract.defaultExpiryDays}.`);
  console.log(`Blocked implementation artifacts: ${report.implementationScan.blockedPaths.length}; blocked signals: ${report.implementationScan.blockedSignals.length}.`);
  console.log(`Evidence written: ${outputPath}`);
}
