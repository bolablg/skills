# Audience formats and examples

Keep the same underlying facts across versions. Change the order and depth to match what the reader or listener needs to decide.

| Format | What to emphasize |
| --- | --- |
| Recruiter screen | In 30–45 seconds, explain who needed the work, your role, and one outcome in terms a non-specialist can repeat. |
| Interview walkthrough | In 60–90 seconds, tell one story aloud. For an engineering panel, prepare optional follow-ups on the alternative, failure mode, validation, or remaining limitation. Answer the actual interview question first. |
| Portfolio case study | Use a result-oriented title, then cover the problem, role, design decision, and validation. Add a shareable diagram, screenshot, or demo only if it makes a claim easier to understand or check. |
| Résumé bullet | Use one contribution and one evidenced result or concrete scope. Name a technology when it explains the work or matters to the target role. |
| Promotion or performance review | Tie decisions and evidence to the relevant expectations. Explain scope, cross-team influence, and durable improvements where supported. Credit collaborators. |
| Stakeholder presentation | Lead with the outcome or decision needed, then give the evidence, remaining risk, and next step. Move implementation details into backup material unless they affect the decision. |

## Example: A data pipeline change with measured impact

Illustrative facts: Finance needed a daily reconciliation report before 8 a.m. Reprocessing the entire history after late files made it miss the cutoff. The speaker designed and built partition-level reprocessing, while a teammate handled alerting. They chose to retain the batch pipeline because source files arrived daily. Scheduler records show the median run fell from 95 to 22 minutes across two comparable four-week windows. No labor savings were measured.

**Interview:** “Finance depended on a reconciliation report at 8 a.m., but a late file could force us to rerun the entire history and miss that cutoff. I designed and built a way to reprocess just the affected dates, and a teammate added alerts. I kept the existing batch pipeline because the source delivered files once a day; we needed a smaller replay, not faster ingestion. In comparable four-week windows, the scheduler logs showed that the median run went from 95 minutes to 22.”

**Résumé:** “Built partition-level reprocessing for Finance’s reconciliation pipeline, cutting median runtime from 95 to 22 minutes across comparable four-week windows.”

**Industry relevance.** For a senior data engineering role that owns scheduled Finance reporting, lead with the reporting deadline and the decision to replay only affected dates. That gives the panel a concrete example of designing for pipeline reliability.

**Source accuracy.** The project notes support the ownership split and the batch design decision. The scheduler records support the 95-to-22-minute runtime comparison. On-time delivery and labor savings remain unverified, so the draft makes neither claim.

## Example: A prototype without a production result

Rough note: “Built an AI support bot with retrieval and citations. It saves agents time.” The prototype ran against a test help center; the demo showed links to the articles used, but there was no rollout or time study.

**Portfolio:** “I built a support assistant prototype that cites the help articles behind its answers, so agents can check the source before using a response. I demonstrated the citation flow with a test help center. The prototype hasn’t been rolled out, so we haven’t measured answer quality or handling time in live support.”

If the audience needs an evaluation plan, name the missing test separately: compare time and accuracy for the same representative cases with and without the assistant.
