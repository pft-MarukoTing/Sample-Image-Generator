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
