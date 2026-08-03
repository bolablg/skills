# Host and cloud compatibility

Product Challenger is an instruction package, not a server, model, or cloud service. The portable core is the `SKILL.md` directory plus its Markdown references and templates.

## Minimum host capability

Any agent can use Product Challenger if it can read Markdown instructions and hold the relevant project context in a conversation or file. In a host without native Skill support, load or paste `SKILL.md` and provide the project ledger manually.

## Recommended host capability

| Capability | What Product Challenger gains |
| --- | --- |
| Skill/Agent Skills support | Reusable installation and automatic or explicit activation |
| Project/file memory | Persistent ledger, briefs, evidence, and decisions |
| Web research | Current competitors, regulation, pricing, adoption, and cited evidence |
| File creation | Reusable ledgers, reports, and decision memos |
| Secure secrets/tool settings | Safe access to private data or research APIs, when the host provides them |

## Deployment patterns

| Where it runs | Installation pattern | Limitation |
| --- | --- | --- |
| ChatGPT cloud workspace | Upload/install as a ChatGPT Skill, then use it in Projects | Availability and automatic invocation depend on the workspace and plan. |
| Codex or another Skill-capable desktop/CLI agent | Place the `product-challenger/` directory in that host’s configured skills location | Follow the host’s discovery/restart rules. |
| Cloud-hosted agent service | Bundle or mount the directory with the agent deployment and expose research/file tools separately | The skill does not create web search, persistence, or credentials by itself. |
| Any general chat agent | Supply `SKILL.md` plus the relevant template/reference files as context | Invocation and persistence are manual. |

## Portability rules

- Keep the skill free of operating-system paths, local executables, and provider-specific credentials.
- Detect available tools at runtime. Use web research only if the host provides it.
- Treat host memory as fallible; keep important decisions in an export or ledger.
- Keep credentials, customer data, and tool permissions in the host’s own secure settings. Do not put them in the skill.
- Do not claim a host supports automatic installation or web research unless that host documents it.

The optional `agents/openai.yaml` file is display metadata for OpenAI products. Other hosts can ignore it; the root `SKILL.md`, `references/`, and `assets/` remain portable.
