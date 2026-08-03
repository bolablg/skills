# Skills repository guidance

- Keep each distributable skill in `skills/<skill-name>/`; the folder name and
  `SKILL.md` frontmatter `name` must match.
- Treat `skills/` as the source of truth. The matching ignored
  `.agents/skills/` entry is a local relative symlink for Codex discovery; do
  not replace it with a copy or commit it.
- Keep each skill self-contained and avoid a README, changelog, or installation
  guide inside a skill directory.
- Keep credentials, private customer data, and provider-specific secrets out of
  this repository.
- Treat `dev-bola` as the shared development and integration branch. Create
  focused `codex/<description>` branches from it when independent work needs a
  reviewable change set.
- Keep `main` stable and release-ready. Validate changes on `dev-bola` before
  merging them into `main`; create public release tags only from `main`.
- Before publishing, validate with `gh skill publish --dry-run` using GitHub CLI
  2.90.0 or later, then inspect the changes before committing.
