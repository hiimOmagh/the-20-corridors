import { writeFileSync } from 'node:fs';
import { runPublicResultDtoContract } from '../src/core/release/publicResultDtoContract';

const report = runPublicResultDtoContract();
writeFileSync('docs/evidence/public-result-dto-latest.json', `${JSON.stringify(report, null, 2)}\n`);

if (!report.gates.overallPassed) {
  console.error('Public result DTO contract failed.');
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Public result DTO builder contract passed.');
console.log(`Allowed public keys: ${report.coverage.allowedKeyCount}.`);
console.log(`Forbidden private keys: ${report.coverage.forbiddenKeyCount}.`);
console.log(`Sample DTO size: ${report.dtoContract.sampleSerializedBytes} bytes.`);
console.log('Evidence written: docs/evidence/public-result-dto-latest.json');
