#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const SOL_MODEL = "gpt-5.6-sol";
const LUNA_MODEL = "gpt-5.6-luna";

function runCommand(command, args, { cwd = process.cwd() } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ code: null, error, stderr, stdout });
    });
    child.on("close", (code) => {
      resolve({ code, error: null, stderr, stdout });
    });
  });
}

function reasoningEfforts(model) {
  return Array.isArray(model?.supported_reasoning_levels)
    ? model.supported_reasoning_levels
        .map((entry) => entry?.effort)
        .filter((effort) => typeof effort === "string")
    : [];
}

function summarizeModel(model) {
  if (!model) {
    return {
      available: false,
      model: null,
      multiAgentVersion: null,
      reasoningEfforts: [],
    };
  }

  return {
    available: true,
    model: model.slug,
    multiAgentVersion: model.multi_agent_version ?? null,
    reasoningEfforts: reasoningEfforts(model),
  };
}

export function analyzeCatalog(catalog) {
  const models = Array.isArray(catalog?.models) ? catalog.models : [];
  const sol = summarizeModel(models.find((model) => model.slug === SOL_MODEL));
  const luna = summarizeModel(models.find((model) => model.slug === LUNA_MODEL));
  const lunaSupportsMax = luna.reasoningEfforts.includes("max");
  const sameMultiAgentBackend = Boolean(
    sol.multiAgentVersion &&
      luna.multiAgentVersion &&
      sol.multiAgentVersion === luna.multiAgentVersion,
  );

  let recommendedRoute = "unavailable";
  if (luna.available && lunaSupportsMax) {
    recommendedRoute = sameMultiAgentBackend ? "native-candidate" : "codex-exec";
  }

  return {
    models: { luna, sol },
    nativeLunaSpawnCandidate: sameMultiAgentBackend && lunaSupportsMax,
    note:
      recommendedRoute === "native-candidate"
        ? "The catalog is compatible, but the active host tool schema must still expose Luna and max before native spawning is used."
        : recommendedRoute === "codex-exec"
          ? "Use explicit Codex CLI sessions because the catalog does not place Sol and Luna on the same multi-agent backend."
          : "Luna with max reasoning is unavailable in this catalog.",
    recommendedRoute,
  };
}

export async function probeCodex({ codexBin = "codex", cwd = process.cwd() } = {}) {
  const versionResult = await runCommand(codexBin, ["--version"], { cwd });
  if (versionResult.code !== 0) {
    return {
      codexAvailable: false,
      error: versionResult.error?.message || versionResult.stderr.trim() || "Codex CLI is unavailable.",
      recommendedRoute: "unavailable",
    };
  }

  const catalogResult = await runCommand(codexBin, ["debug", "models"], { cwd });
  if (catalogResult.code !== 0) {
    return {
      codexAvailable: true,
      error: catalogResult.error?.message || catalogResult.stderr.trim() || "Could not read the model catalog.",
      recommendedRoute: "unavailable",
      version: versionResult.stdout.trim(),
    };
  }

  try {
    return {
      codexAvailable: true,
      version: versionResult.stdout.trim(),
      ...analyzeCatalog(JSON.parse(catalogResult.stdout)),
    };
  } catch (error) {
    return {
      codexAvailable: true,
      error: `Could not parse the Codex model catalog: ${error.message}`,
      recommendedRoute: "unavailable",
      version: versionResult.stdout.trim(),
    };
  }
}

function parseArgs(argv) {
  const options = { codexBin: "codex", pretty: false, requireLuna: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--pretty") {
      options.pretty = true;
    } else if (argument === "--require-luna") {
      options.requireLuna = true;
    } else if (argument === "--codex-bin") {
      options.codexBin = argv[index + 1];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.codexBin) {
    throw new Error("--codex-bin requires a command path.");
  }

  return options;
}

function usage() {
  return [
    "Usage: node capability-probe.mjs [options]",
    "",
    "Options:",
    "  --codex-bin PATH  Codex executable to inspect (default: codex)",
    "  --pretty          Pretty-print JSON output",
    "  --require-luna    Exit non-zero unless Luna with max is available",
  ].join("\n");
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }

    const result = await probeCodex(options);
    process.stdout.write(`${JSON.stringify(result, null, options.pretty ? 2 : 0)}\n`);
    if (options.requireLuna && result.recommendedRoute === "unavailable") {
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  await main();
}

