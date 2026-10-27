# Generate Sample Images

Create multiple sample images for product demos and testing.

A lightweight, English-language web app for preparing batches of photorealistic sample images. Use your own ChatGPT or Gemini account without an API key, or connect an OpenAI API account for generation inside the app.

## Run locally

Requires Node.js 22 or newer. There are no npm package dependencies.

```bash
git clone https://github.com/pft-MarukoTing/Sample-Image-Generator.git
cd Sample-Image-Generator
npm start
```

Open **http://127.0.0.1:4173**. Run `npm test` to execute the isolated test suite; tests do not call a paid image API.

## ChatGPT / Gemini workflow

1. Enter a name or paste your request.
2. Choose your image settings.
3. Select **ChatGPT / Gemini** and click **Copy image prompt**.
4. Click **Open ChatGPT** or **Open Gemini**, then paste the prompt yourself.
5. Generate and download photos in that platform.

This mode does not require an API key, create upload slots, or operate your ChatGPT/Gemini account. Your account's features and usage limits apply. A ChatGPT subscription is not API credit. The prompt asks for separate images, not a collage; the platform may need multiple turns to complete a batch.

## Image settings

- **Background:** clean studio background or a natural setting.
- **Gender:** female, male, or a 50/50 split. With an odd count, one extra female image is assigned.
- **Image count:** 1–100 per batch.
- **Age range:** configurable minimum and maximum, 0–100.
- **Framing:** face, half body, or full body.
- **Aspect ratio:** 1:1, 4:3, 3:4, 16:9, 9:16, or Random mix. Default: 4:3.
- **Clothing style:** follow request, formal, smart casual, casual, sporty, streetwear, or Random mix.
- **Season:** any, spring, summer, autumn, winter, or Random mix.
- **Regional background:** hierarchical multi-select, including Western, Latin American, Asian, African, and Middle Eastern backgrounds. Asian options include East, Southeast, and South Asian subgroups, with options such as Japanese, Korean, and Taiwanese backgrounds.

Parent checkboxes select all descendants; partially selected groups show a mixed state. Selecting broad regions distributes images across their subregions. Regional and cultural labels are not treated as fixed physical appearances. Clear the selection for no regional restriction.

Random mixes vary settings across images; larger batches repeat the available options. Ratios and regional background assignments are consistent between copied prompts and API jobs. User-entered text is preserved, including non-English requests.

## OpenAI API mode

Choose **My API key**, enter your own OpenAI API key, and generate inside the app. Only OpenAI is currently implemented as an API provider; the Gemini option opens its website and is not an API integration.

- Default model: `gpt-image-2`, configurable with `OPENAI_IMAGE_MODEL`.
- Without a reference image: `POST /v1/images/generations`.
- With a reference image from Advanced settings: multipart `POST /v1/images/edits`.
- Each request generates one independent image, with a global concurrency limit of two.
- The app displays image count, payer, and an unavailable cost estimate before paid generation. It does not invent prices.
- Queue status and results are saved. Canceling stops only queued requests.
- Regeneration preserves previous versions. Download individual images or a ZIP containing photos and JSON/CSV manifests.
- Busy-state checks and request IDs prevent duplicate submissions. After a restart, interrupted jobs require an explicit retry rather than automatically repeating a potentially billed request.

Actual model access, supported sizes, image quality, and charges depend on the API account. No live paid API generation was performed during development. API request contracts and error handling are covered with test doubles.

## Company API accounts

Company mode stays unavailable until both the account configuration and company API key exist on the server.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Company API key; server secret only. |
| `COMPANY_USERS_JSON` | Account configuration containing salts, scrypt hashes, initial image quotas, and admin flags. |
| `OPENAI_IMAGE_MODEL` | Optional model override; defaults to `gpt-image-2`. |
| `PORT` | Optional listen port; defaults to `4173`. |
| `DATA_DIR` | Optional persistent storage directory; defaults to `data/`. |
| `COOKIE_SECURE=1` | Enable Secure cookies behind an HTTPS reverse proxy. |

Generate an account configuration with Python 3:

```bash
python3 tools/make-user.py alice --quota 100 --admin
```

The password is entered without echo and is not written to a file. Configure the resulting JSON and the API key through your server's secret manager, not in source control. Merge multiple users into one JSON object. Omit `--admin` for ordinary accounts.

Account workspaces are private. Administrators can change image quotas in Advanced settings. Queued jobs reserve quota; started requests consume it even if they fail or are interrupted, because they may already have incurred charges. This is an application image-count allowance, not a dollar spending cap. Login sessions expire after eight hours and are cleared when the server restarts.

## Advanced settings

`/advanced.html` retains the asset list editor, JSON/CSV import and export, optional reference images, manual uploads, version management, company quota controls, and explicitly labeled demo mode. These controls are not required for the main copy-prompt workflow. Demo output is excluded from the main photo results.

`examples/hair-test.json` contains a synthetic 30-image Hair Bang / Volume / Wavy template.

## Security and deployment limits

- Personal API keys are held only in server memory and are isolated by workspace. They are not returned to the client, logged, placed in URLs, or stored on disk. Users can delete them; restart requires re-entry.
- Company keys come only from server environment variables.
- Private image routes validate the HttpOnly, SameSite session cookie. JSON mutations enforce origin checks.
- `data/` contains private task records and images and is excluded from Git. It must not be publicly served. Image and task data are not encrypted at rest by this application.
- The server binds only to `127.0.0.1` and accepts `localhost` / `127.0.0.1` host headers. It is not an Internet-ready deployment by default.
- Production requires an HTTPS reverse proxy, secure cookies, persistent storage, backups, retention policies, capacity limits, monitoring, and provider billing reconciliation. Preserve the localhost upstream Host header.
- JSON file storage and in-process quota/queue locking support one Node process. Before horizontal scaling, migrate to database transactions, a durable queue, object storage, and distributed locking.
- For company-wide use, replace the local account configuration with your organization's SSO/OIDC and account management. Long-term personal-key storage would require encryption and a managed key service.

## Project layout

```text
server.mjs            HTTP server, sessions, accounts, quotas, jobs, private files
planner.mjs           Validated batch planning and prompt expansion
providers.mjs         Mock / personal / company provider adapters
public/               Main English UI, shared settings modules, advanced UI
examples/             Synthetic import template
tools/make-user.py    Password-hash configuration helper
test.mjs              Provider, planning, queue, isolation, and permission tests
```

API references: [Image generation](https://developers.openai.com/api/docs/guides/image-generation), [Image edits](https://developers.openai.com/api/reference/resources/images/methods/edit).
