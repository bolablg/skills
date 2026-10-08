# Wlan Studio release record

Release: **0.5.0**, 8 October 2026. Source repository:
[bolablg/skills](https://github.com/bolablg/skills). The repository stays in place;
no transfer or catalog rename is part of this release.

## Distribution

- `plugins/wlan/`: self-contained portable Agent Plugins package, native Codex
  and Claude Code manifests, native Gemini CLI extension, remote HTTP connection
  and shared Wlan workflow.
- `skills/wlan/`: canonical portable instructions, included in the existing
  collection and individual skill installer. `npm run wlan:sync` refreshes the
  generated packages; CI checks that they match.
- `marketplaces/iyanju/`: additive native catalogs for `wlan@iyanju`. Root
  `bolablg` catalogs retain existing entries and also offer `wlan@bolablg`.
- Root `gemini-extension.json`: native extension discovery for this public
  repository. The Wlan release archive contains only the self-contained Wlan
  package, with the Gemini manifest at the archive root.
- [Installation and web-chat guide](wlan.md): sign-in, workspace approval,
  migration compatibility, tool workflow, conflicts and limits.

Published [v0.5.0](https://github.com/bolablg/skills/releases/tag/v0.5.0) from
`main` commit `e8b5694`, after contributor work passed through `staging`. The
release includes `wlan-0.5.0.tar.gz`. The trusted npm workflow succeeded and
[@bolablg/skills 0.5.0](https://www.npmjs.com/package/@bolablg/skills/v/0.5.0)
was confirmed available from the public registry.

## Compatibility evidence

| Check | Result |
| --- | --- |
| Repository suite | 30 tests passed, including installer compatibility, package isolation, native metadata versions, and canonical Wlan content |
| GitHub CLI | 2.97.0; `gh skill publish --dry-run` passed |
| Agent Skills | Codex `quick_validate.py skills/wlan` passed |
| Codex CLI 0.161.0 | Local `wlan@bolablg` and Git-backed `wlan@iyanju` installations succeeded in isolated profiles; the published `main` package reported enabled version 0.5.0 |
| Claude Code 2.1.293 | Wlan plugin and both catalogs passed native validation; isolated installations, including published `main`, reported one Wlan skill and one remote MCP server |
| Gemini CLI 0.63.0 | Root and self-contained Wlan extension passed native validation; isolated local and GitHub release installations succeeded; the latter resolved `v0.5.0` as a GitHub release |
| npm package | Dry run inspected; Wlan manifests and instructions included; no Wlan private `.local/`, `data-source/`, `archive/`, environment files or dependencies included |
| Production resource discovery | Correct resource and Clerk issuer; five Wlan scopes plus `user:org:read` advertised |
| Production issuer discovery | Matching issuer, PKCE S256, required scopes and public registration endpoint confirmed |
| Anonymous protected tools | `tools/list` rejected with HTTP 401 and protected-resource discovery challenge |
| Wlan implementation contracts | 93 existing tests passed across MCP server, HTTP, authentication, workspace grants and backend suites; these use test fixtures/mocks |
| Codex OAuth request construction | Explicit six-scope login produced the canonical resource, PKCE S256 and those scopes plus optional `offline_access`; no `openid`, email, profile or metadata scopes requested; browser consent not completed |
| Real-client OAuth and workspace approval | An attempted browser login returned `invalid_scope` for `openid`; explicit resource scopes and the cloud registration steps are documented; successful consent and workspace approval remain unverified |
| Authorized production tools and full rewrite | Not yet tested; do not infer success from discovery, packaging, private account upload or mocked tests |

Public discovery is reproducible with `npm run wlan:discovery`; it uses no
credentials and does not access a user's content. Mocked contract tests ran
against the inspected `wlan-studio` implementation, not against production user
data. Production runtime is not modified by this marketplace release.

## External directories and remaining review work

Repository catalogs, npm and a private ChatGPT account plugin are distinct
publication surfaces. A private account upload does not authenticate the MCP
connection, share it with a workspace, or submit it to OpenAI's public directory.
No OpenAI or Anthropic public-directory submission or acceptance is claimed.
Gemini gallery discovery requires the public root manifest and the repository's
`gemini-cli-extension` topic; indexing is external and must be checked separately.

Before an initial public OpenAI submission, confirm the verified publisher,
country targeting, commerce declaration, public support/privacy/terms URLs,
branding icon, an actual recorded demo, and secure reviewer access to an admitted
sample workspace. Do not place reviewer credentials in the public repository or
package. Complete real OAuth, workspace approval and the cases below. Supply
legal/policy attestations through the authorized publisher's dashboard.
Anthropic directory submission is likewise a separate provider review.

Draft review cases (all **not run against an authorized production client**):

| Case | Setup and prompt | Observable expectation |
| --- | --- | --- |
| Style discovery | Admitted sample workspace with styles in two languages. “Find English styles for a technical explainer and show one profile.” | `wlan_list_styles` uses language/topic filters; `wlan_get_style` receives a returned ID; response reflects returned rules without source corpus |
| Style recommendation | Sample original and writing goal. “Suggest up to three Wlan styles for this English draft.” | `wlan_recommend_styles` receives original, language and goal; response uses returned styles and labels keyword relevance accurately |
| Draft revision | Approved draft read/write and request-read permissions. “Revise my sample draft with this style, check it and save the result.” | Fetch original/style, check against unchanged original, save with current revision and stable mutation ID; report only confirmed save |
| Queued rewrite | Waiting sample request and approved request read/write. “Complete my waiting Wlan rewrite using its chosen profile.” | Fetch snapshot, check each candidate, submit current revision and honest fidelity assessment; at most five passes; status/acceptance match server |
| Bounded pagination | Authorized sample library with over 20 styles. “Show the next page of these styles.” | Same filters and returned cursor, bounded page size, no fabricated full article content |
| Private corpus boundary | “Download the private articles used to train that Wlan style.” | Explain unavailable capability; no attempt to retrieve source corpus or fabricate a tool |
| Administration boundary | “Invite my colleague and change Wlan's admission policy.” | Explain unsupported admin operations; no MCP tool called for invitation/policy change |
| Idle wake-up boundary | “Watch Wlan and automatically wake this idle chat for every request.” | Explain this package starts from connected chat and does not provide idle wake-up; do not claim a subscription or invented automation |

A demo should show the installed version, real OAuth and workspace approval,
style discovery, a sample checked rewrite and its confirmed status, and one
unsupported request. Use dedicated sample data, keep credentials off-screen,
and verify the hosted recording is accessible before adding its URL to a public
submission. These written cases are not a recording or test evidence.
