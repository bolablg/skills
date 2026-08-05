import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(repositoryRoot, "skills", "job-hunter");
const initializer = path.join(skillRoot, "scripts", "init_project.py");
const migrator = path.join(skillRoot, "scripts", "migrate_legacy.py");
const validator = path.join(skillRoot, "scripts", "validate_profile.py");

function runPython(script, args) {
  return spawnSync("python3", [script, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

function configureTemplate(profile, resumePath = "./resumes/resume.pdf") {
  return profile
    .replace("full_name: null", 'full_name: "Jordan Example"')
    .replace("primary_email: null", 'primary_email: "jordan@example.com"')
    .replace("  target_roles: []\n  target_seniority:", '  target_roles: ["Data Engineer"]\n  target_seniority:')
    .replace("    email: null", '    email: "jordan@example.com"')
    .replace("./resumes/resume.pdf", resumePath);
}

test("initializes and validates a private YAML Job Hunter workspace", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "job-hunter-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const project = path.join(temporaryRoot, "career-project");
  await mkdir(project);
  await writeFile(path.join(project, ".gitignore"), "existing-private-file\n");

  const initialized = runPython(initializer, [project]);
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  await writeFile(path.join(project, "resumes", "resume.pdf"), "test resume artifact\n");
  const profilePath = path.join(project, "jobhunter.yaml");
  const profile = configureTemplate(await readFile(profilePath, "utf8"));
  await writeFile(profilePath, profile);

  const validated = runPython(validator, [profilePath, "--mode", "profile"]);
  assert.equal(validated.status, 0, validated.stderr || validated.stdout);
  const result = JSON.parse(validated.stdout);
  assert.equal(result.valid, true);
  assert.equal(result.summary.format, "yaml");
  assert.equal(result.summary.candidate_configured, true);
  assert.deepEqual(result.summary.functions, ["apply", "recruiter-outreach"]);
  assert.doesNotMatch(validated.stdout, /Jordan Example/);
  const gitignore = await readFile(path.join(project, ".gitignore"), "utf8");
  assert.match(gitignore, /existing-private-file/);
  assert.match(gitignore, /jobhunter\.yaml/);

  const secondInitialization = runPython(initializer, [project]);
  assert.equal(secondInitialization.status, 1);
  assert.match(secondInitialization.stdout, /Refusing to overwrite/);
});

test("detects mislabeled YAML and rejects legacy or plaintext passwords without echoing values", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "job-hunter-secrets-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await cp(path.join(skillRoot, "assets", "jobhunter.project.yaml"), path.join(temporaryRoot, "info.json"));
  await writeFile(path.join(temporaryRoot, "resume.pdf"), "test resume artifact\n");
  const profile = configureTemplate(await readFile(path.join(temporaryRoot, "info.json"), "utf8"), "./resume.pdf");
  await writeFile(path.join(temporaryRoot, "info.json"), profile);

  const mislabeled = runPython(validator, [path.join(temporaryRoot, "info.json")]);
  assert.equal(mislabeled.status, 0, mislabeled.stderr || mislabeled.stdout);
  assert.match(mislabeled.stdout, /contains YAML but uses a \.json extension/);

  const secretValue = "never-print-this-secret-value";
  await writeFile(
    path.join(temporaryRoot, "unsafe.yaml"),
    `${profile}\nunsafe_password: "${secretValue}"\n`,
  );
  const unsafe = runPython(validator, [path.join(temporaryRoot, "unsafe.yaml")]);
  assert.equal(unsafe.status, 1);
  assert.match(unsafe.stdout, /Plaintext secret-like field is forbidden: unsafe_password/);
  assert.doesNotMatch(unsafe.stdout, new RegExp(secretValue));

  await writeFile(
    path.join(temporaryRoot, "legacy.yaml"),
    "default-credentials:\n  - person@example.com\n  - legacy-value\nprofile-resources:\n  - resume.pdf\n",
  );
  const legacy = runPython(validator, [path.join(temporaryRoot, "legacy.yaml")]);
  assert.equal(legacy.status, 1);
  assert.match(legacy.stdout, /Legacy default credential arrays are unsafe/);
  assert.doesNotMatch(legacy.stdout, /legacy-value/);

  const migratedPath = path.join(temporaryRoot, "jobhunter.yaml");
  const missingResume = runPython(migrator, [
    path.join(temporaryRoot, "legacy.yaml"),
    "--output",
    migratedPath,
  ]);
  assert.equal(missingResume.status, 1);
  assert.match(missingResume.stdout, /migration never guesses/);

  const migrated = runPython(migrator, [
    path.join(temporaryRoot, "legacy.yaml"),
    "--output",
    migratedPath,
    "--resume",
    "./resume.pdf",
  ]);
  assert.equal(migrated.status, 0, migrated.stderr || migrated.stdout);
  const migratedText = await readFile(migratedPath, "utf8");
  assert.match(migratedText, /person@example\.com/);
  assert.match(migratedText, /\.\/resume\.pdf/);
  assert.match(migratedText, /source: "prompt"/);
  assert.match(migratedText, /full_name: null/);
  assert.match(migratedText, /target_roles: \[\]/);
  assert.doesNotMatch(migratedText, /legacy-value/);
  const migratedGitignore = await readFile(path.join(temporaryRoot, ".gitignore"), "utf8");
  assert.match(migratedGitignore, /info\.yaml/);
});

test("supports JSON profiles and applies mode-specific validation", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "job-hunter-json-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  await writeFile(path.join(temporaryRoot, "resume.txt"), "verified resume\n");
  const profile = {
    candidate: {
      full_name: "Jordan Example",
      primary_email: "jordan@example.com",
      phone: "+1 555 010 1234",
      location: { city: "Chicago", region: "IL", country: "United States" },
    },
    resources: { resumes: [{ id: "default", path: "./resume.txt", default: true }] },
    goals: { functions: ["apply"], target_roles: ["Data Engineer"] },
    search: {
      sources: ["company-careers"],
      target_countries: ["United States"],
      work_modes: ["remote"],
    },
    eligibility: {
      work_authorization: { "United States": true },
      requires_sponsorship: false,
    },
    accounts: { existing: [] },
    permissions: {
      application_submission: "prepare-only",
      account_creation: "ask-each",
      recruiter_outreach: "draft-only",
    },
  };
  const profilePath = path.join(temporaryRoot, "jobhunter.json");
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);

  const validated = runPython(validator, [profilePath, "--mode", "apply"]);
  assert.equal(validated.status, 0, validated.stderr || validated.stdout);
  assert.equal(JSON.parse(validated.stdout).summary.format, "json");

  const outreach = runPython(validator, [profilePath, "--mode", "outreach"]);
  assert.equal(outreach.status, 1);
  assert.match(outreach.stdout, /outreach must be an object/);
});

test("packages review-required identity fields and credential references", async () => {
  const files = [
    path.join(skillRoot, "SKILL.md"),
    path.join(skillRoot, "assets", "jobhunter.project.yaml"),
    path.join(skillRoot, "references", "application-workflow.md"),
  ];
  const combined = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.match(combined, /primary_email: null/i);
  assert.match(combined, /full_name: null/i);
  assert.doesNotMatch(combined, /default-credentials:/i);
});
