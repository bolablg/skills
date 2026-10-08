# Wlan Studio

[Wlan](https://wlan.iyanju.com) is **Your collaborative writing studio.**
The marketplace integration is named **Wlan Studio** to distinguish it from
wireless WLAN. It lets your assistant discover styles, read authorized drafts,
and write, check, and submit revisions with your assistant's own model.

The hosted MCP URL is `https://wlan.iyanju.com/mcp` (Streamable HTTP).
There is no local Wlan daemon, pairing step, CLI execution, or API key.
Installing a client plugin only installs instructions and a remote connection.
Wlan remains invite-only; use an admitted account.

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

Or install the published repository release directly:

```sh
gemini extensions install https://github.com/bolablg/skills --ref v0.5.1
```

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

Connect Wlan as a custom remote MCP integration in ChatGPT Work on the web,
where your account and workspace policy permit custom connections. The local
Codex marketplace installation above does not automatically add a cloud-chat
connection. A portable account package can show its MCP server without exposing
a cloud sign-in control. Register the cloud MCP connection first:

1. Open Plugins → Add → Add custom MCP server.
2. Enter Wlan Studio and `https://wlan.iyanju.com/mcp`; keep Authentication set to
   OAuth.
3. Open Advanced OAuth settings. Confirm the Clerk issuer, canonical Wlan
   resource, and the five `wlan:*` scopes plus `user:org:read`. Use the discovered
   CIMD registration method, or supported DCR. Leave base scopes empty. Inspect
   the separate **OIDC scopes supported** field: automatic discovery can copy
   the issuer's full catalog into it, including `public_metadata` and
   `private_metadata`. Remove that broad list. If OIDC is needed, keep only
   `openid`, `email`, and `profile`; otherwise disable optional OIDC. OAuth stays
   enabled. Never request Clerk metadata scopes for Wlan.
4. Review the connection warning, select Create as a plugin, and complete
   browser sign-in and consent yourself.
5. Retain the actual connection ID from the resulting URL (`plugin_asdk_app...`).
   A private account package can bind that registered connection through
   `.app.json` and `extensions.com.openai.apps`. Use only the host-returned ID;
   do not invent an ID or commit an account-specific mapping to this public
   package.

The current [package and connection guide](https://developers.openai.com/plugins/build/plugins),
[MCP guide](https://learn.chatgpt.com/docs/extend/mcp)
and [connect-and-test guide](https://developers.openai.com/plugins/deploy/connect-chatgpt)
are the source of truth for the UI available to your account.

Some workspaces expose the custom-app flow under Settings → Apps → Create with
developer mode enabled. An authorized admin/developer supplies the MCP URL,
chooses OAuth, scans tools, creates the draft integration and tests it. Only a
workspace admin can publish it to that workspace. If those controls are absent,
ask the workspace owner to enable the supported flow; do not select anonymous
authentication or invent a client secret. See OpenAI's
[developer mode and workspace controls](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt).

Select the connected Wlan integration in the chat and start the writing task.
Complete the separate Wlan workspace approval below when a protected tool asks
for it. A connection appearing in settings does not prove an authorized rewrite
works. Account eligibility and administration controls can change.

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

The assistant writes with its own model. Wlan checks style, length, fidelity,
language and configured indicators, and independently checks submissions.
The AI-style indicator does not prove authorship or guarantee detector evasion.
An accepted rewrite and a saved draft are distinct outcomes. Work starts in the
connected chat: MCP alone cannot wake an idle assistant from Wlan.

## Verification and publication status

See [the release record](wlan-release.md) for package tests, public discovery,
actual publication and remaining client authorization checks. Repository
publication is independent of acceptance into OpenAI's public Plugins Directory,
Anthropic's directory, or Gemini CLI's extension gallery. A public repository
or catalog entry must never be described as approval by those providers.
