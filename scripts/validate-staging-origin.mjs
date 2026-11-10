import process from 'node:process';
import { resolveStagingOrigin } from './staging-origin.mjs';

const result = resolveStagingOrigin();
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : result.status === 'BLOCKED' ? 2 : 1;
