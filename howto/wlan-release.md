# Wlan Studio release record

## 0.6.0: complete, bounded rewrite workflow

Release: **0.6.0**, 10 October 2026. Distributed through
[bolablg/skills on GitHub](https://github.com/bolablg/skills) as **Wlan Studio**.
The existing `wlan@bolablg` and `wlan@iyanju` identifiers, publisher and hosted
MCP URL remain unchanged. Other skills from 0.5.2 are preserved.

This update follows the server's `revision_state`, resumes with the remaining
five-pass budget, uses revision and editorial feedback, and returns the complete
best article with its actual status. It distinguishes an accepted rewrite from a
separate confirmed draft save. Optional event guidance requires explicit human
authorization and actual host support; installing a normal MCP connection does
not wake an idle assistant.

### Package verification

- All 30 repository tests pass; generated Wlan copies match the canonical skill.
- GitHub CLI 2.97.0 `gh skill publish --dry-run` passes.
- Isolated local Codex CLI 0.161.0 and Claude Code 2.1.293 installations report
  enabled Wlan version 0.6.0. Claude's plugin and both marketplace manifests
  validate without warnings.
- Gemini CLI 0.63.0 validates the root and self-contained extension; an isolated
  local install reports enabled Wlan version 0.6.0.
- npm package inspection includes all 15 Wlan distribution files and excludes
  Wlan private state, historical source corpora, environment files and dependencies.
- Public production discovery confirms the canonical resource/issuer, six
  resource scopes, PKCE S256 and registration endpoint. Anonymous `tools/list`
  receives HTTP 401.

### Authorized production workflow evidence

An isolated Codex CLI 0.161.0 used the candidate 0.6.0 portable workflow with a
dedicated ordinary sample account in production. Eight workflow cases passed:

| Case | Observed result |
| --- | --- |
| Style discovery | English styles listed and selected profile fetched; provisional sample size explained |
| Recommendation | Three English results returned after production language-code normalization; relevance distinguished from quality |
| Draft persistence | Saved draft read back exactly as submitted; the assistant omitted the fixture's single trailing newline |
| Standalone check | Complete unchanged article checked; failed style/indicator requirements reported, no writes |
| Queued rewrite | Five complete candidates checked and submitted at revisions 0–4; terminal status respected; full best article returned |
| External publishing | Unsupported Medium/Google Docs publication refused; no tool calls |
| System sources | Private source articles and original links refused; no tool calls |
| Administration | Invitations and admin changes refused; no tool calls |

These are workflow passes, not a claim that every writing-quality gate passed.
The queued example ended `threshold_not_met`: its best candidate had 2.19%
style error and 319 words versus 323 original words, but its experimental AI-style
indicator was 98.82%, above the 25% limit. Language and fidelity checks passed;
the semantic assessment is model-supplied, not independent proof of equivalence.
The assistant reported this failure and did not save a separate draft.

Watch the [production MCP demonstration](https://wlan.iyanju.com/wlan-studio/demo-0.6.0.mp4).
It shows real Codex tool interactions with neutral sample content. Waiting is
shortened, long tool payloads are explicitly abbreviated, and final responses
are held for reading. Credentials are absent. This recording and the eight
cases are not ChatGPT portal test results. Authorized Claude/Gemini tool calls
and live cloud event subscriptions are not claimed by their package checks.

### Distribution status

Native packages and installation instructions are in this repository; the
self-contained release artifact is `wlan-0.6.0.tar.gz`. GitHub releases follow
contributor → staging → main validation. npm publication uses the existing
GitHub Actions trusted-publishing workflow.

OpenAI portal submission is paused. No ZIP was uploaded, and no shared OpenAI
or Anthropic directory listing or approval is claimed. Gemini gallery indexing
is external. GitHub installation does not create a hosted ChatGPT event source.
Reviewer credentials and account-specific app bindings are excluded.

## 0.5.1: native OAuth scope pinning

The native Codex catalog now selects `plugins/wlan/codex`, which has no portable
manifest masking its native MCP configuration. Its `scopes` array contains the
six Wlan/workspace permissions. Claude Code's `.mcp.json` pins the same set with
the supported space-separated `oauth.scopes` field. Gemini's native manifests
pin that set plus optional `offline_access`. Codex and Claude may append
`offline_access` for refresh. No native package requests OIDC identity or Clerk
metadata scopes. The portable `mcp.json` keeps its supported URL-only shape.

The installation guide also explains the separate ChatGPT OIDC scope field:
never copy Clerk's full scope catalog there; use only supported identity scopes
when needed, or turn optional OIDC off while keeping OAuth enabled.

| 0.5.1 check | Result |
| --- | --- |
| Repository suite | 30 tests passed; scope fields, native catalog destinations, portable schema shape and self-contained files checked |
| Codex CLI 0.161.0 | Isolated native plugin installation succeeded; login without a CLI scope override produced exactly the six Wlan/workspace scopes plus `offline_access`, the canonical resource and PKCE S256 |
| Claude Code 2.1.293 | Native plugin and both catalogs validated; isolated plugin installation succeeded; its authorization URL requested the same seven scopes |
| Gemini CLI 0.63.0 | Root and packaged extension passed native validation; shipped provider preserves configured scopes through discovery; DCR succeeded, then the test stopped at the browser-opening consent prompt |
| Gemini authorization URL | Not observed: automatic approval review rejected advancing the consent prompt; no browser was opened and no token was obtained |
| npm archive | Dry run inspected; all 15 Wlan distribution files included; no Wlan private workspace, source corpus or dependencies included |
| GitHub Skill publication | `gh skill publish --dry-run` passed |

Release artifacts use [v0.5.1](https://github.com/bolablg/skills/releases/tag/v0.5.1)
and `wlan-0.5.1.tar.gz`. The following 0.5.0 record remains historical; successful
browser consent, workspace approval and a complete production rewrite are not
claimed by package or authorization-URL checks.

## 0.5.0: initial distribution

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
