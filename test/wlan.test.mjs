import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p), 'utf8');
const json = async p => JSON.parse(await read(p));
const scopes = ['wlan:styles:read', 'wlan:drafts:read', 'wlan:drafts:write', 'wlan:requests:read', 'wlan:requests:write', 'user:org:read'];

test('Wlan packages preserve identities, versions and remote-only transports', async () => {
  const pkg = await json('package.json');
  for (const file of ['plugins/wlan/plugin.json', 'plugins/wlan/.codex-plugin/plugin.json', 'plugins/wlan/codex/.codex-plugin/plugin.json', 'plugins/wlan/.claude-plugin/plugin.json', 'plugins/wlan/gemini-extension.json', 'gemini-extension.json']) {
    const manifest = await json(file);
    assert.equal(manifest.name, 'wlan');
    assert.equal(manifest.version, pkg.version);
  }
  for (const [file, transport, urlKey] of [['plugins/wlan/.mcp.json', 'http', 'url'], ['plugins/wlan/codex/.mcp.json', 'http', 'url'], ['plugins/wlan/mcp.json', 'streamable-http', 'url'], ['gemini-extension.json', undefined, 'httpUrl']]) {
    const server = (await json(file)).mcpServers.wlan;
    assert.equal(server.type, transport);
    assert.equal(server[urlKey], 'https://wlan.iyanju.com/mcp');
    assert.equal(server.command, undefined);
    assert.equal(server.headers, undefined);
  }
  assert.deepEqual(Object.keys((await json('plugins/wlan/mcp.json')).mcpServers.wlan).sort(), ['type', 'url']);
  assert.deepEqual((await json('plugins/wlan/codex/.mcp.json')).mcpServers.wlan.scopes, scopes);
  assert.equal((await json('plugins/wlan/.mcp.json')).mcpServers.wlan.oauth.scopes, scopes.join(' '));
  for (const file of ['gemini-extension.json', 'plugins/wlan/gemini-extension.json']) {
    const oauth = (await json(file)).mcpServers.wlan.oauth;
    assert.equal(oauth.enabled, true);
    assert.deepEqual(oauth.scopes, [...scopes, 'offline_access']);
  }
  assert.equal((await json('plugins/wlan/codex/.codex-plugin/plugin.json')).mcpServers, './.mcp.json');
  await assert.rejects(read('plugins/wlan/codex/plugin.json'), { code: 'ENOENT' });
  const portable = await json('plugins/wlan/plugin.json');
  assert.equal(portable.extensions['com.openai'].interface.displayName, 'Wlan Studio');
});

test('legacy catalogs keep existing plugins while additive Iyanju catalogs expose wlan', async () => {
  for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) {
    const catalog = await json(file);
    assert.equal(catalog.name, 'bolablg');
    assert.ok(catalog.plugins.some(p => p.name === 'iyanju-agentory'));
    assert.ok(catalog.plugins.some(p => p.name === 'wlan'));
    if (file.startsWith('.agents/')) assert.equal(catalog.plugins.find(p => p.name === 'wlan').source.path, './plugins/wlan/codex');
  }
  for (const file of ['marketplaces/iyanju/.agents/plugins/marketplace.json', 'marketplaces/iyanju/.claude-plugin/marketplace.json']) {
    const catalog = await json(file);
    assert.equal(catalog.name, 'iyanju');
    assert.deepEqual(catalog.plugins.map(p => p.name), ['wlan']);
    assert.equal(catalog.plugins[0].source.url, 'https://github.com/bolablg/skills.git');
    assert.equal(catalog.plugins[0].source.ref, 'main');
    assert.equal(catalog.plugins[0].source.path.replace(/^\.\//, ''), file.includes('/.agents/') ? 'plugins/wlan/codex' : 'plugins/wlan');
  }
});

test('Wlan package contains only its declared files and portable Wlan instructions', async () => {
  const allowed = new Set(['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.mcp.json', 'mcp.json', 'plugin.json', 'gemini-extension.json', 'GEMINI.md', 'skills/wlan/SKILL.md', 'skills/wlan/agents/openai.yaml', 'skills/wlan/references/tool-contract.md', 'codex/.codex-plugin/plugin.json', 'codex/.mcp.json', 'codex/skills/wlan/SKILL.md', 'codex/skills/wlan/agents/openai.yaml', 'codex/skills/wlan/references/tool-contract.md']);
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
  for (const file of ['SKILL.md', 'agents/openai.yaml', 'references/tool-contract.md']) {
    assert.equal(await read(`skills/wlan/${file}`), await read(`plugins/wlan/skills/wlan/${file}`));
    assert.equal(await read(`skills/wlan/${file}`), await read(`plugins/wlan/codex/skills/wlan/${file}`));
  }
});
