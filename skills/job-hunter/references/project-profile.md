# Project and profile contract

## Discovery order

Look in the project root for `jobhunter.yaml`, `jobhunter.yml`, `jobhunter.json`, `info.yaml`, `info.yml`, then `info.json`. Detect JSON versus YAML from content, not extension. Warn when a YAML file is mislabeled `.json`.

If no profile exists, run `scripts/init_project.py <project-directory>` or copy `assets/jobhunter.project.yaml`. Keep the created profile and ledgers private. Never commit them to a public repository.

## Resource inventory

Inventory PDF, DOCX, Markdown, and text resources under paths declared in `resources`. Build a candidate evidence map containing:

- identity and contact facts;
- target positioning and role families;
- employers, titles, dates, responsibilities, and verified outcomes;
- skills, tools, industries, education, and certifications;
- portfolio evidence and public professional links;
- unresolved conflicts between resources.

Store the map in `jobhunter-ledger/candidate-evidence.md`. The initializer creates it from `assets/candidate-evidence-template.md`; preserve source paths and page/section locators so every application claim can be checked.

Do not infer legal eligibility, sponsorship, citizenship, clearance, demographics, salary, location flexibility, employment dates, or achievements. Ask for conflicts that would affect an application.

## Validation

Run:

```sh
python3 scripts/validate_profile.py /path/to/jobhunter.yaml --mode profile
python3 scripts/validate_profile.py /path/to/jobhunter.yaml --mode apply
python3 scripts/validate_profile.py /path/to/jobhunter.yaml --mode outreach
```

The validator accepts JSON and the portable YAML subset used by the template. The subset supports two-space mappings, sequences, quoted or plain scalars, booleans, null, numbers, and JSON-style inline arrays/objects.

## Credential references

The profile may store email addresses and account identifiers, but never a password, token, recovery code, or API key value. A credential object contains only:

```yaml
credential:
  source: "browser-session"
  ref: ""
```

Allowed sources:

- `browser-session`: use an already authenticated session or browser/password-manager autofill.
- `prompt`: ask the user to take over credential entry at the login or signup screen.
- `env`, `macos-keychain`, or `secret-manager`: use only when the host can inject the referenced secret without printing, logging, or placing it in a report. Otherwise hand off.

A legacy shape such as `default-credentials: [email, password]` is rejected. Migrate it without carrying the password forward:

```sh
python3 scripts/migrate_legacy.py /path/to/info.yaml \
  --output /path/to/jobhunter.yaml \
  --resume ./candidate-approved-resume.pdf
```

Repeat `--resume` for each candidate-approved variant. Migration never scans the folder or guesses which nearby document is a résumé. It preserves the email and declared supporting resources, leaves unknown facts null or empty for review, discards the password, configures user handoff, and adds private profile names to `.gitignore`.

The original unsafe file is not deleted automatically. Rotate the exposed password, review Git history and backups for copies, then remove or quarantine the legacy file through a recoverable operation when ready.

## Permission fields are preferences, not eternal consent

`prepare-only`, `draft-only`, and `disabled` prohibit the corresponding external action. `review-each` and `approved-batch` describe the desired review workflow; they do not authorize unknown future destinations, recipients, uploads, legal answers, or messages. Obtain current-session approval for exact batch IDs and record it in the ledger.
