# Bola BLG Skills

Portable, cross-agent AI skills for evidence-led product discovery,
validation, and execution. This is an MIT-licensed collection built to grow:
Product Challenger is the first Skill, not the name or limit of the project.

Each Skill follows the open Agent Skills format, so it can work across Codex,
Claude Code, OpenCode, Gemini CLI, and compatible hosts.

## The collection

| Skill | Purpose | Status |
| --- | --- | --- |
| [Product Challenger](skills/product-challenger) | Challenge, research, validate, and sequence Africa-first product ideas. | Available |

Future Skills belong in `skills/<skill-name>/`. The npm installer discovers
every valid `SKILL.md` folder dynamically, so adding a new Skill does not
require changing installer code or creating a separate package.

## Install a Skill with npx

After the npm package is published, install Product Challenger without a
global package installation:

```sh
npx @bolablg/skills install product-challenger --agent codex --scope user
```

Use a supported agent name to choose its native Skills directory:

| Agent | User scope | Project scope |
| --- | --- | --- |
| Codex | `~/.agents/skills` | `.agents/skills` |
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| OpenCode | `~/.config/opencode/skills` | `.opencode/skills` |
| Gemini CLI | `~/.gemini/skills` | `.gemini/skills` |

For example:

```sh
npx @bolablg/skills install product-challenger --agent claude-code --scope user
npx @bolablg/skills install product-challenger --agent opencode --scope project
npx @bolablg/skills install product-challenger --agent gemini-cli --scope user
```

Use `--dir` for any other host. It is the parent skills directory, so this
command installs to `./my-agent/skills/product-challenger`:

```sh
npx @bolablg/skills install product-challenger --dir ./my-agent/skills
```

The installer never overwrites an existing Skill by default. Pass `--force` to
retain the existing directory as a timestamped backup alongside the new one.
List bundled Skills or see all options with:

```sh
npx @bolablg/skills list
npx @bolablg/skills --help
```

Until the npm package is published, run the same installer directly from this
public GitHub repository:

```sh
npx --yes --package=github:bolablg/skills bolablg-skills install product-challenger --agent codex --scope user
```

## Install with GitHub CLI

GitHub CLI 2.90.0 or later includes the preview `gh skill` command:

```sh
gh skill preview bolablg/skills product-challenger
gh skill install bolablg/skills product-challenger --agent codex --scope user
```

Change `--agent` to `claude-code`, `opencode`, or `gemini-cli`. Use
`--scope project` to install into the current repository instead.

## Add the next Skill

Keep every distributable Skill independent and portable:

```text
skills/
  product-challenger/
    SKILL.md
    agents/openai.yaml             # Optional host metadata
    references/                    # Load only when needed
    assets/                        # Reusable output materials
  next-skill/
    SKILL.md
```

Use a lowercase hyphenated directory name that matches the `name` in its
`SKILL.md` frontmatter. Keep a Skill self-contained: do not add a README,
changelog, installation guide, secrets, or customer data inside its folder.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the validation and release flow.

## Development and release flow

| Branch | Role |
| --- | --- |
| `main` | Stable, published source and release tags. |
| `dev-bola` | Shared development and integration branch; test here before release. |
| `codex/<feature>` | Optional short-lived branch for one focused change, based on `dev-bola`. |

```text
codex/<feature>  →  dev-bola  →  main  →  GitHub Skill release / npm release
```

Run the relevant checks on `dev-bola` before opening the release pull request
to `main`. GitHub Actions runs the installer and package checks on pushes and
pull requests targeting either branch. Only tag and publish after the `main`
merge is confirmed.

## Repository layout

```text
skills/                            # Canonical, independently usable Skills
.agents/skills/product-challenger  # Local ignored Codex development symlink
bin/bolablg-skills.mjs             # Dependency-free npx installer
lib/installer.mjs                  # Auto-discovers bundled Skills
CONTRIBUTING.md                    # Add, validate, and release Skills
.github/workflows/validate.yml     # Automated checks for dev-bola and main
```

The local `.agents/skills` symlink is intentionally ignored by Git: it keeps a
single development source of truth while avoiding an installation directory in
the published source.

## Validate and release

This repository is released under the [MIT License](LICENSE).

```sh
npm test
npm run pack:check
gh skill publish --dry-run
```

For a release, merge the tested work into `main`, then publish from `main`:

```sh
npm publish --access public
gh skill publish --tag vX.Y.Z
```

The GitHub Agent Skills release is separate from the classic GitHub Marketplace
for Apps and Actions. The current public releases are available at
[bolablg/skills](https://github.com/bolablg/skills/releases).
