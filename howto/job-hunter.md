# How to use Job Hunter

Job Hunter creates a private career workspace from your résumés and supporting resources. It can research and prepare job applications, or help you build relationships with relevant recruiters and headhunters. External actions stay reviewable and auditable.

## 1. Install the Skill

With Skills.sh:

```sh
npx skills add bolablg/skills --skill job-hunter
```

Or install it from the Iyanju Agentory marketplace and restart your agent after updating.

## 2. Create a private project

Ask your agent:

> Use $job-hunter to initialize a private job-hunting project in this folder. Do not submit applications or send messages yet.

The initializer creates:

```text
jobhunter.yaml               Private candidate configuration
resumes/                     Résumé variants
resources/                   Portfolio notes and supporting evidence
jobhunter-ledger/            Jobs, applications, and recruiters
sessions/                    Session reports and receipts
generated/                   Tailored materials and outreach drafts
```

You can also initialize it from a repository checkout:

```sh
python3 skills/job-hunter/scripts/init_project.py /absolute/path/to/my-job-project
```

Add your résumé to `resumes/`, put other useful PDF, DOCX, Markdown, or text resources under `resources/`, then edit `jobhunter.yaml`. The starter intentionally leaves identity, target roles, locations, and eligibility unanswered; validation will fail until you supply the facts needed for your chosen workflow.

Job Hunter also recognizes `info.yaml`, `info.yml`, and legacy `info.json` files containing YAML. It recommends renaming YAML content to `.yaml`.

## 3. Configure credentials safely

Your email can be stored in `jobhunter.yaml`. Do not store a password value there.

Use a reference instead:

```yaml
accounts:
  default_signup:
    email: "you@example.com"
    credential:
      source: "prompt"
      ref: ""
```

Supported sources are:

- `browser-session` for an already connected browser;
- `prompt` for user handoff at login/signup;
- `env`, `macos-keychain`, or `secret-manager` when the host can inject the secret without printing it.

Existing platform accounts can each declare domains, login email, and a separate credential reference. Job Hunter rejects plaintext secret-like fields.

If a legacy file contains a password, rotate that password before using the new Skill.

Migrate the legacy `default-credentials` and `profile-resources` shape without copying its password:

```sh
python3 skills/job-hunter/scripts/migrate_legacy.py \
  /path/to/info.yaml \
  --output /path/to/jobhunter.yaml \
  --resume ./candidate-approved-resume.pdf
```

Repeat `--resume` for each variant you explicitly approve. The migrator never scans the surrounding folder or guesses résumé files. It keeps unknown facts empty, discards the password, and adds private profile names to `.gitignore`.

The original unsafe YAML remains untouched so migration cannot destroy data unexpectedly. Rotate its password, check Git history and backups for copies, then remove or quarantine it safely when you are ready.

## 4. Validate the project

Ask Job Hunter to validate the profile, or run:

```sh
python3 skills/job-hunter/scripts/validate_profile.py /path/to/jobhunter.yaml --mode profile
python3 skills/job-hunter/scripts/validate_profile.py /path/to/jobhunter.yaml --mode apply
python3 skills/job-hunter/scripts/validate_profile.py /path/to/jobhunter.yaml --mode outreach
```

Validation reports private-safe field locations and missing fields but never prints credential values, the candidate name, or the full profile path.

## 5. Research and apply to jobs

Start safely:

> Use $job-hunter to build my evidence-grounded candidate profile, research matching roles across compliant public sources, score them, and prepare an application review queue. Do not create accounts or submit anything.

After reviewing the queue:

> Approve application IDs APP-003 and APP-007 with the listed résumé variants and answers. Ask again if the destination, requested data, terms, or answers change.

Job Hunter records each role and its first decisive reason. A submission is marked successful only after a visible confirmation or authorized receipt.

## 6. Connect with recruiters and headhunters

Start with drafts:

> Use $job-hunter to find specialist recruiters for my target roles and locations. Verify their professional focus and public contact route, then prepare five personalized outreach drafts without sending them.

Approve exact recipients and messages:

> Approve outreach IDs OUT-001 and OUT-004 by email with one follow-up after seven days. Leave the LinkedIn drafts for me to send manually.

The Skill avoids mass outreach, guessed private email addresses, unsupported claims, and repeated follow-ups.

## Platform limitations

Job Hunter searches broadly, but “all platforms” does not mean bypassing platform rules. LinkedIn and Indeed currently prohibit unauthorized third-party automation, and Workday prohibits crawling/scraping under its published agreement. Job Hunter therefore uses compliant public sources and ATS feeds, permitted connectors, user-supplied links, and manual handoffs where required.

CAPTCHA, MFA, password changes, identity verification, security warnings, unexpected legal agreements, and unsupported sensitive questions are always escalated to the user.

## Permission modes

| Area | Safe default | Other modes |
| --- | --- | --- |
| Applications | `prepare-only` | `review-each`, `approved-batch` |
| Account creation | `ask-each` | `disabled`, `approved-domains` |
| Recruiter outreach | `draft-only` | `review-each`, `approved-batch` |

These settings describe how you prefer to work. They do not authorize unknown future jobs, recipients, uploads, answers, credentials, or legal terms. Approval always identifies exact batch IDs in the current task.
