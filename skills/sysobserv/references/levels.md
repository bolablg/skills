# Seven levels of system observability

The level names and order come from [Devoops' seven levels of observability](https://www.instagram.com/reel/De4iU2vMW7X/).
Choose the project's equivalents for collection, storage, and routing. The checks
below describe the behavior to prove regardless of vendor.

Before first export, apply field allowlists across signals. Inspect span
attributes and events, SDK and collector diagnostics, and automatic
instrumentation as well as application logs. Run a controlled fixture with
synthetic sensitive values and verify their absence at every configured sink.

## 1. Logs

**Principle.** An operator can reconstruct meaningful events in order and
identify the failure reason.

1. Reuse the application logger. Define stable event names, UTC timestamps,
   severity, service, environment, version, outcome, and bounded reason codes.
   Leave hooks for active trace context and any existing opaque request ID.
2. Log meaningful boundaries or state transitions. Assign ownership for error
   logging to avoid emitting the same exception at every layer. Allowlist fields
   at capture and inspect auto-instrumentation, serializers, and exception
   messages for credentials, personal data, raw payloads, and query values.
3. Run the journey to completion and through an expected failure. Query by
   service, event, and outcome. Verify timestamps, event shape, useful failure
   context, and absence of synthetic sensitive values in exported records.

## 2. Metrics

**Principle.** An operator can see trends in traffic, errors, duration, and any
saturation that affects the journey.

1. Choose measurement boundaries and decide whether each instrument counts user
   operations or internal attempts. Reuse existing metric names, units, and
   instruments where semantics match. Emit counters for events, aggregatable
   histograms for duration, and gauges for values such as queue depth.
2. Record one terminal outcome per eligible operation for the user-facing
   denominator, including operations that expire without completing. Measure
   retries separately. Use route templates and bounded
   dimensions. Include relevant latency thresholds as explicit histogram bucket
   boundaries when using classic histograms for threshold-based SLIs.
3. Drive known successful, failing, and delayed operations. Compare metric
   deltas and histogram counts to the fixture. Check dashboard queries for
   correct units, counter resets, traffic weighting, and missing or zero traffic.
   Compute ratios from aggregated numerators and denominators, and aggregate
   histogram buckets before computing fleet-wide quantiles.

## 3. Traces

**Principle.** A representative operation reveals where time was spent and
which component failed.

1. Initialize the existing tracing SDK at the supported startup hook. Set
   resource identity, use supported automatic instrumentation, and add spans
   where application work is missing. Avoid duplicate spans for the same layer.
2. Propagate context through trusted HTTP/RPC and message boundaries using
   supported propagators such as W3C Trace Context. Use span links where work
   represents multiple inputs or separate asynchronous operations. Use bounded
   span names and capture safe dependency, duration, status, and retry details.
3. Trace the fixture across each expected boundary and validate parentage or
   links, errors, and timing. Compare trace retention for successes, slow
   operations, and failures under the configured sampler. Metrics used for SLOs
   must continue to count independently of trace sampling.
4. For tail sampling, route spans with the same trace ID to the same decision
   point. Bound pending trace memory and size the decision window from observed
   span arrival delays. Verify delayed errors and late-span behavior under
   representative queue lag. For work that exceeds a practical decision window,
   use linked traces and a safe operation ID.

## 4. Correlation

**Principle.** An operator can connect the affected operation, its trace, and
the logs that explain what happened.

1. Enrich logs from the active span with its trace and span IDs. Preserve a
   separate request or job ID where clients or workflows already depend on it.
   Use documented propagation at queues and concurrent execution boundaries.
2. Align service identity, environment, and timestamps across signals. Configure
   log-to-trace and trace-to-log lookup. Add metric exemplars where supported
   without introducing trace IDs as metric labels.
3. Treat inbound context as untrusted at public boundaries. Apply the service's
   policy for restarting or accepting context and honoring incoming sampling
   flags. Strip external baggage unless explicitly allowlisted, and restrict
   outbound context and baggage to intended destinations. Test malformed
   context, concurrent requests, queue processing, and an unsampled trace.
   Verify exemplars open retained traces where available. For missing traces,
   verify that time, service, and safe log fields still support triage.

## 5. Alerts

**Principle.** A person is interrupted only when action is needed.

1. Start from user-impacting symptoms and name the owner and response. Define
   severity, evaluation and recovery, deduplication or inhibition, dashboard,
   and runbook. Use ticket routing for conditions with a slower response horizon.
2. Use interim symptom thresholds where needed. At level 6 replace or refine
   paging with error-budget burn when an SLO covers the symptom. Keep useful
   alerts for risks such as telemetry loss or near-term capacity exhaustion when
   the owner can act.
3. Test rule evaluation and routing to a test receiver. Cover firing,
   suppression of duplicates where relevant, recovery, no data, and low traffic.
   Give signal loss its own handling so an empty query does not imply health.

## 6. SLOs

**Principle.** Reliability is measured from the user's experience and alerts
reflect how quickly the system is exhausting its reliability allowance.

1. Define each service level indicator (SLI) in terms of eligible and good
   events at a named boundary. State the latency threshold if relevant and
   explicitly classify timeouts, retries, cancellations, and excluded traffic.
   For an asynchronous journey, establish eligibility when the operation is
   accepted. Resolve the operation once from durable completion or the
   user-visible deadline so lost work and redelivery count correctly. Use
   durable event accounting where a process restart could lose outcomes.
2. Define each service level objective (SLO) with an owner, target and window.
   Use the user's target or mark a proposed target as provisional. Record any
   existing service level agreement (SLA) separately as an external commitment.
   For a request-based SLO, error-budget fraction is `1 - target`, observed bad
   fraction is `bad / eligible`, and burn rate is the ratio of those fractions.
   Calculate request allowance over the matching population and window.
3. Use short and long window pairs for fast and slow burn where appropriate.
   Within each pair require both windows to exceed its threshold. For example,
   on a 30-day window 14.4× burn for one hour represents 2% of the budget at
   representative traffic. Choose handling for low or zero traffic and missing
   telemetry explicitly. Synthetic probes can complement sparse real traffic.
4. Validate queries and alerts against known totals, a brief spike, a sustained
   failure, recovery, and an empty window. A trace sample is insufficient to
   validate SLI counts. For asynchronous work include a missing completion,
   duplicate delivery, and late completion after the deadline.

## 7. Cardinality

**Principle.** Telemetry keeps its diagnostic value as traffic and the number of
distinct entities grow.

1. List metric labels and indexed log and trace dimensions. Normalize paths and
   other dynamic values before emission. Use bounded sets such as route template,
   method, environment, and status class. Keep request, user, session, and trace
   IDs out of metric labels and high-cardinality indexes. Keep approved detail
   in appropriately protected fields and use trace or log lookup for diagnosis.
2. Bound distinct series per instrument and backend by multiplying possible
   label combinations, with exporter-added dimensions such as instance and
   region. For classic Prometheus histograms, multiply each combination by the
   bucket series including +Inf, plus sum and count. Check observed concurrent
   series and churn as well as theoretical ceilings. Use actual backend billing
   units for native histograms or other backends.
3. Estimate retained logs and spans using peak and normal events per second,
   bytes per event, effective sampling or filtering, and retention. Count
   pre-sampling load and pending trace buffers on collectors, replicas, fan-out, query charges, and egress
   where relevant. Measure CPU, memory, and latency overhead under representative
   traffic, including an unavailable exporter with bounded queues and retries.
4. Vary high-entropy request fields in a controlled fixture and verify that
   series and index growth stay within the declared bounds. Re-run the diagnosis
   path after filtering, aggregation, or sampling changes to prove it still
   works. Record measured values, estimates, and missing rates separately.

Implementation references: [OpenTelemetry context propagation](https://opentelemetry.io/docs/concepts/context-propagation/),
[OpenTelemetry sensitive data handling](https://opentelemetry.io/docs/security/handling-sensitive-data/),
[OpenTelemetry sampling](https://opentelemetry.io/docs/concepts/sampling/),
[Prometheus instrumentation](https://prometheus.io/docs/practices/instrumentation/), and
[Google SRE Workbook on SLO alerting](https://sre.google/workbook/alerting-on-slos/).
