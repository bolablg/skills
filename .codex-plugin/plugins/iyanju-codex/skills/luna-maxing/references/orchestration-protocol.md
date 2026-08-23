# Orchestration protocol

## Roles

- Sol is the coordinator: interpret ambiguity, design work packets, resolve conflicts, and own the final answer.
- Luna Max is a bounded worker: execute one explicit packet, produce evidence, and stop.
- Codex is the only host: use user-visible tasks exclusively in the Codex app and isolated sessions only in Codex CLI.

“Sora as aggregator” is a naming mistake. Sora is OpenAI's video generation model. The coordinator in this pattern is GPT-5.6 Sol.

## Lifecycle

1. Restate the decision or deliverable and its success criteria.
2. Decide whether parallelism creates independent evidence or merely duplicates work.
3. Select `adaptive` or `strict-max` mode.
4. Create non-overlapping work packets with an objective, context, done conditions, verification, and forbidden actions.
5. Select visible-task transport exclusively in the Codex app or verified CLI routing in Codex CLI. Fail closed instead of using an in-app background fallback or another host.
6. Give each worker one explicit execution action and acceptance criteria. Launch no more workers than the work packets justify; default to two or three and cap concurrent threads/workers at five. Do not count an internal session ID as a visible task.
7. Require a structured handoff with actions, changed artifacts, verification, blockers, and uncertainty. Retain the output, Codex task ID or CLI receipt, status, and validation result.
8. Sol inspects the actual result. Send precise corrections to the same task when needed, then wait for and inspect the revision; cap this at three review rounds by default.
9. Validate important claims against primary artifacts or another independent worker.
10. Resolve disagreements explicitly. Do not hide minority evidence.
11. Produce one coordinator-owned answer using the aggregation report template.

## Modes

`adaptive` permits the coordinator to lower worker effort when the packet is routine. Reserve `max` for genuinely difficult reasoning.

`strict-max` requires every worker to use Luna at `max`. Use it when the user explicitly asks for Luna Maxing or when the comparison requires uniform worker settings.

## Stop conditions

Stop fan-out when enough independent evidence exists, new workers would repeat existing work, the task becomes sequential, or costs outweigh the expected information gain. A failed worker is evidence of a gap, not permission to invent its result.
