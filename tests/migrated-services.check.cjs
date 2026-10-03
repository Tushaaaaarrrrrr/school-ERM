const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 1. Verify lib/services/api.ts migrations
const apiSource = fs.readFileSync(path.join(__dirname, '../lib/services/api.ts'), 'utf8');

function extractService(name) {
  const start = apiSource.indexOf(`export const ${name} = {`);
  assert(start !== -1, `Service ${name} not found in api.ts`);
  const end = apiSource.indexOf('};', start);
  assert(end !== -1, `End of service ${name} not found`);
  return apiSource.slice(start, end + 2);
}

const feeVersion = extractService('feeVersionService');
assert(feeVersion.includes('/api/fee-versions'));
assert(!feeVersion.includes('storageService'));

const bulkCharge = extractService('bulkChargeService');
assert(bulkCharge.includes('/api/bulk-charges'));
assert(!bulkCharge.includes('storageService'));

const sessionTransition = extractService('sessionTransitionService');
assert(sessionTransition.includes('/api/transition-batches'));
assert(!sessionTransition.includes('storageService'));

const recycleBin = extractService('recycleBinService');
assert(recycleBin.includes('/api/recycle-bin'));
assert(!recycleBin.includes('storageService'));

const deletion = extractService('deletionService');
assert(deletion.includes('/api/account-requests'));
assert(!deletion.includes('storageService'));

const safety = extractService('safetyService');
assert(safety.includes('/api/account-requests'));
assert(!safety.includes('storageService'));

// 2. Verify API routes exist and have proper HTTP handlers
const routes = [
  'app/api/fee-versions/route.ts',
  'app/api/bulk-charges/route.ts',
  'app/api/bulk-charges/[id]/route.ts',
  'app/api/transition-batches/route.ts',
  'app/api/transition-batches/[id]/route.ts',
  'app/api/recycle-bin/route.ts',
  'app/api/account-requests/route.ts',
  'app/api/account-requests/[id]/route.ts',
];

for (const r of routes) {
  assert(fs.existsSync(path.join(__dirname, '..', r)), `Route ${r} missing`);
}

// 3. Verify serverDb methods exist in lib/server/db.ts
const dbSource = fs.readFileSync(path.join(__dirname, '../lib/server/db.ts'), 'utf8');
const requiredMethods = [
  'getFeeVersions',
  'createFeeVersion',
  'updateClassFeeStructure',
  'getBulkChargeBatchs',
  'createBulkChargeBatch',
  'cancelBulkChargeBatch',
  'getTransitionSuggestions',
  'executeAcademicYearTransition',
  'canReverseTransition',
  'reverseAcademicYearTransition',
  'addToRecycleBin',
  'getRecycleBinItems',
  'restoreFromRecycleBin',
  'getAccountDeletionRequests',
  'createAccountDeletionRequest',
  'reviewAccountDeletionRequest',
  'suspendSchool',
  'restoreSchool',
  'scheduleSchoolDeletion',
  'cancelSchoolDeletion',
];

for (const method of requiredMethods) {
  assert(dbSource.includes(`async ${method}(`) || dbSource.includes(`${method}(`), `Method ${method} missing in db.ts`);
}

// Verify server-side isolation and blocker logic in db.ts
assert(dbSource.includes('(Number(c.paid_amount) || 0) > 0'), 'Bulk charge cancellation check missing paid_amount guard');
assert(dbSource.includes('Unauthorized access to recycle bin item'), 'Recycle bin tenant isolation check missing');
assert(dbSource.includes('A mandatory reason is required when rejecting an account deletion request.'), 'Deletion request review guard missing');

console.log('Migrated services and server database scoped logic checks passed');
