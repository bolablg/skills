import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p), 'utf8');
const json = async p => JSON.parse(await read(p));

test('Wlan packages preserve identities, versions and remote-only transports', async () => {
  const pkg = await json('package.json');
  for (const file of ['plugins/wlan/plugin.json', 'plugins/wlan/.codex-plugin/plugin.json', 'plugins/wlan/.claude-plugin/plugin.json', 'plugins/wlan/gemini-extension.json', 'gemini-extension.json']) {
    const manifest = await json(file);
    assert.equal(manifest.name, 'wlan');
    assert.equal(manifest.version, pkg.version);
  }
  for (const [file, transport, urlKey] of [['plugins/wlan/.mcp.json', 'http', 'url'], ['plugins/wlan/mcp.json', 'streamable-http', 'url'], ['gemini-extension.json', undefined, 'httpUrl']]) {
    const server = (await json(file)).mcpServers.wlan;
    assert.equal(server.type, transport);
    assert.equal(server[urlKey], 'https://wlan.iyanju.com/mcp');
    assert.deepEqual(Object.keys(server).sort(), transport ? ['type', 'url'] : ['httpUrl']);
  }
  const portable = await json('plugins/wlan/plugin.json');
  assert.equal(portable.extensions['com.openai'].interface.displayName, 'Wlan Studio');
});

test('legacy catalogs keep existing plugins while additive Iyanju catalogs expose wlan', async () => {
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) {
    const catalog = await json(file);
    assert.equal(catalog.name, 'bolablg');
    assert.ok(catalog.plugins.some(p => p.name === 'iyanju-agentory'));
    assert.ok(catalog.plugins.some(p => p.name === 'wlan'));
  }
  for (const file of ['marketplaces/iyanju/.agents/plugins/marketplace.json', 'marketplaces/iyanju/.claude-plugin/marketplace.json']) {
    const catalog = await json(file);
    assert.equal(catalog.name, 'iyanju');
    assert.deepEqual(catalog.plugins.map(p => p.name), ['wlan']);
    assert.equal(catalog.plugins[0].source.url, 'https://github.com/bolablg/skills.git');
    assert.equal(catalog.plugins[0].source.ref, 'main');
  }
});

test('Wlan package contains only its declared files and portable Wlan instructions', async () => {
  const allowed = new Set(['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.mcp.json', 'mcp.json', 'plugin.json', 'gemini-extension.json', 'GEMINI.md', 'skills/wlan/SKILL.md', 'skills/wlan/agents/openai.yaml', 'skills/wlan/references/tool-contract.md']);
  const seen = [];
  async function walk(directory, prefix = '') {
    for (const entry of await readdir(directory)) {
      const relative = prefix ? `${prefix}/${entry}` : entry;
      const location = path.join(directory, entry);
      const stat = await lstat(location);
      assert.ok(!stat.isSymbolicLink(), `Distribution must be self-contained: ${relative}`);
      if (stat.isDirectory()) await walk(location, relative);
      else { assert.ok(allowed.has(relative), `Unexpected package file: ${relative}`); seen.push(relative); }
    }
  }
  await walk(path.join(root, 'plugins/wlan'));
  assert.equal(seen.length, allowed.size);
  for (const file of ['SKILL.md', 'agents/openai.yaml', 'references/tool-contract.md']) assert.equal(await read(`skills/wlan/${file}`), await read(`plugins/wlan/skills/wlan/${file}`));
});
