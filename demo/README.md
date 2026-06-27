# AILA-Bench Demo Site

Static site for the paper demo (Overview, interactive frame, case gallery, RQ1–RQ5 results).

## Local development

```bash
npm install
npm run dev -- --port 5190 --host 127.0.0.1
```

Open http://127.0.0.1:5190

## Build

```bash
# Netlify Drop / root hosting (base path /)
npm run build

# GitHub Pages project site (repo name must match path)
npm run build:pages
npm run preview:pages
```

Output: `dist/`

## GitHub Pages (automatic)

Workflow: `.github/workflows/deploy-demo.yml` (builds `demo/` with `VITE_BASE_PATH=/<repo-name>/`).

**One-time setup on the hosting repo:**

1. Settings → **Pages** → **Source**: **GitHub Actions**
2. Push to `main`

**Double-blind submission:** use a topic-named org, not a personal account. See [docs/anonymous-demo-deploy.md](../docs/anonymous-demo-deploy.md).

Example (anonymous):

- Org: `aila-bench`, repo: `AILA-Bench`
- Live URL: `https://aila-bench.github.io/AILA-Bench/`

## Share UI without GitHub (Netlify Drop)

1. `npm run build`
2. Open https://app.netlify.com/drop
3. Drag the `dist/` folder onto the page
4. Share the generated `*.netlify.app` URL (also avoids personal GitHub username if configured anonymously)
