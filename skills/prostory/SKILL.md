---
name: prostory
description: Turn technical project notes, artifacts, or rough drafts into credible stories about what mattered, what the person owned, why they made a decision, and what changed. Use for project walkthroughs in interviews, portfolio case studies, résumé bullets, promotion evidence, and stakeholder presentations.
license: MIT
---

# Prostory — project storytelling

Make the audience understand why the work mattered before asking them to care how it was built. For a short pitch, put the stakes and the speaker's contribution in the opening. Use the stack to explain a decision or outcome.

## Find the story

- Identify the audience, the format, and what the story needs to demonstrate. For an unspecified professional presentation, draft a 60–90 second interview answer in the speaker's voice. If several projects are available, prefer the one with a relevant decision, clear ownership, and credible evidence over the one with the flashiest stack.
- Pull the facts from the user's notes and any supplied artifacts, such as PRs, design docs, demos, dashboards, or evaluations. Establish who was affected, what was at stake, what the speaker owned, what the team did, and what was delivered. A repository can show what exists; it rarely proves ownership, adoption, or business impact by itself.
- Find the decision that best shows judgment: a constraint or risk, a real alternative if known, why the chosen approach fit, and what it cost or left unresolved. Pick the one or two technical details that explain how it worked. If the notes only support implementation, explain what was implemented and why without inventing a debate.
- Ask only for missing facts that materially change the story, such as who owned the change or how the outcome was measured. If there is enough to write, draft now and list the most useful verification questions separately.

## Draft the story

Use this spine as a guide, not a set of mandatory headings:

1. **Stakes:** What was hard, broken, slow, or risky? Who felt it, and why did it matter then?
2. **Ownership:** What did you personally take responsibility for? Where did others contribute?
3. **Decision and action:** What did you choose or change, why did that approach fit the constraints, and how did it address the problem?
4. **Outcome and evidence:** What changed for users, operators, or the organization? How do you know, and what is still unknown?

If a lesson or next step shows judgment, add it after the result. Preserve the speaker's voice. For formats and before/after examples, read [Audience formats and examples](references/audience-formats.md).

## Check the claims

- Separate observed results from estimates, targets, and expected benefits. Give a number its unit and scope; for a before/after claim, include the baseline and measurement window or test conditions when available. Keep a pilot or benchmark scoped to that setting. Distinguish what followed the change from what the evidence shows it caused.
- When no impact metric exists, use the strongest supported proof: a released capability, a workflow that no longer needs a manual step, an acceptance check, a reproduced failure that now passes, or documented feedback. If the work has not shipped, say what the prototype demonstrated and what remains unmeasured. Never turn a deliverable into a claim of adoption, savings, or risk reduction without evidence.
- Use “I” for the speaker's work and “we” for shared work and team outcomes. For public or external versions, generalize confidential names and details, and use only evidence suitable for that audience. Keep private source references and verification notes out of the shareable copy.
- Deliver the requested version first. Flag only gaps that affect the claims or the speaker's ability to defend them. Check that the audience could repeat why the project mattered, name the speaker's contribution, and distinguish the result from the goal.
