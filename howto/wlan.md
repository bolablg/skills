# Wlan Studio

[Wlan](https://wlan.iyanju.com) is **Your collaborative writing studio.**
The marketplace integration is named **Wlan Studio** to distinguish it from
wireless WLAN. It lets your assistant discover styles, read authorized drafts,
and write, check, and submit revisions with your assistant's own model.

The hosted MCP URL is `https://wlan.iyanju.com/mcp` (Streamable HTTP).
There is no local Wlan daemon, pairing step, CLI execution, or API key.
Installing a client plugin only installs instructions and a remote connection.
Wlan remains invite-only; use an admitted account.

## Quick install from GitHub

Use the root `bolablg` catalog for the shortest Codex or Claude Code setup:

```sh
# Codex
codex plugin marketplace add bolablg/skills
codex plugin add wlan@bolablg

# Claude Code
claude plugin marketplace add bolablg/skills
claude plugin install wlan@bolablg
```

The display name is **Wlan Studio** in either catalog. Install just one of
`wlan@bolablg` and `wlan@iyanju`. Gemini CLI uses the release installation below.
See [Claude's plugin guide](https://code.claude.com/docs/en/discover-plugins)
for client-specific installation scopes and updates.

## Install as wlan@iyanju

The public repository is [bolablg/skills](https://github.com/bolablg/skills).
Its existing root marketplace remains `bolablg` for installation compatibility.
The additional catalog in `marketplaces/iyanju` provides `wlan@iyanju` without
renaming the repository or removing any existing plugin. Clone once:

```sh
git clone https://github.com/bolablg/skills.git iyanju-skills
cd iyanju-skills
```

Register the additive catalog with your client:

```sh
# Codex
codex plugin marketplace add ./marketplaces/iyanju
codex plugin add wlan@iyanju

# Claude Code
claude plugin marketplace add ./marketplaces/iyanju
claude plugin install wlan@iyanju
```

The catalog fetches the self-contained package from the public repository's
`main` branch: Codex uses `plugins/wlan/codex`; Claude Code uses `plugins/wlan`.
Keep the clone while using this local catalog.
Run `git pull --ff-only` in it before refreshing the catalog and plugin:

```sh
codex plugin marketplace upgrade iyanju
codex plugin add wlan@iyanju

claude plugin marketplace update iyanju
claude plugin update wlan@iyanju
```

The root catalog also exposes the same plugin as `wlan@bolablg` for users who
already track `bolablg/skills`. It can be installed with the existing remote
marketplace commands, replacing the plugin name with `wlan@bolablg`.
Install one Wlan plugin identifier to avoid duplicate connections. Existing
`iyanju-agentory@bolablg`, `iyanju-codex@bolablg`, npx and Skills.sh paths remain
valid. If an older `iyanju` catalog is already registered, inspect its source
before replacing it; preserve installed plugins and configuration. The new
`iyanju` catalog currently contains Wlan only, not the legacy collection.

The Codex catalog selects the native `.codex-plugin/plugin.json` package so its
OAuth scope list is loaded. The parent package retains the portable Agent Plugins
manifest for compatible hosts and the private account package. Portable MCP 1.0
does not accept native scope fields; adding them would invalidate that server,
and the portable manifest takes precedence over a native compatibility overlay.
Claude Code uses its own `.claude-plugin/plugin.json` and `oauth.scopes` string.
Gemini CLI uses its native `oauth.scopes` array. Each native client requests the
five Wlan scopes, `user:org:read`, and optional `offline_access` for refresh;
identity and metadata scopes are excluded. No package runs a local server.

## Gemini CLI

From the clone above, install the native extension:

```sh
gemini extensions install ./plugins/wlan
```

Or install the latest published repository release directly:

```sh
gemini extensions install https://github.com/bolablg/skills
```

For a reproducible 0.6.0 install, append `--ref v0.6.0`. For an existing
installation, run `gemini extensions update wlan` and restart Gemini CLI. A
previously pinned tag may remain pinned; to change its source, uninstall only
the `wlan` extension with `gemini extensions uninstall wlan`, then install
using the desired command above.

The root `gemini-extension.json` and Wlan release archive provide the native
`httpUrl` configuration and Wlan context. In a Gemini CLI chat, inspect `/mcp`
and use `/mcp auth wlan` if authentication is needed. Installation does not
complete OAuth or grant workspace access. This documents **Gemini CLI** only;
Gemini consumer web chat is not claimed to support this extension or remote MCP.
See the official [extension reference](https://geminicli.com/docs/extensions/reference/)
and [OAuth support](https://geminicli.com/docs/tools/mcp-server/#oauth-support-for-remote-mcp-servers).

## Connect a compatible client directly

Choose a remote Streamable HTTP server and OAuth discovery, with the URL above.
For clients using Claude-style MCP JSON:

```json
{
  "mcpServers": {
    "wlan": { "type": "http", "url": "https://wlan.iyanju.com/mcp" }
  }
}
```

Codex also supports direct configuration:

```sh
codex mcp add wlan --url https://wlan.iyanju.com/mcp
codex mcp login wlan --scopes wlan:styles:read,wlan:drafts:read,wlan:drafts:write,wlan:requests:read,wlan:requests:write,user:org:read
```

Use the explicit scope list if Codex reports `invalid_scope` for `openid` or
another identity scope. Wlan needs the six resource scopes shown above; its
dynamic-client policy also permits optional `offline_access` for refresh tokens.
Codex CLI 0.161.0 was checked to construct this request with those six scopes,
`offline_access`, the canonical Wlan resource and PKCE S256. This checks request
construction, not completed sign-in. For a plugin-provided connection, use its
actual server name from the host's MCP settings in place of `wlan`. Do not expand
Clerk's scope permissions to the issuer's entire advertised scope catalog.

Claude Code also supports:

```sh
claude mcp add --transport http wlan https://wlan.iyanju.com/mcp
```

Then authenticate through `/mcp` in Claude Code. Use either a plugin connection
or direct configuration to avoid duplicate tool sets. Other clients may use a
different configuration shape; they must support remote HTTP and compatible
OAuth discovery. The standalone portable workflow can be installed separately:

```sh
npx @bolablg/skills install wlan --agent codex --scope user
```

Installing only the skill does not register an MCP connection. Configure it in
the host first. Wlan's resource metadata is public at
[OAuth protected-resource discovery](https://wlan.iyanju.com/.well-known/oauth-protected-resource/mcp).
The issuer is `https://clerk.wlan.iyanju.com`; let your host discover endpoints,
PKCE and its supported CIMD or public dynamic registration flow. Do not paste
credentials into JSON or chat. `offline_access` is optional for token refresh.

## ChatGPT Work and web chats

Wlan Studio is available through GitHub for Codex, Claude Code and Gemini CLI.
Its shared ChatGPT directory listing is not published; portal submission is
paused. No OpenAI directory listing or cloud event installation is included in
this GitHub release. A future shared listing can use the existing
`https://wlan.iyanju.com/mcp` with the same account and workspace controls; no
second Wlan server is needed.

OpenAI treats imported packages declaring MCP servers as desktop-only, including
HTTPS servers. Installing this repository package in Codex does not install a
hosted ChatGPT event source. Public submission registers the same remote MCP
through OpenAI's portal, with domain verification, OAuth, scans and review; the
portal generates the hosted app binding. A public upload must not include
`.app.json` or `apps` declarations. Do not fabricate an app ID or copy a private
account binding into the public package. See [OpenAI's publication workflow](https://developers.openai.com/plugins/deploy/submission)
and [desktop-only package rules](https://learn.chatgpt.com/docs/enterprise/plugin-management#desktop-only-plugins).

For developers who explicitly choose private testing, ChatGPT's supported
**Add custom MCP server** flow can register this same URL using OAuth. Retain
the five `wlan:*` permissions and `user:org:read`. If optional OIDC is enabled,
limit its identity scopes to `openid`, `email` and `profile`; never request
`public_metadata` or `private_metadata`. Follow the actual account UI and
[official connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).
This private testing option is separate from shared directory publication.

After a hosted installation, complete Wlan workspace approval when a protected
tool returns an approval link. Confirm `wlan.rewrite_requested` in the installed
plugin's event catalogue before asking a Work cloud chat or dot to subscribe.
An installation, OAuth login, workspace grant and event subscription are four
separate states. Your space has no separate public URL.

## Claude web

In Claude web, open Customize → Connectors → Add custom connector, name it
Wlan Studio, and enter `https://wlan.iyanju.com/mcp`. Review detected OAuth
settings, choose sign-in, and use Claude's published identity or automatic
registration. Team/Enterprise owners may need to add the connector under
Organization settings → Connectors first; members then connect individually.
Enable Wlan in the conversation's connector controls. Follow Anthropic's
[current custom connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
for your plan. This is a cloud-to-cloud remote connection, separate from Claude
Code's local plugin catalog. No local daemon is involved.

## First sign-in and workspace approval

1. Start an explicit task such as “Show my Wlan writing styles.” The host opens
   browser OAuth with Wlan's Clerk authorization server. Sign in with an invited,
   admitted Wlan account and review consent.
2. The first protected tool call returns `AUTHORIZATION_REQUIRED` with a Wlan
   approval link containing a short-lived request. Open that exact link and
   review the personal or team workspace and permissions. Read permissions are
   initially selected; select the appropriate write permission if you want to
   save drafts or submit rewrites. Approve personally in the browser.
3. Return to the chat, say approval is complete, and retry. A team `orgId` must
   match the approved token workspace. Authentication alone never grants access
   to arbitrary teams or items.
4. Approval requests expire after ten minutes; grants last thirty days. Revoke
   grants at [Wlan access approval](https://wlan.iyanju.com/mcp-consent/approve).
   Reconnect and approve again when Wlan requires it. Do not paste tokens.

The five Wlan permissions are `wlan:styles:read`, `wlan:drafts:read`,
`wlan:drafts:write`, `wlan:requests:read`, and `wlan:requests:write`.
`user:org:read` supports workspace context. Your token scopes and Wlan workspace
grant must both permit the requested operation. Private source articles,
training corpora, evidence quotations, credentials, and administration are never
part of this integration.

## Start a writing task

Try one of these prompts:

- “List my Wlan styles and recommend up to three for this article's language,
  topic, and goal. Show the selected style before rewriting.”
- “Read my Wlan draft [ID], apply style [ID], check it against the unchanged
  original, and save an accepted revision. Preserve concurrent edits.”
- “Fetch my Wlan request [ID], use its chosen style and goal, check each
  candidate, and submit within the remaining five-pass budget. Report anything
  that still fails.”

For a queued rewrite, the assistant follows the server's remaining revision
budget, checks every complete candidate and stops at acceptance or a terminal
status. It returns the complete best article and reports any unmet checks, even
when the five-pass budget ends without acceptance. It does not reset the budget
or claim a separate draft save without a confirmed save.

The assistant writes with its own model. Wlan checks style, length, fidelity,
language and configured indicators, and independently checks submissions.
The AI-style indicator does not prove authorship or guarantee detector evasion.
An accepted rewrite and a saved draft are distinct outcomes. Work starts in the
connected chat unless a compatible host has confirmed an explicit event
subscription. Standard MCP alone cannot wake an idle assistant from Wlan.

## Automatic rewrites in supported cloud hosts

Wlan also supports the optional webhook Events extension. Eligible ChatGPT Work
cloud chats and dots can subscribe to `wlan.rewrite_requested` after installing
the hosted plugin and approving the intended workspace. Other hosts need
explicit support for that extension; installing the Codex, Claude or Gemini
package is not evidence of automatic wake-up.

In a supported host, ask:

> Subscribe to Wlan's wlan.rewrite_requested event for Your space. For each new
> request, fetch its snapshot and chosen style, preserve facts and meaning, check
> every candidate, and submit within its remaining five-pass budget. Report unmet
> checks. Do not publish, message anyone or save a separate draft.

The host supplies its callback and signing secret. Confirm its actual subscription
result before queuing a neutral test draft in Wlan. If Wlan is absent from event
sources, check the hosted installation and event discovery; do not invent a
subscription tool. Repeated events must not duplicate submissions. Stop at a
terminal request status or revoked access, and use the host's unsubscribe control
when asked. See [Wlan's event guide](https://wlan.iyanju.com/faq#mcp-events).

## Verification and publication status

See [the release record](wlan-release.md) for package tests, public discovery,
actual publication and remaining client authorization checks. Repository
publication is independent of acceptance into OpenAI's public Plugins Directory,
Anthropic's directory, or Gemini CLI's extension gallery. A public repository
or catalog entry must never be described as approval by those providers.
