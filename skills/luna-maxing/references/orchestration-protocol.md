# Orchestration protocol

## Roles

- Sol is the coordinator: interpret ambiguity, design work packets, resolve conflicts, and own the final answer.
- Luna Max is a bounded worker: execute one explicit packet, produce evidence, and stop.
- The host is the transport: user-visible tasks exclusively in the Codex app or ChatGPT; native subagents elsewhere; isolated CLI sessions only on external hosts when native routing is unavailable.

“Sora as aggregator” is a naming mistake. Sora is OpenAI's video generation model. The coordinator in this pattern is GPT-5.6 Sol.

## Lifecycle

1. Restate the decision or deliverable and its success criteria.
2. Decide whether parallelism creates independent evidence or merely duplicates work.
3. Select `adaptive` or `strict-max` mode.
4. Create non-overlapping work packets with an objective, context, done conditions, verification, and forbidden actions.
5. Select visible-task transport exclusively in the Codex app or ChatGPT and subagent transport elsewhere, then probe model-routing capability before claiming a model was used. Fail closed instead of using an in-app background fallback.
6. Launch no more workers than the evidence streams justify; default to two or three and cap concurrent threads/workers at five. Do not count an internal session ID as a visible task.
7. Retain each worker's output, visible task/thread ID or background-session receipt, status, and validation result.
8. Validate important claims against primary artifacts or another independent worker.
9. Resolve disagreements explicitly. Do not hide minority evidence.
10. Produce one coordinator-owned answer using the aggregation report template.

## Modes

`adaptive` permits the coordinator to lower worker effort when the packet is routine. Reserve `max` for genuinely difficult reasoning.

`strict-max` requires every worker to use Luna at `max`. Use it when the user explicitly asks for Luna Maxing or when the comparison requires uniform worker settings.

## Stop conditions

Stop fan-out when enough independent evidence exists, new workers would repeat existing work, the task becomes sequential, or costs outweigh the expected information gain. A failed worker is evidence of a gap, not permission to invent its result.
