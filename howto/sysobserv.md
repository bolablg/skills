# How to use Sysobserv

Use Sysobserv to implement or assess observability for a user journey such as
checkout, sign-in, or report generation. It covers logs, metrics, traces,
correlation, alerts, SLOs, and cardinality in that order. The sequence comes
from [Devoops' seven levels of observability](https://www.instagram.com/reel/De4iU2vMW7X/).

## Install

Sysobserv is a portable [Agent Skills](https://agentskills.io/) skill in
[Iyanju Agentory](../README.md). From a checkout that includes it, run the
installer with the target host and the desired scope.

```sh
node bin/bolablg-skills.mjs install sysobserv --agent codex --scope project
node bin/bolablg-skills.mjs install sysobserv --agent claude-code --scope project
node bin/bolablg-skills.mjs install sysobserv --agent gemini-cli --scope project
node bin/bolablg-skills.mjs install sysobserv --agent opencode --scope project
```

Run one command for each host you use. For other agents, use `--agent generic`
for the shared `.agents/skills` convention or `--dir /path/to/skills` for a
custom skills directory. Keep the full `sysobserv/` directory so the
implementation and review references remain available. For an agent without
skill discovery, ask it to read `skills/sysobserv/SKILL.md` in the checkout.

After release, use the same options with `npx @bolablg/skills`. Codex and Claude
Code can also discover Sysobserv through the Iyanju Agentory marketplace plugin.
Gemini CLI can list the skill with `gemini skills list` from a trusted project.
Each host uses its own skill activation syntax. Ask for `sysobserv` by name
when starting a task.

The seven-level workflow is the same across hosts. Independent review requires
two separate agent contexts that can run concurrently and inspect the same
candidate. If delegation is unavailable, the skill records which checks the
lead completed and flags the independent review as outstanding.

## Start with one journey

Give the agent the entry point, user-visible completion condition, existing
telemetry stack, and environment where it can run controlled checks. Include
known latency or availability targets, expected traffic, and telemetry limits
if you have them.

For a staging run, provide the deployment or revision, an admitted synthetic
account or equivalent fixture, read access to staging telemetry, and a test
alert receiver. The agent can verify which boundaries it reaches and report
any levels for which evidence is unavailable.

```text
Use $sysobserv to implement the seven levels for order submission. A user
succeeds when an order is persisted and the confirmation job completes.
Reuse the existing telemetry stack. Validate locally with synthetic orders
and a controlled worker failure. Use the current order SLO and telemetry
budget if present, and flag any assumptions. Run both independent reviews
on the candidate.
```

For a read-only task, ask for an assessment of current coverage. For a narrow
change, name the levels or component to change, such as correlating API logs
with worker traces. Provide staging or production scope explicitly when it
matters.

## Read the result

Expect changed code and configuration for implementation requests, with a
status and evidence for each relevant level. The security and cost reviewer
checks telemetry exposure, capacity, and spend. The effectiveness reviewer
checks whether an operator can detect and diagnose the chosen failure and
whether the SLO and alert rules behave as intended. The final handoff records
what passed, remaining findings, and where evidence came from local fixtures
or estimates. On hosts without subagents, expect a local review and an
explicit independent-review gap.
