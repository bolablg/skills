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
and package checks on contributor branches, staging, and main.

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

1. Confirm the merged `main` branch passes the checks above.
2. Update the package version when appropriate.
3. Publish the npm package when the `@bolablg` npm account is authenticated.
4. Publish the matching GitHub Skill release from `main` with the same version
   tag.
