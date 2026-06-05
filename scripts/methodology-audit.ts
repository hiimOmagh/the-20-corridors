import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { runMethodologyAudit } from '../src/core/audit/methodologyAudit';

const outputPath = resolve(process.cwd(), 'docs/evidence/methodology-audit-latest.json');
const report = runMethodologyAudit();
const serialized = `${JSON.stringify(report, null, 2)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialized, 'utf8');

const status = report.gates.overallPassed ? 'passed' : 'failed';
console.log(`Methodology audit ${status}.`);
console.log(`Profiles audited: ${report.metadata.goldenProfileCount} golden, ${report.metadata.edgeCaseProfileCount} edge-case.`);
console.log(`Triggered contradictions: ${report.coverage.triggeredContradictions.length}/${report.metadata.contradictionRuleCount}.`);
console.log(`Evidence written: ${outputPath}`);

if (!report.gates.overallPassed) {
  console.error(JSON.stringify(report.issues, null, 2));
  process.exitCode = 1;
}
