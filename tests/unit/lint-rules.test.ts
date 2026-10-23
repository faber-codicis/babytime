import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const cwd = fileURLToPath(new URL('../..', import.meta.url));
const eslint = new ESLint({ cwd });

/** Rule ids ESLint reports for `code` as if it lived in `filePath`. */
async function ruleIds(code: string, filePath = 'src/probe.tsx'): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result!.messages.map((m) => m.ruleId ?? 'parse-error');
}

describe('lint rules from spec 13.3', () => {
  it('flags innerHTML, outerHTML, document.write, eval, new Function, string timers', async () => {
    expect(await ruleIds("document.body.innerHTML = 'x';")).toContain('no-restricted-properties');
    expect(await ruleIds("document.body.outerHTML = 'x';")).toContain('no-restricted-properties');
    expect(await ruleIds("document.write('x');")).toContain('no-restricted-properties');
    expect(await ruleIds("eval('1');")).toContain('no-eval');
    expect(await ruleIds("export const f = new Function('return 1');")).toContain('no-new-func');
    expect(await ruleIds("setTimeout('alert(1)', 10);")).toContain('no-implied-eval');
  });

  it('flags dangerouslySetInnerHTML in JSX', async () => {
    expect(await ruleIds("export const a = <div dangerouslySetInnerHTML={{ __html: 'x' }} />;")).toContain('no-restricted-syntax');
  });

  it('keeps the UI away from Dexie (spec 5)', async () => {
    expect(await ruleIds("import Dexie from 'dexie';\nexport const d = Dexie;", 'src/views/Probe.tsx')).toContain('no-restricted-imports');
    expect(await ruleIds("import { db } from '../data/db';\nexport const d = db;", 'src/ui/Probe.tsx')).toContain('no-restricted-imports');
  });

  it('accepts ordinary code', async () => {
    expect(await ruleIds('export const sum = (a: number, b: number) => a + b;')).toEqual([]);
  });
}, 30_000);
