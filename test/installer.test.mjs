import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ExistingSkillError,
  InstallerError,
  installSkill,
  listSkills,
  resolveInstallRoot,
} from "../lib/installer.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("lists the bundled Product Challenger skill", async () => {
  assert.deepEqual(await listSkills(repositoryRoot), ["product-challenger"]);
});

test("provides a user guide for every bundled skill", async () => {
  const skills = await listSkills(repositoryRoot);

  await Promise.all(
    skills.map((skillName) => access(path.join(repositoryRoot, "howto", `${skillName}.md`))),
  );
});

test("keeps Claude Code and Codex marketplace metadata aligned", async () => {
  const readJson = async (...segments) =>
    JSON.parse(await readFile(path.join(repositoryRoot, ...segments), "utf8"));
  const packageManifest = await readJson("package.json");
  const claudeMarketplace = await readJson(".claude-plugin", "marketplace.json");
  const claudePlugin = await readJson(".claude-plugin", "plugin.json");
  const codexMarketplace = await readJson(".agents", "plugins", "marketplace.json");
  const codexPlugin = await readJson(".codex-plugin", "plugin.json");
  const [claudeEntry] = claudeMarketplace.plugins;
  const [codexEntry] = codexMarketplace.plugins;

  assert.equal(claudeMarketplace.name, "bolablg-skills");
  assert.equal(codexMarketplace.name, claudeMarketplace.name);
  assert.equal(claudeMarketplace.version, packageManifest.version);
  assert.equal(claudeEntry.name, "agent-skills-library");
  assert.equal(codexEntry.name, claudeEntry.name);
  assert.equal(claudeEntry.version, packageManifest.version);
  assert.equal(claudePlugin.name, claudeEntry.name);
  assert.equal(codexPlugin.name, claudeEntry.name);
  assert.equal(claudePlugin.version, packageManifest.version);
  assert.equal(codexPlugin.version, packageManifest.version);
  assert.equal(claudeEntry.source, "./");
  assert.deepEqual(codexEntry.source, { source: "local", path: "./" });
  assert.equal(codexPlugin.skills, "./skills/");
});

test("resolves documented user and project locations", () => {
  const homeDir = path.join(path.sep, "example", "home");
  const cwd = path.join(path.sep, "example", "project");
  const env = { XDG_CONFIG_HOME: path.join(path.sep, "example", "xdg") };

  assert.equal(
    resolveInstallRoot({ agent: "codex", scope: "user", homeDir, cwd, env }),
    path.join(homeDir, ".agents", "skills"),
  );
  assert.equal(
    resolveInstallRoot({ agent: "claude-code", scope: "project", homeDir, cwd, env }),
    path.join(cwd, ".claude", "skills"),
  );
  assert.equal(
    resolveInstallRoot({ agent: "opencode", scope: "user", homeDir, cwd, env }),
    path.join(env.XDG_CONFIG_HOME, "opencode", "skills"),
  );
  assert.equal(
    resolveInstallRoot({ agent: "gemini-cli", scope: "project", homeDir, cwd, env }),
    path.join(cwd, ".gemini", "skills"),
  );
});

test("uses a custom destination directory without requiring a known host", () => {
  const cwd = path.join(path.sep, "example", "project");
  const destination = resolveInstallRoot({
    agent: "future-agent",
    directory: "./host/skills",
    cwd,
  });

  assert.equal(destination, path.join(cwd, "host", "skills"));
});

test("installs safely and preserves an existing installation only with force", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "bolablg-skills-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  const destinationRoot = path.join(temporaryRoot, "agent-skills");
  const first = await installSkill({
    sourceRoot: repositoryRoot,
    skillName: "product-challenger",
    destinationRoot,
  });

  assert.equal(first.backup, undefined);
  assert.match(await readFile(path.join(first.target, "SKILL.md"), "utf8"), /name: product-challenger/);
  await access(path.join(first.target, "references", "release-sequencing.md"));

  await assert.rejects(
    installSkill({
      sourceRoot: repositoryRoot,
      skillName: "product-challenger",
      destinationRoot,
    }),
    ExistingSkillError,
  );

  const forced = await installSkill({
    sourceRoot: repositoryRoot,
    skillName: "product-challenger",
    destinationRoot,
    force: true,
    now: new Date("2026-08-03T12:34:56.000Z"),
  });

  assert.equal(
    forced.backup,
    path.join(destinationRoot, "product-challenger.backup-20260803123456000"),
  );
  await access(path.join(forced.backup, "SKILL.md"));
  await access(path.join(forced.target, "SKILL.md"));
});

test("rejects invalid skill names and source-destination conflicts", async () => {
  await assert.rejects(
    installSkill({
      sourceRoot: repositoryRoot,
      skillName: "../product-challenger",
      destinationRoot: path.join(os.tmpdir(), "unrelated-skills"),
    }),
    InstallerError,
  );

  await assert.rejects(
    installSkill({
      sourceRoot: repositoryRoot,
      skillName: "product-challenger",
      destinationRoot: path.join(repositoryRoot, "skills"),
    }),
    InstallerError,
  );
});
