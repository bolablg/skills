# Contributing to the Agent Skills Library

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

1. Create `skills/<skill-name>/SKILL.md` with a lowercase hyphenated directory
   name that matches the frontmatter `name`.
2. Keep the instructions concise and place optional materials in `references/`,
   `assets/`, or `scripts/` within that Skill directory.
3. Add `agents/openai.yaml` only when the Skill needs Codex UI metadata.
4. Do not put a README, changelog, install guide, secrets, or customer data in
   a Skill directory.
5. Add the new Skill to the collection table in the root `README.md`.

The installer scans `skills/*/SKILL.md` dynamically. A valid new Skill is
therefore included in `npx @bolablg/skills list` and can be installed without
changing the installer.

## Validate

Run these checks before merging to `staging`:

```sh
npm test
npm run pack:check
gh skill publish --dry-run
```

Run the Agent Skills validator supplied by the host you use when adding or
editing a Skill; Codex includes a `quick_validate.py` validator for this.

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
