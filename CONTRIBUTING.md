# Contributing to Iyanju Agentory

## Working branches

Each contributor works in a personal `dev-<name>` branch. The existing
`dev-bola` branch is one example. Create a new contributor branch from the
current integration branch:

```sh
git fetch origin
git switch staging
git pull --ff-only
git switch -c dev-<your-name>
```

Open a pull request from `dev-<name>` into `staging`. Validate the integrated
result in `staging`, then open the release pull request from `staging` to
`main`. Keep `main` for stable releases only. GitHub Actions runs the installer
and package checks on contributor branches, staging, and main. A merge to
`main` also starts the npm release workflow.

## Adding a Skill

1. Create portable Skills in `skills/<skill-name>/SKILL.md`. Put an intentionally
   Codex-only Skill in `.codex-plugin/plugins/iyanju-codex/skills/<skill-name>/SKILL.md`
   under the shared Iyanju Codex plugin. Use a lowercase hyphenated directory name
   that matches the frontmatter `name`.
2. Keep the instructions concise and place optional materials in `references/`,
   `assets/`, or `scripts/` within that Skill directory.
3. Add `agents/openai.yaml` only when the Skill needs Codex UI metadata.
4. Do not put a README, changelog, install guide, secrets, or customer data in
   a Skill directory. Add a human-facing guide at `howto/<skill-name>.md`
   instead.
5. Add the new Skill and its guide to the collection table in the root
   `README.md` and `howto/README.md`.

The cross-agent installer scans `skills/*/SKILL.md` dynamically. A valid portable Skill is
therefore included in `npx @bolablg/skills list` and can be installed without
changing the installer. Codex-only Skills are loaded through the shared Iyanju
Codex plugin and must not be added to Claude or generic installer roots.

## Validate

Run these checks before merging to `staging`:

```sh
npm test
npm run pack:check
gh skill publish --dry-run
claude plugin validate .
```

Run the Agent Skills validator supplied by the host you use when adding or
editing a Skill; Codex includes a `quick_validate.py` validator for this. When
changing marketplace metadata, also test a local Codex marketplace install:

```sh
codex plugin marketplace add .
codex plugin add iyanju-agentory@bolablg
codex plugin add iyanju-codex@bolablg
```

Remove the temporary test marketplace and plugin afterwards if this is not
your normal local setup.

Also test the package behaviour relevant to the change. For example:

```sh
npx --yes --package=github:bolablg/skills bolablg-skills list
npx skills add bolablg/skills --list
```

## Release

1. Update the package version in `dev-<name>` before opening its pull request
   to `staging`.
2. Confirm `staging` passes its checks, then open and merge the release pull
   request from `staging` to `main`.
3. The `Publish npm package` GitHub Actions workflow tests and publishes the
   new `@bolablg/skills` version from `main`. It skips a version that npm
   already contains.
4. npm trusted publishing must be configured once in the package's npm
   settings for the `bolablg/skills` repository and `publish-npm.yml` workflow
   file. This uses GitHub's short-lived identity; do not add an npm token as a
   GitHub secret.
5. Publish the matching GitHub Skill release from `main` with the same version
   tag.

## Wlan integration packages

Edit the portable workflow under `skills/wlan/`. Run `npm run wlan:sync` to
regenerate `plugins/wlan`, the root Gemini extension manifest/context, and the
additive `marketplaces/iyanju` catalogs. Do not edit generated files directly.
The existing root catalogs keep the `bolablg` namespace. The added catalogs
resolve Wlan from `bolablg/skills` on `main` and provide `wlan@iyanju`.

Codex catalogs select the native `plugins/wlan/codex` package so its explicit
OAuth scopes survive loading. Claude Code uses the parent `.mcp.json` with a
space-separated `oauth.scopes`; Gemini uses an array. Keep native scope settings
out of portable `mcp.json`, whose schema rejects them. Maintain both generated
copies of the portable Wlan Skill through the sync script.

Run `npm test`, `claude plugin validate plugins/wlan`,
`claude plugin validate marketplaces/iyanju`, `gemini extensions validate .`,
`gemini extensions validate plugins/wlan`, and `gh skill publish --dry-run`.
Check public discovery with `npm run wlan:discovery` separately from tests; it
requires network access and never authenticates or reads a user's content.
An actual OAuth/approval/rewrite test requires an admitted user in a real client.

For a release, attach the self-contained Wlan archive from `plugins/wlan` to the
matching GitHub release. Keep `gemini-extension.json` at the archive root. Add
the GitHub topic `gemini-cli-extension` only after the root manifest is public;
gallery indexing remains external and must be verified before claiming a listing.
Record publication and compatibility evidence in `howto/wlan-release.md`.
