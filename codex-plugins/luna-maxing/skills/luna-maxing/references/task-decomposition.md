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
- `sandbox`: use `read-only` for analysis and `workspace-write` for Sol-authorized implementation with exact path ownership.
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
- Concurrent writers with overlapping paths, shared generated outputs, hidden dependencies, or unclear ownership.
- A worker asked to synthesize the whole project or spawn more workers.

Never create or request Git worktrees. Sol may run writers concurrently in the saved checkout only after assigning exact, pairwise non-overlapping files or directories. Treat a directory and anything beneath it as overlapping ownership. Give coupled manifests, lockfiles, migrations, generated outputs, and shared interfaces to one worker or run their tasks serially. Workers do not commit or publish while concurrent; Sol inspects the combined diff, resolves integration issues, and validates centrally.
