import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { runPhase2Readiness } from '../src/core/release/phase2Readiness';

const outputPath = resolve(process.cwd(), 'docs/evidence/phase2-readiness-latest.json');
const report = runPhase2Readiness();
const serialized = `${JSON.stringify(report, null, 2)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialized, 'utf8');

const status = report.gates.overallPassed ? 'passed' : 'failed';
console.log(`Phase 2 readiness gate ${status}.`);
console.log(`Engine release gate: ${report.gates.engineReleaseGatePassed ? 'passed' : 'failed'}.`);
console.log(`Contract docs ready: ${report.gates.uiReadinessContractExists ? 'yes' : 'no'}.`);
console.log(`Public API boundary ready: ${report.gates.publicCoreEntrypointExists ? 'yes' : 'no'}.`);
console.log(`Backend/AI still blocked in transition plan: ${report.gates.transitionKeepsBackendAiBlocked ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${outputPath}`);

if (!report.gates.overallPassed) {
  console.error(JSON.stringify(report.issues, null, 2));
  process.exitCode = 1;
}
