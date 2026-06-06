import path from 'node:path';
import {
  runDatabaseSdkSelectionDecisionRecord,
  writeDatabaseSdkSelectionDecisionRecordEvidence
} from '../src/core/release/databaseSdkSelectionDecisionRecord';

const report = await runDatabaseSdkSelectionDecisionRecord();
const evidencePath = path.join(process.cwd(), 'docs/evidence/database-sdk-selection-decision-record-latest.json');
writeDatabaseSdkSelectionDecisionRecordEvidence(report, evidencePath);

if (!report.gates.overallPassed) {
  console.error('Database SDK selection decision record failed.');
  for (const issue of report.issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Database SDK selection decision record passed.');
console.log(`Database client config contract: ${report.gates.databaseClientConfigContractPassed ? 'passed' : 'failed'}.`);
console.log(`Selected provider: ${report.decision.selectedProvider}.`);
console.log(`Selected SDK: ${report.decision.selectedSdkName}.`);
console.log(`SDK installed: ${report.implementationScan.installedDatabasePackages.length === 0 ? 'no' : 'yes'}.`);
console.log(`SDK imported: ${report.implementationScan.importedDatabaseSdkSignals.length === 0 ? 'no' : 'yes'}.`);
console.log(`Database client creation allowed: ${report.decision.databaseClientCreationAllowed ? 'yes' : 'no'}.`);
console.log(`Route binding allowed: ${report.decision.routeBindingAllowed ? 'yes' : 'no'}.`);
console.log(`Evidence written: ${path.relative(process.cwd(), evidencePath)}`);
