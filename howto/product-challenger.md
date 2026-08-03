# How to use Product Challenger

Product Challenger works best as a persistent product workspace, not as a
one-off prompt. Use it to collect rough ideas safely, turn the relevant ones
into one focused product brief, challenge the customer value and business
case, then earn the right to plan software releases.

## 1. Create one dedicated project

Create a project or workspace named for the problem area, not the proposed
solution. For example, use `Affordable school-fee collections in Kenya` rather
than `The payments super-app`.

Give the project a first country, a narrow customer, and a decision you want
to make. Keep related ideas together; use another project only when the
customer, country, or core problem is meaningfully different.

If your host supports project-level instructions, copy the text in
[the Product Challenger project instruction](../skills/product-challenger/assets/project-instruction.md)
into that project. Otherwise, send it as the first message in the workspace.
This keeps the agent in Product Challenger mode across future conversations.

## 2. Capture ideas before judging them

Do not start by asking whether a half-formed idea is a billion-dollar
business. Capture each thought first so promising details and contradictions
are not lost.

```text
/capture Small shop owners in Lagos lose sales when their stock is unavailable,
but they do not know which items run out most often.

/capture A WhatsApp-based stock reminder might work better than another app.

/capture We could later help suppliers see aggregated demand.
```

Product Challenger assigns stable idea IDs and records what is evidence versus
an assumption. Ask for `/ledger` whenever you want to see what has been
captured, merged, or needs evidence.

## 3. Merge only the ideas that belong together

When you are ready, ask the agent to combine specific IDs. It creates a
working brief without deleting the original ideas.

```text
/synthesize I-001, I-002
```

Review the brief before starting a full challenge. In particular, correct the
first country, customer, buyer/payer, painful moment, current workaround, and
proposed first outcome.

## 4. Use the right operation at the right time

| Goal | Ask Product Challenger | What you get |
| --- | --- | --- |
| Preserve a thought | `/capture …` | Neutral idea record |
| Review all thoughts | `/ledger` | Idea status and contradictions |
| Make one concept | `/synthesize I-001, I-002` | Versioned working brief |
| Test whether it is worth pursuing | `/challenge standard` | Evidence-based recommendation and cheap tests |
| Investigate one uncertainty | `/research [question]` | Evidence, limits, confidence, decision impact |
| Convert findings into a commitment | `/decide` | Decision memo, tests, exclusions |
| Avoid building a super-app too early | `/sequence` | Release 0 test, focused Release 1, earned later wedges |
| Keep a portable record | `/export` | Project profile, ledger, evidence, and decisions |

Use `/challenge deep` only when the extra research can change a launch or
investment decision. Ask `/research` for a single uncertain fact instead of
requesting a large report by default.

## A good first session

Paste and complete this after the project instruction:

```text
I want to explore a product opportunity.

First country: [country]
Customer/user: [specific person or business]
Buyer/payer: [who pays, if different]
Painful moment: [what happens and why it matters]
Current workaround: [what they do today]
My constraints and advantages: [budget, access, experience, distribution]
Decision I need: [what I need to decide in the next 2–6 weeks]

I have several rough ideas. Use /capture for each one first. Do not challenge
or combine them until I ask you to synthesize them.
```

After the brief is accurate, continue with:

```text
/challenge standard
Focus on the few assumptions most likely to make this fail. Use current,
country-specific research where tools are available. Recommend BUILD,
VALIDATE, NARROW, PIVOT, or STOP, and give me the cheapest credible next test.
```

## What good use looks like

- Let customer evidence beat your architecture, feature list, and personal
  enthusiasm.
- Ask for one narrow customer and country first; expand only after a release
  earns it.
- Keep raw ideas, working briefs, research, and decisions in the same project.
- Treat accelerator and incubator material as useful methods, not proof that
  customers will pay.
- Run a cheap test before building production software. A concierge workflow,
  interview, pricing conversation, landing page, or pre-commitment often beats
  an early technical build.
- Use `/sequence` only after a credible challenge. If demand is uncertain,
  sequence experiments rather than features.

## What Product Challenger will not do

It will not pretend an uncited claim is researched, treat Africa as one market,
or praise a technically impressive product that lacks a customer outcome. It
will surface uncertainty and may recommend narrowing, validating, pivoting, or
stopping. That is the point of the Skill.

## Continue the project over time

Return to the same workspace after interviews, pilots, pricing conversations,
or research. Add the new observation with `/capture`, ask `/decide` when it
changes a commitment, and use `/export` before sharing the work with a
co-founder, advisor, or team.
