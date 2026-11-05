// Public build/write/close contract: packages/rolldown/tests/build-api/build-api.test.ts.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(path.resolve(process.argv[2], 'package.json'));
const { rolldown } = await import(pathToFileURL(require.resolve('rolldown')));
const manifest = require('rolldown/package.json');
assert.equal(manifest.dependencies['@oxc-project/types'], '0.157.0');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'hub-rolldown-'));
try {
  await fs.writeFile(path.join(directory, 'entry.ts'), 'import { number } from "virtual:config"; export const result: number = number + 2; export const lazy = () => import("./lazy.ts");');
  await fs.writeFile(path.join(directory, 'lazy.ts'), 'export default 41;');
  let closed = false;
  const bundle = await rolldown({
    input: path.join(directory, 'entry.ts'),
    plugins: [{ name: 'hub-contract', resolveId(id) { if (id === 'virtual:config') return '\0config'; },
      load(id) { if (id === '\0config') return 'export const number = 40;'; },
      closeBundle() { closed = true; } }],
  });
  for (const format of ['esm', 'cjs']) {
    const output = path.join(directory, format);
    const suffix = format === 'esm' ? 'mjs' : 'cjs';
    const built = await bundle.write({ dir: output, format, entryFileNames: `entry.${suffix}`, chunkFileNames: `[name]-[hash].${suffix}`, sourcemap: true });
    assert.ok(built.output.some(chunk => chunk.type === 'chunk' && !chunk.isEntry), 'dynamic import must produce a chunk');
    const entry = await import(pathToFileURL(path.join(output, `entry.${suffix}`)));
    assert.equal(entry.result, 42);
    assert.equal((await entry.lazy()).default, 41);
    const map = JSON.parse(await fs.readFile(path.join(output, `entry.${suffix}.map`), 'utf8'));
    assert.ok(map.sources.some(source => source.endsWith('entry.ts')));
  }
  await bundle.close();
  assert.ok(closed, 'closeBundle hook');
  console.log(JSON.stringify({ ok: true, types: '0.157.0', esm: true, cjs: true, splitting: true, plugins: true, sourcemaps: true }));
} finally { await fs.rm(directory, { recursive: true, force: true }); }
