import { constants } from "node:fs";
import {
  access,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const AGENT_ALIASES = Object.freeze({
  claude: "claude-code",
  gemini: "gemini-cli",
  agents: "generic",
});

export const AGENT_TARGETS = Object.freeze({
  codex: {
    label: "Codex",
    project: (cwd) => path.join(cwd, ".agents", "skills"),
    user: (homeDir) => path.join(homeDir, ".agents", "skills"),
  },
  "claude-code": {
    label: "Claude Code",
    project: (cwd) => path.join(cwd, ".claude", "skills"),
    user: (homeDir) => path.join(homeDir, ".claude", "skills"),
  },
  opencode: {
    label: "OpenCode",
    project: (cwd) => path.join(cwd, ".opencode", "skills"),
    user: (homeDir, env) =>
      path.join(env.XDG_CONFIG_HOME || path.join(homeDir, ".config"), "opencode", "skills"),
  },
  "gemini-cli": {
    label: "Gemini CLI",
    project: (cwd) => path.join(cwd, ".gemini", "skills"),
    user: (homeDir) => path.join(homeDir, ".gemini", "skills"),
  },
  generic: {
    label: "Agent Skills-compatible host",
    project: (cwd) => path.join(cwd, ".agents", "skills"),
    user: (homeDir) => path.join(homeDir, ".agents", "skills"),
  },
});

export class InstallerError extends Error {
  constructor(message, code = "INSTALLER_ERROR") {
    super(message);
    this.name = "InstallerError";
    this.code = code;
  }
}

export class ExistingSkillError extends InstallerError {
  constructor(targetPath) {
    super(
      `A skill is already installed at ${targetPath}. Re-run with --force to preserve it in a timestamped backup and install this version.`,
      "SKILL_EXISTS",
    );
  }
}

function expandHome(directory, homeDir) {
  if (directory === "~") {
    return homeDir;
  }

  if (directory.startsWith("~/") || directory.startsWith("~\\")) {
    return path.join(homeDir, directory.slice(2));
  }

  return directory;
}

function normalizeAgent(agent) {
  const normalized = String(agent || "").trim().toLowerCase();
  return AGENT_ALIASES[normalized] || normalized;
}

function normalizedScope(scope) {
  if (scope === "user" || scope === "project") {
    return scope;
  }

  throw new InstallerError("--scope must be either user or project.", "INVALID_SCOPE");
}

function destinationFor(destinationRoot, skillName) {
  const root = path.resolve(destinationRoot);
  const target = path.resolve(root, skillName);

  if (path.dirname(target) !== root) {
    throw new InstallerError("The destination must contain exactly one skill directory.", "INVALID_DESTINATION");
  }

  return target;
}

function sourceFor(sourceRoot, skillName) {
  if (!SKILL_NAME_PATTERN.test(skillName)) {
    throw new InstallerError(
      `Invalid skill name: ${skillName}. Use lowercase letters, numbers, and single hyphens only.`,
      "INVALID_SKILL_NAME",
    );
  }

  const skillsRoot = path.resolve(sourceRoot, "skills");
  const source = path.resolve(skillsRoot, skillName);

  if (path.dirname(source) !== skillsRoot) {
    throw new InstallerError("The requested skill is outside this package.", "INVALID_SKILL_NAME");
  }

  return source;
}

async function pathExists(targetPath) {
  try {
    await lstat(targetPath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function assertSkillSource(sourceRoot, skillName) {
  const source = sourceFor(sourceRoot, skillName);

  try {
    await access(path.join(source, "SKILL.md"), constants.R_OK);
  } catch {
    throw new InstallerError(
      `Skill "${skillName}" is not bundled in this package. Run the list command to see available skills.`,
      "SKILL_NOT_FOUND",
    );
  }

  return source;
}

async function targetsSameLocation(source, target) {
  if (path.resolve(source) === path.resolve(target)) {
    return true;
  }

  if (!(await pathExists(target))) {
    return false;
  }

  return (await realpath(source)) === (await realpath(target));
}

function backupName(target, suffix) {
  return `${target}.backup-${suffix}`;
}

async function availableBackupPath(target, suffix) {
  let candidate = backupName(target, suffix);
  let sequence = 1;

  while (await pathExists(candidate)) {
    candidate = `${backupName(target, suffix)}-${sequence}`;
    sequence += 1;
  }

  return candidate;
}

function timestampForBackup(now = new Date()) {
  return now.toISOString().replace(/[-:.TZ]/g, "");
}

export async function listSkills(sourceRoot) {
  const skillsRoot = path.resolve(sourceRoot, "skills");
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const skillNames = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !SKILL_NAME_PATTERN.test(entry.name)) {
      continue;
    }

    try {
      await access(path.join(skillsRoot, entry.name, "SKILL.md"), constants.R_OK);
      skillNames.push(entry.name);
    } catch {
      // Ignore directories that are not complete skills.
    }
  }

  return skillNames.sort((left, right) => left.localeCompare(right));
}

export function resolveInstallRoot({
  agent = "codex",
  scope = "user",
  directory,
  cwd = process.cwd(),
  homeDir = os.homedir(),
  env = process.env,
} = {}) {
  if (directory) {
    return path.resolve(cwd, expandHome(directory, homeDir));
  }

  const resolvedAgent = normalizeAgent(agent);
  const target = AGENT_TARGETS[resolvedAgent];

  if (!target) {
    const agents = Object.keys(AGENT_TARGETS).join(", ");
    throw new InstallerError(
      `Unsupported agent: ${agent}. Choose one of: ${agents}, or use --dir for a custom skills directory.`,
      "UNSUPPORTED_AGENT",
    );
  }

  const resolvedScope = normalizedScope(scope);
  const targetRoot =
    resolvedScope === "project"
      ? target.project(path.resolve(cwd))
      : target.user(path.resolve(homeDir), env);

  return path.resolve(targetRoot);
}

export function agentLabel(agent) {
  const resolvedAgent = normalizeAgent(agent);
  return AGENT_TARGETS[resolvedAgent]?.label || "custom destination";
}

export async function installSkill({
  sourceRoot,
  skillName,
  destinationRoot,
  force = false,
  now = new Date(),
} = {}) {
  if (!sourceRoot || !destinationRoot) {
    throw new InstallerError("A source root and destination root are required.", "MISSING_PATH");
  }

  const source = await assertSkillSource(sourceRoot, skillName);
  const root = path.resolve(destinationRoot);
  const target = destinationFor(root, skillName);

  if (await targetsSameLocation(source, target)) {
    throw new InstallerError(
      "The selected destination is the packaged source skill. Choose a different skills directory.",
      "SOURCE_DESTINATION_CONFLICT",
    );
  }

  await mkdir(root, { recursive: true });

  let backup;
  let stagingDirectory;

  try {
    if (await pathExists(target)) {
      if (!force) {
        throw new ExistingSkillError(target);
      }

      backup = await availableBackupPath(target, timestampForBackup(now));
      await rename(target, backup);
    }

    stagingDirectory = await mkdtemp(path.join(root, `.${skillName}.install-`));
    const stagedSkill = path.join(stagingDirectory, skillName);
    await cp(source, stagedSkill, {
      recursive: true,
      errorOnExist: true,
      force: false,
      verbatimSymlinks: true,
    });
    await rename(stagedSkill, target);

    return { backup, source, target };
  } catch (error) {
    if (backup && !(await pathExists(target))) {
      try {
        await rename(backup, target);
        backup = undefined;
      } catch (restoreError) {
        error.restoreError = restoreError;
      }
    }

    throw error;
  } finally {
    if (stagingDirectory) {
      await rm(stagingDirectory, { recursive: true, force: true }).catch(() => {});
    }
  }
}
