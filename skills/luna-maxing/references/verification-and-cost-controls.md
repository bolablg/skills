# Verification and cost controls

## Evidence standard

- Prefer primary sources and inspected artifacts.
- Require a source or path for each material factual claim.
- Label inference and confidence explicitly.
- Cross-check high-impact claims with a second source, another worker, or coordinator inspection.
- Treat absence of evidence as unresolved, not false.

## Worker acceptance

Accept a result only when its task ID matches, status is explicit, required evidence is traceable, promised validation ran, and changes stay within scope. Reinspect changed files and rerun relevant checks before integration.

## Cost controls

- Default to two or three workers and a concurrency ceiling of three.
- Do not fan out trivial, highly sequential, or already-settled work.
- Give each worker minimal context and one bounded objective.
- Use `adaptive` mode when max reasoning is not essential.
- Stop when marginal information gain becomes low.
- Remember that each isolated Codex session loads its own instructions and context; startup overhead can be substantial.

## Routing receipt

Record the requested model, reasoning effort, enforcement method, worker thread ID when available, timestamps, token usage when available, output paths, artifact hashes, and failure state. Explicit CLI arguments prove what was requested, not an external guarantee about provider-side execution; phrase the receipt accordingly.

## Final synthesis

The coordinator must distinguish convergent findings, conflicting findings, missing evidence, failed work packets, and recommendations. Never average contradictory answers into a false consensus.
