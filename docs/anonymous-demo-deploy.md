# Anonymous demo deploy (double-blind review)

For blind submission, do **not** link `https://jennifershao11.github.io/...` in the paper. Host the demo under a **topic-named** GitHub organization, same pattern as:

- [VocalBench](https://vocal-bench.github.io/Has_Audio_Deepfake_Been_Solved_The_First_Benchmark_for_Active_Defense_Methods_Against_Audio_Deepfake/)
- [SecJS-Benchmark](https://secjs-vuln-benchmark.github.io/SecJS-Benchmark/)

## Recommended naming

| Item | Suggested value | Resulting URL |
|------|-----------------|---------------|
| GitHub **organization** | `aila-bench` | (no personal username in URL) |
| **Repository** | `AILA-Bench` | matches benchmark name in the paper |
| **Live demo** | — | `https://aila-bench.github.io/AILA-Bench/` |

Alternative if you prefer the SCLN acronym in the URL:

- Org `scln-bench`, repo `SCLN-Bench` → `https://scln-bench.github.io/SCLN-Bench/`

The CI workflow already sets `VITE_BASE_PATH=/<repo-name>/`, so assets work as long as the repo name matches the path segment.

## One-time setup (you must do this in the browser)

1. **Create a new GitHub account** (or organization) used only for blind review, e.g. `aila-bench`.
   - Use an email not tied to your name in the public org profile.
   - Do not list your university or real name on the org page.

2. **Create a public repository** named exactly `AILA-Bench` under that org.

3. **Push this codebase** to the new repo (mirror or fresh push):

   ```bash
   git remote add anonymous https://github.com/aila-bench/AILA-Bench.git
   git push anonymous main
   ```

   Optional: use anonymous git author for this push only:

   ```bash
   git -c user.name="AILA-Bench" -c user.email="anonymous@users.noreply.github.com" push anonymous main
   ```

4. **Enable GitHub Pages**
   - Repo → **Settings → Pages**
   - **Build and deployment → Source**: **GitHub Actions**
   - Save

5. **Wait for the workflow** `.github/workflows/deploy-demo.yml` to finish (Actions tab).

6. **Verify** `https://aila-bench.github.io/AILA-Bench/` loads Overview, Demo, Cases, and Results.

7. **Paper link** — use only the anonymous URL, e.g.:

   ```latex
   \url{https://aila-bench.github.io/AILA-Bench/\#demo}
   ```

## After acceptance

- Point the canonical URL to your personal or lab account if you wish.
- Archive or delete the blind-review org if it is no longer needed.

## Local preview (same base path as GitHub Pages)

```bash
cd demo
npm run build:pages
npm run preview:pages
```

Open the URL shown in the terminal (paths under `/AILA-Bench/`).
