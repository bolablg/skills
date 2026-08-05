# Recruiter and headhunter outreach

## Find relevant people

Prioritize public professional sources:

- recruiting agencies specializing in the candidate's role, industry, or geography;
- named recruiters on employer career or team pages;
- public conference, association, or community directories intended for professional contact;
- recruiter-authored job posts supplied by the user;
- public business contact pages and verified professional email addresses.

Do not buy questionable personal-data lists, guess private email addresses, infer sensitive traits, or collect personal contact information unrelated to recruiting. Do not scrape LinkedIn or automate LinkedIn profile visits, connections, or messages. The agent may draft a LinkedIn message and hand it to the user for manual review and sending.

## Qualify

Record the recruiter's organization, role, geographic and functional focus, evidence source, likely relevance, public destination, and last-verified date. Exclude people whose focus is clearly unrelated or whose identity/contact route cannot be verified.

## Draft

Copy `assets/recruiter-outreach-template.md`. A strong first note is brief and includes:

- why this recipient is relevant;
- the precise target role family and geography;
- one or two verified differentiators;
- a low-friction request to compare notes or receive a résumé.

Do not pretend the candidate knows the recipient, claim a referral, praise work the agent did not inspect, or attach a résumé before the user approves that recipient and channel.

## Approve, send, and follow up

Put exact recipients, destinations, messages, attachments, and follow-up policy in the approval batch. Before each initial contact or numbered follow-up, check `jobhunter-actions.csv` with the privacy-minimized recruiter target key described in `references/action-log.md`. Record the guarded attempt immediately before sending; refuse duplicates unless the user approves that exact retry.

Respect the configured daily limit and do not mass-message. Use email only when the address is publicly offered for professional contact or supplied by the user. Use manual handoff for LinkedIn.

Append every meaningful outcome to the root action log and update the recruiter ledger with `drafted`, `approved`, `sent-manual`, `sent`, `replied`, `follow-up-due`, `closed`, or `do-not-contact`. Stop all outreach to anyone who declines or asks not to be contacted. Never send more follow-ups than configured.
