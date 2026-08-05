# Task decomposition

Create a worker only when its result can be produced and judged largely independently.

## A complete work packet

- `id`: stable lowercase identifier.
- `objective`: one answer, artifact, or decision.
- `context`: only the facts and paths needed for that packet.
- `allowedPaths`: local paths the packet may inspect or edit; mandatory for write packets.
- `allowedHosts`: network hosts the packet may consult, when network access is authorized.
- `doneWhen`: observable completion criteria.
- `verification`: checks the worker should perform.
- `forbiddenActions`: scope boundaries and prohibited side effects.
- `sandbox`: prefer `read-only`; use `workspace-write` only for authorized implementation.
- `effort`: `max` in strict mode; calibrated in adaptive mode.

Define ambiguous terms before delegation. For example, “latest package version” might mean the highest semantic version, a registry dist-tag, or a hosting platform's selected release.

## Useful decomposition patterns

- Evidence lanes: market, user, technical, regulatory, and financial evidence.
- Competing hypotheses: one worker tries to support each plausible explanation.
- Artifact boundaries: separate modules, documents, or datasets.
- Builder and verifier: one produces an artifact; a later, independent packet tests it.

## Poor decomposition

- Several workers answering the same vague question.
- Packets that depend on unfinished outputs from each other but run concurrently.
- Tiny tasks whose startup context costs more than the work.
- Multiple write workers sharing one checkout.
- A worker asked to synthesize the whole project or spawn more workers.

For write work, use separate worktrees with disjoint ownership or run packets sequentially. Integrate and test centrally after workers finish.
