# Iyanju Agentory

Iyanju Agentory is a growing, MIT-licensed collection of portable, cross-agent
AI skills for research, development, automation, operations, and creative work.
The collection is intentionally domain-agnostic: every Skill is an independent,
portable capability rather than the project's identity.

[![skills.sh](https://skills.sh/b/bolablg/skills)](https://www.skills.sh/bolablg/skills)

Portable Skills follow the open Agent Skills format and work across Codex,
Claude Code, OpenCode, Gemini CLI, and compatible hosts. Codex-only Skills are
kept in a separate distribution root and are not exposed to other hosts.

## The collection

| Skill | Purpose | Status |
| --- | --- | --- |
| [Job Hunter](howto/job-hunter.md) | Build a private candidate profile, research and apply to jobs safely, and connect with relevant recruiters. | Available |
| [Luna Maxing](howto/luna-maxing.md) | Coordinate verified GPT-5.6 Luna Max work packets under a GPT-5.6 Sol aggregator. | Codex only |
| [Product Challenger](howto/product-challenger.md) | Challenge, research, validate, and sequence Africa-first product ideas. | Available |

Portable Skills belong in `skills/<skill-name>/`. Each Codex-only Skill belongs
in a dedicated `codex-plugins/<skill-name>/skills/<skill-name>/` plugin. Put each
human-facing onboarding guide in `howto/<skill-name>.md`.

## Install Iyanju Agentory as a marketplace plugin

Codex marketplace installation adds the complete collection, including
Codex-only Skills. Claude Code marketplace installation adds only the portable
Skills under `skills/`; Luna Maxing is intentionally excluded.

In Codex:

```sh
codex plugin marketplace add bolablg/skills
codex plugin add iyanju-agentory@bolablg
codex plugin add luna-maxing@bolablg
```

In Claude Code:

```sh
claude plugin marketplace add bolablg/skills
claude plugin install iyanju-agentory@bolablg
```

After updating this repository, refresh the marketplace before updating the
plugin:

```sh
codex plugin marketplace upgrade bolablg
codex plugin add iyanju-agentory@bolablg
codex plugin add luna-maxing@bolablg

claude plugin marketplace update bolablg
claude plugin update iyanju-agentory@bolablg
```

Read the practical guides in [howto/](howto/) before starting a workflow.

### Upgrade from earlier marketplace identifiers

If you installed Iyanju Agentory v0.2.4, replace its short-lived `iyanju`
marketplace identifier with `bolablg` once:

```sh
codex plugin remove iyanju-agentory@iyanju
codex plugin marketplace remove iyanju

claude plugin uninstall iyanju-agentory@iyanju
claude plugin marketplace remove iyanju
```

If you installed the earlier prerelease plugin
`agent-skills-library@bolablg-skills`, remove that marketplace once, then use
the current install commands above:

```sh
codex plugin remove agent-skills-library@bolablg-skills
codex plugin marketplace remove bolablg-skills

claude plugin uninstall agent-skills-library@bolablg-skills
claude plugin marketplace remove bolablg-skills
```

## Install with Skills.sh

Skills.sh installs public GitHub Skill collections directly. To install Product
Challenger for Codex across all projects:

```sh
npx skills add bolablg/skills --skill product-challenger --global --agent codex --yes
```

To choose the target agent interactively or install it only in the current
project, omit `--global`, `--agent`, and `--yes`:

```sh
npx skills add bolablg/skills --skill product-challenger
```

Browse the public listing at
[skills.sh/bolablg/skills/product-challenger](https://www.skills.sh/bolablg/skills/product-challenger).

Luna Maxing is intentionally not published through Skills.sh or exposed to
Claude Code, ChatGPT, Gemini CLI, OpenCode, generic agents, or other LLM hosts.
Install it only through the Codex marketplace plugin:

```sh
codex plugin marketplace add bolablg/skills
codex plugin add luna-maxing@bolablg
```

Or install Job Hunter:

```sh
npx skills add bolablg/skills --skill job-hunter --global --agent codex --yes
```

## Install a Skill with npx

Install an individual Skill without a global package installation:

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
After installation, it prints the matching guide in `howto/`. List bundled
Skills or see all options with:

```sh
npx @bolablg/skills list
npx @bolablg/skills --help
```

To test unreleased changes directly from the public GitHub repository, run:

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

Keep portable Skills independent. Put a Skill in `codex-plugins/` only when it
depends on Codex-specific models or task controls and must not be distributed
to other hosts:

```text
skills/
  job-hunter/
    SKILL.md
    agents/openai.yaml
    scripts/                       # Project initialization and profile validation
    references/
    assets/
  product-challenger/
    SKILL.md
    agents/openai.yaml             # Optional host metadata
    references/                    # Load only when needed
    assets/                        # Reusable output materials
  next-portable-skill/
    SKILL.md
codex-plugins/
  luna-maxing/
    .codex-plugin/plugin.json
    skills/
      luna-maxing/
        SKILL.md
        agents/openai.yaml
        scripts/                       # Capability probe and bounded Codex CLI runner
        references/
        assets/
```

Use a lowercase hyphenated directory name that matches the `name` in its
`SKILL.md` frontmatter. Keep a Skill self-contained: do not add a README,
changelog, installation guide, secrets, or customer data inside its folder.
Put human onboarding in `howto/<skill-name>.md` instead. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the validation and release flow.

## Development and release flow

| Branch | Role |
| --- | --- |
| `main` | Stable, published source and release tags. |
| `staging` | Shared integration and testing branch; the release candidate for `main`. |
| `dev-<name>` | A contributor's personal development branch, such as `dev-bola`. |

```text
dev-<name>  →  staging  →  pull request to main  →  npm release
```

Open contributor pull requests from `dev-<name>` into `staging`, then validate
the integrated result there. Open the release pull request only from `staging`
into `main`. GitHub Actions runs the installer and package checks across this
flow. When that pull request is merged, the npm publish workflow verifies the
package again and automatically publishes a version that is not yet public.
It safely skips a version npm already has.

## Repository layout

```text
skills/                            # Portable, cross-agent Skills
codex-plugins/                     # Dedicated Codex-only Skill plugins
howto/                             # Human-facing guide for every public Skill
.agents/skills/<skill-name>        # Local ignored Codex development symlinks
.agents/plugins/marketplace.json   # Codex marketplace catalog
.codex-plugin/plugin.json          # Codex collection plugin metadata
.claude-plugin/marketplace.json    # Claude Code marketplace catalog
.claude-plugin/plugin.json         # Claude Code collection plugin metadata
bin/bolablg-skills.mjs             # Dependency-free npx installer
lib/installer.mjs                  # Auto-discovers bundled Skills
CONTRIBUTING.md                    # Add, validate, and release Skills
.github/workflows/validate.yml     # Automated checks for dev-*, staging, main
.github/workflows/publish-npm.yml  # Trusted npm publish after a main merge
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

For an npm release, increment the version in the contributor branch before it
reaches `staging`, then merge the tested `staging` pull request into `main`.
The publish workflow releases the new version automatically. It uses npm
trusted publishing, which must be configured once for this package in npm with
the `bolablg/skills` repository and the `publish-npm.yml` workflow filename.

The GitHub Agent Skills release is separate and is still published from
`main` with its matching tag:

```sh
gh skill publish --tag vX.Y.Z
```

The GitHub Agent Skills release is separate from the classic GitHub Marketplace
for Apps and Actions. The current public releases are available at
[bolablg/skills](https://github.com/bolablg/skills/releases).
