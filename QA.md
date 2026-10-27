# Verification

## Automated tests

`npm test` currently contains 14 passing tests, with no paid API requests.

Coverage includes:

- One-image OpenAI generation requests, error handling, and multipart reference-image requests using test doubles.
- Required form inputs, gender distribution, and size defaults.
- Clothing / season combinations and per-image mixed outfits.
- Fixed and mixed aspect ratios, consistent copied prompts and API dimensions.
- Hierarchical regional selection, parent expansion, deduplication, subregion distribution, and validation.
- Private task and image isolation between workspaces.
- Concurrency limit of two, queuing, duplicate suppression, cancellation, and explicit retries.
- Regeneration and selection of preserved image versions.
- Manual uploads and deletion of memory-only API keys.
- Company login, quotas, and administrator authorization.

ZIP output was separately checked for UTF-8 filenames, CRC integrity, and matching file contents.

## Browser checks

- English homepage, dialogs, notifications, and legacy scene-label display.
- Copy-prompt workflow without an API key; links for ChatGPT and Gemini.
- No upload/result cards in ChatGPT/Gemini mode; result area only in API mode.
- Fixed and mixed ratios, clothing and season controls, persisted draft settings.
- Regional parent/child multi-select and partially selected parent indicators.
- Soft custom menus, selected checkmarks, keyboard arrow / Enter selection, and synchronized summaries.
- Earlier demo workflow: 3-image trial, 27-image remainder, saved progress, and ZIP download, with explicit placeholder labeling.

## Limits

No real API key was provided, so live paid generation, actual provider/account model-size compatibility, and invoice reconciliation remain unverified. No public deployment or multi-user load testing has been performed. See README for production requirements.


## Vercel filesystem regression (2026-10-27)

- `npm test`: 15 passing tests, including the existing local queue, image versions/uploads, private downloads, key deletion, company authentication/quota and planner/provider contracts. No paid image API was called.
- New serverless test imports the exact `api/index.mjs` entry with `VERCEL=1`, a forbidden `/var/task/data` override, and filesystem writes instrumented to throw. Cold start, homepage and JS/CSS modules work without writing files.
- Production/preview Host headers and same-origin requests work; untrusted hosts/origins are rejected.
- Stateless state creates no cookie and returns no shared History; all write/key/upload/generation endpoints are blocked before credentials or billing.
- Browser check in Vercel mode: homepage renders the storage notice and disabled API method; Hair Bang example -> Copy image prompt succeeds; ChatGPT/Gemini links remain available.
- Persistent Blob/Postgres/queue integration is not implemented. Vercel mode intentionally does not store images or History. Deployment status is verified separately through the linked GitHub/Vercel check after push.
