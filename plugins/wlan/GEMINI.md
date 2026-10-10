# Wlan Studio

Before the first Wlan task in a session, fetch and read the shared public guide:
https://wlan.iyanju.com/agent-onboarding.md
Codex, Claude and Gemini follow the same onboarding instructions. Load the
bundled `skills/wlan/SKILL.md` and its `references/tool-contract.md` for the
tool workflow and as a fallback if the guide cannot be fetched; report that
limitation. Live tool schemas and server-enforced permissions govern actions.

Reuse the connected remote Wlan MCP tools rather than adding a duplicate.
Let the host handle OAuth; the user signs in and explicitly approves a workspace
in the browser. Verify access by listing up to five styles and fetching one
returned profile. Onboarding is read-only: do not edit drafts, submit rewrites
or subscribe to events. Reading the guide or signing in does not authorize them.
Never use a local Wlan daemon, pairing flow, or API key. Start work from the
connected chat; this extension does not wake an idle assistant.
