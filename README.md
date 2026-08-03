# Skills

A source repository for reusable, portable Agent Skills. Its intended GitHub
identity is `bolablg/skills`.

`skills` is the collection name. `product-challenger` is one installable skill
inside the collection; it has no additional wrapper brand.

## Product Challenger

`product-challenger` is an Africa-first, research-backed product-development
skill. It captures and combines raw product ideas, challenges customer value,
researches competitors and market evidence, designs validation tests, and
turns broad visions into evidence-gated product releases.

The canonical skill lives at
[skills/product-challenger](skills/product-challenger). It follows the open
Agent Skills format and can be used by Codex, GitHub Copilot, Claude Code,
OpenCode, Gemini CLI, and other compatible hosts.

## Repository layout

```text
skills/product-challenger/          # Canonical source published by gh skill
.agents/skills/product-challenger   # Local ignored symlink for Codex discovery
```

The symlink keeps a single local source of truth while developing in Codex. It
is deliberately ignored by Git because GitHub's publisher treats `.agents/skills`
as an installation location, not a source location. After cloning from GitHub,
use `gh skill install` to install the skill into the correct location for the
chosen agent.

## Install after publishing to GitHub

GitHub CLI 2.90.0 or later includes the preview `gh skill` command. Replace
`bolablg/skills` with a fork only when installing from a fork.

```sh
gh skill preview bolablg/skills product-challenger
gh skill install bolablg/skills product-challenger --agent codex --scope user
```

Choose the target host by changing `--agent`:

```sh
gh skill install bolablg/skills product-challenger --agent codex --scope user
gh skill install bolablg/skills product-challenger --agent claude-code --scope user
gh skill install bolablg/skills product-challenger --agent opencode --scope user
gh skill install bolablg/skills product-challenger --agent gemini-cli --scope user
```

Use `--scope project` to install into the current repository instead of the
user-level skills directory.

## Validate and publish

This repository is released under the [MIT License](LICENSE). Before publishing,
ensure it has a `bolablg/skills` remote and an initial commit. Then use:

```sh
gh skill publish --dry-run
gh skill publish --tag v0.1.0
```

GitHub's agent-skills workflow publishes a skill repository and release; it is
different from the classic GitHub Marketplace, which lists GitHub Apps and
Actions. No GitHub remote or release has been created from this local project.
