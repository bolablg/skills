# Independent review protocol

Dispatch both reviewers on the same immutable candidate (a revision plus patch
or a read-only snapshot of the working tree). Send the journey, expected
outcomes, scope, architecture and trust boundaries, code and configuration,
intended budgets, fixture commands, and evidence locations. Share sanitized
inputs. Give each reviewer the seven-level guide and their assignment below.
Keep author conclusions and the other reviewer's report out of the initial
brief. Reviewers inspect independently and may rerun safe local checks. The lead
agent owns all edits, deployment, paging, and resolution decisions.

## Reviewer A · Security and cost effectiveness

- Follow data from capture through SDK, collector, storage, and query access.
  Review minimization, redaction at source, structured log safety, credential
  handling, propagation and sampling across trust boundaries, authenticated
  transport, receiver exposure, access and tenant isolation, and retention.
  Check auto-instrumentation, exception records, and telemetry pipeline logs as
  well as explicit application fields.
- Independently recompute peak series and event or byte volume from the inputs.
  Include exporter-added labels, series churn, sampling placement, replicas,
  retries, retention, and relevant billing units. Check peak and normal load,
  delivery failure, and application overhead against the available budgets.
  Mark vendor cost unknown when price or volume is missing.
- Check whether controls preserve the evidence needed for diagnosis and SLOs.
  Flag dropped diagnostic signals and sampled denominators.

## Reviewer B · Observability effectiveness

- Trace the real entry point to the user-visible outcome. For each in-scope
  level, tie implementation to the guide's principle and independently verify
  its acceptance evidence. Name any missing instrumentation, broken query, or
  unproven claim.
- Reconstruct a failure from the alert or dashboard through trace to log and
  identify the affected journey and dependency. Verify SLI event semantics,
  alert math and routing, alert recovery, and behavior with sparse or absent
  traffic. Exercise representative retries, fan-out, or queues when in scope.
- Check that sampling, redaction, and cardinality limits preserve the diagnosis
  path. Use approved data and destinations when suggesting fixes.

## Reports and reconciliation

Ask each reviewer for the candidate identifier and one status per reviewed
item (`pass`, `finding`, or `unverified`). Findings should include severity,
the affected level, a file or query reference, observed or expected behavior,
and a proposed fix or check. Each reviewer should list what they ran, evidence
limits, and any risk outside their primary assignment.

Compare both reports against the artifacts. Resolve conflicts with a
reproducible local query or fixture where possible. After a fix, rerun the
relevant acceptance checks and return the changed candidate for targeted
verification. Report any remaining severe findings or verification gaps
before recommending rollout. Keep independent review status explicit when a
reviewer is unavailable or a material change remains unreviewed.
