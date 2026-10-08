import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const source = path.join(root, 'skills/wlan');
const destination = path.join(root, 'plugins/wlan/skills/wlan');
const files = [];
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative);
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Wlan source must not contain links: ${relative}`);
  }
}
await collect(source);
async function emit(relative, content) {
  const target = path.join(root, relative);
  if (check) {
    const current = await readFile(target, 'utf8').catch(() => null);
    if (current !== content) throw new Error(`Stale generated Wlan file: ${relative}; run npm run wlan:sync`);
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}
for (const file of files) {
  const content = await readFile(path.join(source, file), 'utf8');
  await emit(path.relative(root, path.join(destination, file)), content);
  await emit(`plugins/wlan/codex/skills/wlan/${file}`, content);
}
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const scopes = ['wlan:styles:read', 'wlan:drafts:read', 'wlan:drafts:write', 'wlan:requests:read', 'wlan:requests:write', 'user:org:read'];
const metadata = {
  name: 'wlan', version: pkg.version,
  description: 'Wlan Studio connects your assistant to authorized writing styles, drafts, and bounded rewrite requests in Wlan, your collaborative writing studio.',
  author: pkg.author, homepage: 'https://wlan.iyanju.com',
  repository: 'https://github.com/bolablg/skills', license: pkg.license,
  keywords: ['wlan-studio', 'writing', 'styles', 'drafts', 'rewrite', 'remote-mcp'],
};
const presentation = {
  displayName: 'Wlan Studio', shortDescription: 'Styles, drafts, and revisions',
  longDescription: metadata.description, developerName: pkg.author.name,
  category: 'Productivity', capabilities: ['Read', 'Write', 'Interactive'],
  websiteURL: metadata.homepage,
  defaultPrompt: ['Show my Wlan writing styles and recommend one for this draft.', 'Complete my queued Wlan rewrite using its chosen style, check it, and submit within the remaining revision budget.'],
};
await emit('plugins/wlan/plugin.json', json({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  ...metadata, extensions: { 'com.openai': { interface: presentation } },
}));
await emit('plugins/wlan/.codex-plugin/plugin.json', json({ ...metadata, skills: './skills/', mcpServers: './codex/.mcp.json', interface: presentation }));
await emit('plugins/wlan/codex/.codex-plugin/plugin.json', json({ ...metadata, skills: './skills/', mcpServers: './.mcp.json', interface: presentation }));
await emit('plugins/wlan/codex/.mcp.json', json({ mcpServers: { wlan: { type: 'http', url: 'https://wlan.iyanju.com/mcp', scopes } } }));
await emit('plugins/wlan/.claude-plugin/plugin.json', json(metadata));
await emit('plugins/wlan/mcp.json', json({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
  mcpServers: { wlan: { type: 'streamable-http', url: 'https://wlan.iyanju.com/mcp' } },
}));
await emit('plugins/wlan/.mcp.json', json({ mcpServers: { wlan: { type: 'http', url: 'https://wlan.iyanju.com/mcp', oauth: { scopes: scopes.join(' ') } } } }));
const gemini = json({ name: 'wlan', version: pkg.version, description: metadata.description,
  mcpServers: { wlan: { httpUrl: 'https://wlan.iyanju.com/mcp', oauth: { enabled: true, scopes: [...scopes, 'offline_access'] } } }, contextFileName: 'GEMINI.md' });
const context = '# Wlan Studio\n\nFor Wlan styles, drafts, or rewrites, load the bundled `skills/wlan/SKILL.md`\nand its `references/tool-contract.md`. Use the connected remote Wlan MCP tools.\nLet the host handle OAuth; the user signs in and explicitly approves a workspace\nin the browser. Never use a local Wlan daemon, pairing flow, or API key. Start\nwork from the connected chat; this extension does not wake an idle assistant.\n';
await emit('plugins/wlan/gemini-extension.json', gemini);
await emit('plugins/wlan/GEMINI.md', context);
await emit('gemini-extension.json', gemini);
await emit('GEMINI.md', context);
const remoteSource = { source: 'git-subdir', url: 'https://github.com/bolablg/skills.git', path: 'plugins/wlan', ref: 'main' };
await emit('marketplaces/iyanju/.agents/plugins/marketplace.json', json({ name: 'iyanju', interface: { displayName: 'Iyanju' }, plugins: [{ name: 'wlan', source: { ...remoteSource, path: './plugins/wlan/codex' }, policy: { installation: 'AVAILABLE', authentication: 'ON_USE' }, category: 'Productivity' }] }));
await emit('marketplaces/iyanju/.claude-plugin/marketplace.json', json({
  $schema: 'https://anthropic.com/claude-code/marketplace.schema.json',
  name: 'iyanju', version: pkg.version, owner: pkg.author,
  description: 'Iyanju integrations, including Wlan Studio.',
  plugins: [{ name: 'wlan', source: remoteSource, version: pkg.version, description: metadata.description, category: 'productivity' }],
}));
console.log(check ? 'Generated Wlan files are current.' : 'Generated Wlan packages and additive Iyanju catalogs.');
