# Hosting the course

The course is static HTML, CSS, JavaScript, Markdown, and MP3. No application server, database, paid inference service, or API key is required. Progress stays in the browser; export it to move between domains or devices.

## Local preview

Run `python3 scripts/serve.py` and visit http://127.0.0.1:8765/site/.
Browser visits to local Markdown URLs redirect to the formatted reader. To request the original source, append `?raw=1`.

## GitHub Pages

Publish the public repository's `main` branch from `/`, with `.nojekyll` disabling Jekyll processing. The root page forwards to `site/`. All asset and reader URLs support the repository prefix.

Course: https://victusfate.github.io/llm_mastery/

See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Cloudflare Pages

Build command: `python3 scripts/build_site.py`. Output directory: `dist`. Framework: none. The build copies only public course assets and documents; generated checkpoints and private files are excluded. Start from a fresh checkout for production builds.

For a direct upload, authenticate with `npx wrangler login`, then run:

```bash
python3 scripts/build_site.py
npx wrangler pages deploy dist --project-name=llm-mastery --branch=main
```

Associate the chosen hostname in the Pages project's Custom domains settings before adding its DNS record. An apex domain requires a Cloudflare zone; a subdomain can use a CNAME from another DNS provider. See [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Reading links and media

Share formatted documents using `site/read.html?doc=docs/06-resources.md`. In-app Markdown links automatically use this reader. Static hosts may show raw text for a directly pasted `.md` URL; the Python preview's automatic redirect is a local convenience. Use the reader URL for consistent behavior on both hosts.

Narration is served as static MP3; external lecture videos load only when selected. Concept explanations and numerical activities run locally. Unknown-term tutor prompts require copying into your preferred tutor. There is no hidden model backend.
