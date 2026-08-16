# Iyanju Agentory guidance

- Keep portable skills in `skills/<skill-name>/` and each Codex-only skill in
  `codex-plugins/<skill-name>/skills/<skill-name>/`; the folder name and
  `SKILL.md` frontmatter `name` must match. Never expose a Codex-only skill
  through another host.
- Treat `skills/` and `codex-plugins/` as their respective sources of truth. The matching ignored
  `.agents/skills/` entry is a local relative symlink for Codex discovery; do
  not replace it with a copy or commit it.
- Keep marketplace metadata host-native and release-aligned: Codex uses
  `.agents/plugins/marketplace.json` and `.codex-plugin/plugin.json`; Claude
  Code uses `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json`.
  Keep their versions aligned with `package.json`.
- Keep each skill self-contained and avoid a README, changelog, or installation
  guide inside a skill directory. Give every public Skill user-facing onboarding
  in `howto/<skill-name>.md` and keep it aligned with the Skill's assets.
- Keep credentials, private customer data, and provider-specific secrets out of
  this repository.
- Treat `dev-<name>` as a contributor's personal development branch; the
  existing `dev-bola` branch is one example. Merge contributor work into
  `staging` for shared integration and testing.
- Keep `staging` as the only integration gate before `main`. Keep `main`
  stable and release-ready; create public release tags only from `main` after
  staging validation succeeds.
- Before publishing, validate with `gh skill publish --dry-run` using GitHub CLI
  2.90.0 or later, then inspect the changes before committing.
