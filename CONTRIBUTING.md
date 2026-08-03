# Contributing to Bola BLG Skills

## Working branches

Start from `dev-bola` for all new work. Use a focused branch when a change
needs its own review history:

```sh
git switch dev-bola
git pull --ff-only
git switch -c codex/<short-description>
```

Open a pull request into `dev-bola`, validate the integrated result there, and
then open a release pull request from `dev-bola` to `main`. Keep `main` for
stable releases only. GitHub Actions runs the installer and package checks on
pushes and pull requests for both branches.

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

Run these checks before merging to `dev-bola`:

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
