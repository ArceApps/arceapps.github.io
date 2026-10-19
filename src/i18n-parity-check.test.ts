import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const SCRIPT = path.resolve(__dirname, '..', 'scripts/i18n-parity-check.ts');

describe('i18n parity check', () => {
  it(
    'runs without MISMATCH on the current repo',
    () => {
      // The script exits 0 only when there are no MISMATCH findings.
      // We assert exit 0 here, knowing that during early development of
      // this feature the repo may have a known MISMATCH. When that
      // happens, the implementer must rename the file as part of the
      // feature before this test is required to pass.
      let output = '';
      try {
        output = execSync(`npx tsx ${SCRIPT}`, { encoding: 'utf8' });
      } catch (e: unknown) {
        const err = e as { stdout?: string; stderr?: string; status?: number };
        throw new Error(
          `i18n-parity-check failed.\nstdout: ${err.stdout ?? ''}\nstderr: ${err.stderr ?? ''}`,
        );
      }
      expect(output).toMatch(/OK: i18n parity check passed/);
    },
    30000,
  );
});
