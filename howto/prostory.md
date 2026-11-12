# How to use Prostory

Prostory turns project work into a story someone can understand, remember, and ask you about. Start with why the work mattered, explain the decision you owned, and show what changed. The skill takes its starting point from [Uma Abu’s reel on why great engineers don’t get hired](https://www.instagram.com/reel/DfPy2gmj6oE/): interviewers need to understand the importance and impact of your work. Prostory adds a reusable workflow for making that case with evidence.

Prostory is part of the portable [Iyanju Agentory skill collection](../README.md#the-collection). Codex and Claude Code can load it through the Iyanju Agentory plugin. To install Prostory from this checkout, run the command for your agent.

```sh
node bin/bolablg-skills.mjs install prostory --agent codex --scope user
node bin/bolablg-skills.mjs install prostory --agent claude-code --scope user
node bin/bolablg-skills.mjs install prostory --agent gemini-cli --scope user
node bin/bolablg-skills.mjs install prostory --agent opencode --scope user
node bin/bolablg-skills.mjs install prostory --agent generic --scope user
```

Use `--scope project` to install for the current project. The `generic` target uses the shared `.agents/skills` convention. For another Agent Skills host with a different location, pass `--dir /path/to/agent/skills` instead. Keep the full skill directory, including `references/`. If your agent can read files but has no skill discovery, ask it to read [`skills/prostory/SKILL.md`](../skills/prostory/SKILL.md) and follow its instructions.

Ask for `prostory` by name or use your host’s skill invocation syntax. In Codex, use `$prostory`.

Start with one project. Share who needed it, your role, a constraint or tradeoff, and whatever proof you have. Rough notes are fine. If you have a PR, demo, decision record, or before/after measurement, provide it and say what can be shared with the audience.

```text
Use prostory to turn these pipeline migration notes into a 90-second answer
for a senior data engineer interview. Focus on the decision I owned and why
it mattered to Finance. Keep the benchmark scoped to staging, and give me
two likely follow-up questions with answers supported by my notes.
```

You can reuse the same facts for a portfolio case study, a résumé bullet, a promotion review, or a stakeholder presentation. When impact has not been measured, expect the draft to explain what shipped or what a test demonstrated and to flag the most useful evidence to gather next.
