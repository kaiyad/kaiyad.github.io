# Portfolio — Kailash Yadav

Dark-mode portfolio built as a static site for GitHub Pages.
Design inspired by [rybkr.com](https://rybkr.com/) — a minimal, vim-themed
single page with a statusline, command palette, and keyboard navigation.

## Sections

- **Home** — headshot + About / Currently / Hobbies
- **Projects** — feature highlights from public GitHub repos
- **Resume** — skills and experience

## Keyboard navigation

- `:` a command (`:help`, `:projects`, `:theme`, …)
- `/` or `⌘K` — quick search
- `?` — show shortcuts
- `j`/`k`, `Ctrl+d`/`Ctrl+u`, `gg`/`G`, `{`/`}` — scroll

## Local development

No build step. Open the file directly in a browser:

```sh
open index.html
```

Or serve it:

```sh
python3 -m http.server 8000
```

## Deployment (GitHub Pages)

Pushing to `main` triggers the `.github/workflows/deploy.yml` workflow, which publishes the site.

**One-time setup** (if not already done):

1. In the repo settings → **Pages**, set **Source** to **GitHub Actions**.
2. If you want it at `https://kaiyad.github.io/`, push to the `kaiyad.github.io` repo (rename/push this project there). For a project repo, the site will be at `https://kaiyad.github.io/<repo-name>/`.

## Custom domain (later)

Add a `CNAME` file with your domain, and set the domain under repo settings → Pages.