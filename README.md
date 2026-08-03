# Skills

Reusable, portable Agent Skills by [bolablg](https://github.com/bolablg). The
repository is the source of truth; each folder in `skills/` is a standalone
skill.

## Product Challenger

`product-challenger` is an Africa-first, research-backed product-development
skill. It captures and combines raw product ideas, challenges customer value,
researches competitors and market evidence, designs validation tests, and
turns broad visions into evidence-gated product releases.

The canonical source is
[skills/product-challenger](skills/product-challenger). It follows the open
Agent Skills format and works with Codex, Claude Code, OpenCode, Gemini CLI,
and compatible hosts.

## Install with npx

After the package is published to npm, install Product Challenger without a
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

The installer never overwrites an existing skill by default. Pass `--force` to
retain the existing directory as a timestamped backup alongside the new one.
List bundled skills or see all options with:

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

## Repository layout

```text
skills/product-challenger/          # Canonical Skill source
.agents/skills/product-challenger   # Local ignored Codex development symlink
bin/bolablg-skills.mjs              # Dependency-free npx installer
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
npm publish --access public
gh skill publish --tag v0.2.0
```

The GitHub Agent Skills release is separate from the classic GitHub Marketplace
for Apps and Actions. The current repository and initial Product Challenger
release are public at [bolablg/skills](https://github.com/bolablg/skills).
