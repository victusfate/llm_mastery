# Hosting the course

Primary course domain: https://llmmastery.org/

Cloudflare Pages project: `llm-mastery`. Publish from an authenticated local checkout with `npm run deploy:cloudflare`. The custom domain points to `llm-mastery.pages.dev`; Cloudflare manages HTTPS. GitHub Actions validates pushes to `main`, then runs independent deployment jobs for Cloudflare and the GitHub Pages mirror. Cloudflare automation requires the API token described below; local deployment remains available.

The course is static HTML, CSS, JavaScript, Markdown, and MP3. No application server, database, paid inference service, or API key is required. Progress stays in the browser; export it to move between domains or devices.

## Local preview

Run `npm run dev` and visit http://127.0.0.1:8765/site/.
Browser visits to local Markdown URLs redirect to the formatted reader. To request the original source, append `?raw=1`.

## GitHub Pages

The GitHub Actions workflow installs the locked dependencies, checks types and tests, then builds and publishes `dist` from `main`. The root page forwards to `site/`. All asset and reader URLs support the repository prefix.

Course: https://victusfate.github.io/llm_mastery/

See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Cloudflare Pages

Build command: `npm run build`. Output directory: `dist`. Framework: none. Install dependencies with `npm ci` first. The build copies only public course assets and documents; generated checkpoints and private files are excluded. Start from a fresh checkout for production builds.

### GitHub Actions credentials

In the repository’s Settings → Secrets and variables → Actions, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Create a dedicated token in Cloudflare with Account → Cloudflare Pages → Edit, scoped to the hosting account. Never commit the token. See [Cloudflare’s CI setup guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

Both repository secrets are configured. Successful pushes to `main` automatically publish to Cloudflare Pages and the GitHub Pages mirror. Forks need their own credentials and hosting project. Pages Edit is an account-level permission covering Pages projects in that account; it cannot be restricted to the `llmmastery.org` zone. The workflow explicitly targets the `llm-mastery` project.

The workflow uses the locked Wrangler dependency to upload `dist` to `llm-mastery` on its production branch `main`. Pull requests never deploy.

### Local fallback

For a direct upload, authenticate with `npx wrangler login`, then run:

```bash
npm run deploy:cloudflare
```

Associate the chosen hostname in the Pages project's Custom domains settings before adding its DNS record. An apex domain requires a Cloudflare zone; a subdomain can use a CNAME from another DNS provider. See [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Reading links and media

Share formatted documents using `site/read.html?doc=docs/06-resources.md`. In-app Markdown links automatically use this reader. Static hosts may show raw text for a directly pasted `.md` URL; the local preview's automatic redirect is a local convenience. Use the reader URL for consistent behavior on both hosts.

Narration is served as static MP3; external lecture videos load only when selected. Concept explanations and numerical activities run locally. Unknown-term tutor prompts require copying into your preferred tutor. There is no hidden model backend.
