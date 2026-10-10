# Wlan hosted tool contract

Derived from `wlan-studio/lib/mcp/server.ts`, `lib/mcp/auth-shared.ts`,
`convex/mcpData.ts`, and `docs/mcp-authentication.md` on 10 October 2026.
Discover the installed server schema before calling; fail clearly on drift.
All tools accept optional `orgId` for an already authorized team workspace.

| Tool | Arguments beyond optional orgId | Wlan scope |
| --- | --- | --- |
| `wlan_list_styles` | `limit?`, `cursor?`, `language?`, `topic?`, `query?`, `origin?` (`system`/`user`), `visibility?` (`private`/`team`/`public`) | `wlan:styles:read` |
| `wlan_get_style` | `id` | `wlan:styles:read` |
| `wlan_recommend_styles` | `text`, `language`, `goal?` | `wlan:styles:read` |
| `wlan_list_drafts` | `limit?`, `cursor?` | `wlan:drafts:read` |
| `wlan_get_draft` | `id` | `wlan:drafts:read` |
| `wlan_save_draft` | `id?`, `revision`, `title`, `text`, `mutationId`, `clientId?` | `wlan:drafts:write` |
| `wlan_check_revision` | `styleId`, `original`, `text`, `goal?`, `semanticFidelity?` | `wlan:requests:read` |
| `wlan_list_rewrite_requests` | `limit?`, `cursor?`, `status?` | `wlan:requests:read` |
| `wlan_get_rewrite_request` | `id` | `wlan:requests:read` |
| `wlan_submit_rewrite` | `id`, `text`, `revision` (integer 0–4), `semanticFidelity` | `wlan:requests:write` |

`user:org:read` supports OAuth workspace selection. `offline_access` is optional
for refresh. The host manages discovery, PKCE, client identity/registration,
tokens and refresh. Do not embed credentials or override the server's audience.

Text inputs are nonempty, at most 100,000 characters, and contain no null bytes.
Titles are nonblank and at most 120 characters; goals at most 300. IDs use
letters, digits, underscores and hyphens. Lists default to 20 and allow 1–50.
Use returned decimal offset cursors; restart if the filtered library changes.
`semanticFidelity` is `{ "passed": boolean, "issues": string[] }`, with at most
20 issues of 1–500 characters each. Supply it honestly even where optional.
`mutationId` is 12–100 letters/digits/underscores/hyphens. `clientId` is 6–100
with the same character set. Creation requires `clientId` and revision zero.

Structured results use `{ ok, data?, error?: { code, message } }`; failures also
set `isError`. Inspect the envelope before consuming data. On
`AUTHORIZATION_REQUIRED`, `data.approvalUrl` holds the user-facing approval URL.
`REVISION_CONFLICT` may include `data.remote`. Keep the local edit and re-fetch.
`DRAFT_DELETED` is not a save. `AUTH_REQUIRED`, `UNAVAILABLE`, `LIMIT_REACHED`,
`RESULT_TOO_LARGE`, `INVALID_RESULT` and `REQUEST_FAILED` require appropriate
reconnection, workspace review, waiting, or explicit failure reporting.

A draft save returns `{ status: "saved", id, revision }`. A rewrite submission
returns `{ id, status, revision, revision_state, evaluation? }`. Request retrieval
also returns `revision_state`, `latestStep` and `bestStep` when available.
`revision_state` includes `maximum_iterations`, `completed_iterations`,
`remaining_iterations`, `can_continue`, `next_action` and `instruction`.
Continue only while `can_continue` is true, using the current revision and latest
feedback. Terminal states require stopping and returning the best candidate,
not resetting the budget. Inspect `evaluation.accepted`,
fidelity, length, language, scorable state, deviations, and any AI-style check.
For a request with a separate structure profile, standalone checks fetch the
style by `styleId`; submission evaluates the complete stored request profile
and is authoritative. Do not treat style score alone, HTTP 200, or `ok: true`
as acceptance. Do not resubmit a terminal request. Preserve current request
state after ambiguous writes; the server guards revisions and may recognize identical submissions.

OAuth workspace approval requests expire after ten minutes. Grants last thirty
days, bind one user/client/workspace and can be revoked at
`https://wlan.iyanju.com/mcp-consent/approve`. Read permissions start selected;
write permissions require selection. The first protected call creates the exact
approval request. Reconnect and approve again when required; never bypass
admission, scope, membership, revocation or audience enforcement.
