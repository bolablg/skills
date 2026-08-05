# Discovery and research

## Research sequence

1. Convert target roles into title variants, skill combinations, industries, locations, and negative terms.
2. Search compliant public sources in parallel when available: company career sites, public ATS feeds, search engines, professional associations, government job portals, and specialist recruiter sites.
3. Use employer-owned pages as the authority for whether a role is open and for its current description.
4. Canonicalize URLs, remove tracking parameters, and deduplicate by job ID or company + title + location.
5. Re-open every shortlisted role immediately before preparing or submitting an application.
6. Record source, discovery time, evidence-check time, and first decisive reason in the candidate ledger.

## Prefer sanctioned public feeds

- Greenhouse public job-board GET endpoints require no authentication: https://developers.greenhouse.io/job-board.html
- Lever publishes public postings through its Postings API: https://github.com/lever/postings-api
- Ashby exposes a public job-posting endpoint with optional compensation: https://developers.ashbyhq.com/docs/public-job-posting-api

Use these endpoints only for public discovery. Do not call employer application POST APIs: those generally require employer-owned API credentials and are not applicant automation endpoints. Use the hosted application form when permitted.

## Restricted discovery surfaces

Do not automate, scrape, or submit through LinkedIn or Indeed. Their current official rules prohibit unauthorized bots/agents and automated applications:

- https://www.linkedin.com/help/linkedin/answer/a1341387/prohibited-software-and-extensions
- https://www.linkedin.com/legal/user-agreement
- https://www.indeed.com/legal

For those sources, accept URLs or exported/saved jobs from the user, use permitted connectors explicitly offered by the platform, or give the user manual search instructions. Treat external ATS links reached from those platforms according to the destination's rules.

Workday also prohibits crawling/scraping its website in its published end-user agreement. Treat Workday discovery and form operation as manual unless the applicable tenant provides an authorized interface or terms permitting automation: https://www.workday.com/en-us/legal/end-user-agreement.html

Re-check current terms at execution time because platform rules and interfaces change.

## Job legitimacy checks

Before ranking or applying, look for:

- a matching role on the employer's official domain or recognized ATS;
- a real company identity and consistent recruiter domain;
- no payment, equipment-purchase, gift-card, crypto, or banking request;
- no early request for government IDs, bank details, or background-check secrets;
- plausible compensation, responsibilities, and contact channels;
- no suspicious domain variants, shortened login links, or downloadable executables.

Mark uncertain postings `needs-verification`. Never pay to apply or send highly sensitive identifiers during initial application or outreach.
