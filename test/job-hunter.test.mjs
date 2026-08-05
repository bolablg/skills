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
const actionLogger = path.join(skillRoot, "scripts", "action_log.py");

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
  assert.match(gitignore, /jobhunter-actions\.csv/);
  assert.match(await readFile(path.join(project, "jobhunter-actions.csv"), "utf8"), /^timestamp_utc,event_id,/);

  const secondInitialization = runPython(initializer, [project]);
  assert.equal(secondInitialization.status, 1);
  assert.match(secondInitialization.stdout, /Refusing to overwrite/);
});

test("records root actions and refuses duplicate application or recruiter attempts", async (context) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "job-hunter-log-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const project = path.join(temporaryRoot, "career-project");
  const initialized = runPython(initializer, [project]);
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  const logPath = path.join(project, "jobhunter-actions.csv");
  const common = [
    logPath,
    "--workflow",
    "apply",
    "--action",
    "application-submit-attempt",
    "--target-key",
    "job:example.com:REQ-123",
    "--status",
    "started",
    "--batch-id",
    "BATCH-001",
  ];

  const first = runPython(actionLogger, ["record", ...common]);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  assert.match(first.stdout, /RECORDED event_id=/);

  const found = runPython(actionLogger, [
    "check",
    logPath,
    "--action",
    "application-submit-attempt",
    "--target-key",
    "job:example.com:REQ-123",
  ]);
  assert.equal(found.status, 2);
  assert.match(found.stdout, /FOUND event_id=.* status=started/);

  const duplicate = runPython(actionLogger, ["record", ...common]);
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stdout, /Duplicate guarded action refused/);

  const retry = runPython(actionLogger, ["record", ...common, "--approved-retry"]);
  assert.equal(retry.status, 0, retry.stderr || retry.stdout);
  const recruiter = runPython(actionLogger, [
    "record",
    logPath,
    "--workflow",
    "recruiter-outreach",
    "--action",
    "recruiter-contact-attempt",
    "--target-key",
    "recruiter:route-hash:initial",
    "--status",
    "started",
  ]);
  assert.equal(recruiter.status, 0, recruiter.stderr || recruiter.stdout);
  const recruiterDuplicate = runPython(actionLogger, [
    "record",
    logPath,
    "--workflow",
    "recruiter-outreach",
    "--action",
    "recruiter-contact-attempt",
    "--target-key",
    "recruiter:route-hash:initial",
    "--status",
    "started",
  ]);
  assert.equal(recruiterDuplicate.status, 1);
  assert.match(recruiterDuplicate.stdout, /Duplicate guarded action refused/);
  const lines = (await readFile(logPath, "utf8")).trim().split("\n");
  assert.equal(lines.length, 4);
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
    "default-credentials:\n  - person@example.com\n  - legacy-value\nprofile-resources:\n  - resume.pdf\n  - portfolio.md\n  - https://portfolio.example.com\n",
  );
  await writeFile(path.join(temporaryRoot, "portfolio.md"), "verified portfolio evidence\n");
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
  assert.match(migratedText, /path: "\.\/portfolio\.md"/);
  assert.match(migratedText, /uri: "https:\/\/portfolio\.example\.com"/);
  assert.match(migratedText, /access_mode: "user-provided"/);
  assert.match(migratedText, /share_with_employers: false/);
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
      current_location: {
        city: "Chicago",
        region: "IL",
        country: "US",
        timezone: "America/Chicago",
      },
    },
    resources: {
      resumes: [{
        id: "default",
        path: "./resume.txt",
        default: true,
        target_roles: ["Data Engineer"],
        share_with_employers: true,
      }],
      local: [],
      online: [{
        id: "linkedin",
        type: "linkedin",
        uri: "https://www.linkedin.com/in/example",
        access_mode: "user-provided",
        use_for: ["candidate-evidence", "profile-link"],
        share_with_employers: true,
      }],
    },
    goals: { functions: ["apply"] },
    career_preferences: {
      target_roles: ["Data Engineer"],
      target_seniority: ["senior"],
      target_industries: [],
      employment_types: ["full-time"],
      target_markets: [{
        id: "us-remote",
        priority: 1,
        geography: {
          region_label: "United States",
          countries: ["US"],
          regions: [],
          cities: [],
        },
        work_modes: ["remote"],
        remote_arrangement: {
          may_work_from_current_country: true,
          candidate_residence_countries: ["US"],
          maximum_timezone_difference_hours: 4,
        },
        relocation: {
          willingness: "no",
          employer_support_required: false,
        },
      }],
      excluded_locations: { countries: [], regions: [], cities: [] },
    },
    work_eligibility: [{
      country: "US",
      authorization_status: "authorized",
      sponsorship_required: false,
      candidate_confirmed: true,
      last_confirmed: "2026-08-05",
    }],
    search_constraints: {
      sources: ["company-careers"],
      include_jobs_requiring_sponsorship: false,
      include_jobs_with_unknown_sponsorship: false,
      include_worldwide_remote_jobs: false,
      verify_remote_accepts_residence_country: true,
      posted_within_days: 30,
      minimum_match_score: 70,
      compensation: { minimum: null, currency: null, period: "year", negotiable: true },
      languages: [{ language: "English", level: "professional" }],
      excluded_companies: [],
      excluded_role_terms: [],
      maximum_travel_percent: 10,
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
  const result = JSON.parse(validated.stdout);
  assert.equal(result.summary.format, "json");
  assert.equal(result.summary.target_market_count, 1);
  assert.equal(result.summary.optional_resource_count, 1);

  const regionOnly = structuredClone(profile);
  regionOnly.career_preferences.target_markets[0].geography.countries = [];
  regionOnly.career_preferences.target_markets[0].geography.region_label = "North America";
  const regionOnlyPath = path.join(temporaryRoot, "region-only.json");
  await writeFile(regionOnlyPath, `${JSON.stringify(regionOnly, null, 2)}\n`);
  const regionOnlyValidation = runPython(validator, [regionOnlyPath, "--mode", "apply"]);
  assert.equal(regionOnlyValidation.status, 1);
  assert.match(regionOnlyValidation.stdout, /geography\.countries must be a non-empty list/);

  const missingEligibility = structuredClone(profile);
  missingEligibility.work_eligibility = [];
  const missingEligibilityPath = path.join(temporaryRoot, "missing-eligibility.json");
  await writeFile(missingEligibilityPath, `${JSON.stringify(missingEligibility, null, 2)}\n`);
  const missingEligibilityValidation = runPython(validator, [missingEligibilityPath, "--mode", "apply"]);
  assert.equal(missingEligibilityValidation.status, 1);
  assert.match(missingEligibilityValidation.stdout, /Missing work_eligibility entries for target countries: US/);

  const unsafeLinkedIn = structuredClone(profile);
  unsafeLinkedIn.resources.online[0].access_mode = "public";
  const unsafeLinkedInPath = path.join(temporaryRoot, "unsafe-linkedin.json");
  await writeFile(unsafeLinkedInPath, `${JSON.stringify(unsafeLinkedIn, null, 2)}\n`);
  const unsafeLinkedInValidation = runPython(validator, [unsafeLinkedInPath, "--mode", "apply"]);
  assert.equal(unsafeLinkedInValidation.status, 1);
  assert.match(unsafeLinkedInValidation.stdout, /LinkedIn cannot use autonomous public access/);

  const outreach = runPython(validator, [profilePath, "--mode", "outreach"]);
  assert.equal(outreach.status, 1);
  assert.match(outreach.stdout, /outreach must be an object/);
});

test("packages review-required identity fields and credential references", async () => {
  const files = [
    path.join(skillRoot, "SKILL.md"),
    path.join(skillRoot, "assets", "jobhunter.project.yaml"),
    path.join(skillRoot, "references", "onboarding.md"),
    path.join(skillRoot, "references", "application-workflow.md"),
  ];
  const combined = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.match(combined, /primary_email: null/i);
  assert.match(combined, /full_name: null/i);
  assert.match(combined, /target_markets: \[\]/i);
  assert.match(combined, /share_with_employers/i);
  assert.doesNotMatch(combined, /default-credentials:/i);
});
