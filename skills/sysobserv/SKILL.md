---
name: sysobserv
description: Implement or assess system observability across logs, metrics, traces, correlation, alerts, SLOs, and cardinality. Use when instrumenting a user journey, improving a telemetry stack, or validating that operators can detect and diagnose failures within security and cost constraints.
license: MIT
---

# System Observability

Implement the seven levels on a critical user journey using the project's existing
telemetry stack and configuration conventions. Start with the smallest slice that
can prove the journey is observable. Expand across journeys only within the request.

## 1. Establish the baseline

- Determine the requested mode: assess existing coverage, design a plan, or
  implement and verify. Respect the requested services and environments.
- Map the journey from entry point to user-visible outcome, including asynchronous
  work, retries, dependencies, trust boundaries, and owning teams. Choose a
  representative success and failure case. Record what each operator needs to
  detect, diagnose, or act on.
- Locate instrumentation, collectors, queries, dashboards, alert routing, SLO
  definitions, and environment configuration. Trace the real entry points and
  measure available baseline volume, overhead, and current coverage. Record
  missing inputs and assumptions. Use local fixtures to make progress when
  deployed environments or billing data are unavailable.
- Set initial field, label, retention, and volume bounds before adding signals.
  Work out SLI event semantics early so the new metrics can support level 6.

For a live staging test, resolve the service alias to the deployed revision.
Confirm the synthetic identity or fixture can reach the intended app boundary,
that the required signals can be queried for this deployment, and that alerts
have a test receiver. Record which checks can run before generating traffic.
Distinguish infrastructure protection, application authentication, and the
journey's outcome. Record missing access or plan-gated data as a verification
gap. A smoke check confirms only the boundaries it actually exercises.
Match each controlled request to its telemetry using a request or trace
identifier. State when a fixture uses a separate admission path, simulates a
dependency failure, or replays telemetry through a test alert rule.

## 2. Implement and prove each level

Read [the implementation guide](references/levels.md). Walk through the levels
in order. For each, record the principle, repo-specific implementation, and
observable evidence. Reuse existing coverage if it passes the check. For scoped
work, assess relevant dependencies and mark other levels out of scope. For plan
or audit work, label proposed and unverified changes accordingly.

| Level | Evidence to produce |
| --- | --- |
| 1. Logs | A query finds safe, structured events for the chosen outcome and failure. |
| 2. Metrics | Counters and latency distributions reflect known traffic, errors, and time spent. |
| 3. Traces | One operation is visible across the instrumented boundaries, including the slow or failing span. |
| 4. Correlation | An operator can navigate between a retained trace and matching logs using shared context. |
| 5. Alerts | A user-impacting condition triggers the intended action and recovers as designed. |
| 6. SLOs | A user-facing SLI, target, window, and error budget agree with fixture data and alert rules. |
| 7. Cardinality | Observed and projected telemetry volumes stay within explicit limits without losing required evidence. |

Use normal app entry points and exercise success, failure, and telemetry
backpressure in a controlled environment. Verify backend queries when access is
available. When rollout is in scope, define a canary, rollout criteria, and a
rollback path. Keep telemetry export, deployment, and live paging within the
environments and destinations authorized for the task.

## 3. Run two independent reviews in parallel

Read [the review protocol](references/review.md). Once the candidate changes and
evidence are ready, dispatch both read-only reviewers via the host's available
parallel delegation mechanism before waiting for either. Give both the same
candidate and scope in separate contexts.
One independently checks security and cost effectiveness. The other checks
whether the implementation delivers the principles of the seven levels.

Reconcile findings, fix issues within scope, rerun affected checks, and return
material revisions to the relevant reviewer for verification. If the host lacks
parallel delegation, do both checks locally and report that independent review
remains unverified.

## 4. Hand off

Report the journey and environment, the status and evidence for each level, the
outcome of both reviews, open risks, and measured versus estimated telemetry
cost. Link to changed code or configuration and the queries or test results that
support the claims. If rollout is in scope, include rollout status and rollback.
