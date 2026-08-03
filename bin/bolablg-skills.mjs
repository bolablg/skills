#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  InstallerError,
  agentLabel,
  installSkill,
  listSkills,
  resolveInstallRoot,
} from "../lib/installer.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const usage = `Usage:
  bolablg-skills list
  bolablg-skills install <skill> [--agent <agent>] [--scope user|project]
                                [--dir <skills-directory>] [--force]

Examples:
  npx @bolablg/skills install product-challenger --agent codex --scope user
  npx @bolablg/skills install product-challenger --agent claude-code --scope project
  npx @bolablg/skills install product-challenger --dir ./custom-agent/skills

Supported agents:
  codex, claude-code, opencode, gemini-cli, generic

Notes:
  --dir overrides the agent and scope locations. It is the parent skills directory.
  Existing skills are never overwritten unless --force is passed; --force first
  moves the old directory to a timestamped backup next to the new installation.`;

function requireValue(tokens, index, flag) {
  const value = tokens[index + 1];

  if (!value || value.startsWith("--")) {
    throw new InstallerError(`${flag} needs a value.`, "MISSING_OPTION_VALUE");
  }

  return value;
}

function parseInstallArguments(tokens) {
  const options = {
    agent: "codex",
    force: false,
    scope: "user",
  };
  let skillName;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === "--force") {
      options.force = true;
      continue;
    }

    if (token === "--agent" || token === "--scope" || token === "--dir") {
      const value = requireValue(tokens, index, token);
      options[token.slice(2)] = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--agent=")) {
      options.agent = token.slice("--agent=".length);
      continue;
    }

    if (token.startsWith("--scope=")) {
      options.scope = token.slice("--scope=".length);
      continue;
    }

    if (token.startsWith("--dir=")) {
      options.dir = token.slice("--dir=".length);
      continue;
    }

    if (token.startsWith("-")) {
      throw new InstallerError(`Unknown option: ${token}`, "UNKNOWN_OPTION");
    }

    if (skillName) {
      throw new InstallerError("Specify exactly one skill name.", "TOO_MANY_SKILLS");
    }

    skillName = token;
  }

  if (!skillName) {
    throw new InstallerError("Specify a skill name after install.", "MISSING_SKILL");
  }

  return { ...options, skillName };
}

async function run(tokens) {
  const [command, ...arguments_] = tokens;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(usage);
    return;
  }

  if (command === "list") {
    const skills = await listSkills(packageRoot);
    console.log(skills.length ? skills.join("\n") : "No skills are bundled in this package.");
    return;
  }

  if (command !== "install") {
    throw new InstallerError(`Unknown command: ${command}`, "UNKNOWN_COMMAND");
  }

  const options = parseInstallArguments(arguments_);
  const destinationRoot = resolveInstallRoot({
    agent: options.agent,
    scope: options.scope,
    directory: options.dir,
  });
  const result = await installSkill({
    sourceRoot: packageRoot,
    skillName: options.skillName,
    destinationRoot,
    force: options.force,
  });
  const host = options.dir ? "the custom destination" : agentLabel(options.agent);

  console.log(`Installed ${options.skillName} for ${host}.`);
  console.log(result.target);

  if (result.backup) {
    console.log(`Previous installation preserved at ${result.backup}`);
  }
}

run(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
