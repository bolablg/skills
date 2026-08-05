# Onboarding and manual profile input

Run onboarding when the profile is missing, incomplete, migrated, or the user asks to change search direction. Ask progressively; do not present the entire YAML as a questionnaire.

## Intake sequence

1. Ask the user to select at least one résumé and name the purpose of each variant. Never scan nearby files or choose a résumé without approval.
2. Offer optional local evidence: portfolio notes, cover letters, certifications, education records, publications, writing samples, recommendation letters, and project evidence.
3. Offer optional online evidence: a user-provided LinkedIn URL/export, GitHub or GitLab, portfolio, personal website, publications, research profiles, demos, and professional directories.
4. For every resource, confirm whether it may be read for evidence, used for tailoring/outreach, and shared or linked to employers. Reading permission is not sharing permission.
5. Ask current country, region/city, and timezone. Current residence is a fact, not a target market.
6. Ask target roles, seniority, industries, and employment types.
7. Ask for primary, secondary, then exploratory markets. For each market, collect explicit countries, optional regions/cities, work modes, remote-residence rules, and relocation conditions.
8. Ask work authorization and sponsorship separately for each target country. Keep unanswered values `unknown`; never infer them from nationality, residence, résumé, or language.
9. Ask search constraints: sponsorship inclusion, worldwide remote, languages, compensation, posting age, travel, exclusions, and matching threshold.
10. Ask application, account, and outreach permission modes. These preferences never replace approval for exact external actions.
11. Show a plain-language summary and unresolved fields. Write the YAML only after the user confirms or corrects the summary.

Ask no more than three related questions at once. Resume after each answer, preserving already confirmed data.

## Resource contract

Require one `resources.resumes` entry and exactly one default. Use these optional collections:

- `resources.local`: candidate-approved files inside the declared project/resource scope.
- `resources.online`: candidate-provided or public professional URLs.

Each optional resource requires `id`, `type`, `use_for`, and `share_with_employers`, plus exactly one `path` or `uri` as appropriate. Allowed `use_for` values are `candidate-evidence`, `application-tailoring`, `profile-link`, `technical-evaluation`, and `recruiter-outreach`.

For online resources, set `access_mode` to `public`, `user-provided`, `browser-session`, or `manual-handoff`. A URL is not permission to log in, scrape, or share. For LinkedIn, use `user-provided`, `browser-session`, or `manual-handoff`; do not use autonomous public scraping. Prefer a user-provided export when profile content is needed as evidence.

When sources conflict, record the conflict in `jobhunter-ledger/candidate-evidence.md` and ask the candidate. Do not silently select the résumé, LinkedIn, or portfolio version.

## Market contract

Store markets under `career_preferences.target_markets`. Every market requires:

- stable `id` and unique positive `priority`;
- `geography.countries` using uppercase ISO 3166-1 alpha-2 codes;
- optional descriptive `region_label`, regions, and cities;
- one or more of `remote`, `hybrid`, or `onsite`;
- remote-residence facts when remote is selected;
- relocation willingness: `yes`, `no`, or `case-by-case`.

Never use a broad label such as Europe, Africa, or Latin America without enumerating countries. Never interpret remote as worldwide. Verify that the employer accepts a worker residing in the configured country.

Store country facts under `work_eligibility`, one entry per target country. Use `authorized`, `not-authorized`, or `unknown`; record sponsorship separately as `true`, `false`, or `unknown`, and retain candidate confirmation/date. Do not apply when a decisive eligibility answer is unknown.
