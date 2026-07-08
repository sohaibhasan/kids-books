---
description: Pre-push verification sweep
---

Run each step in order and report any failures before pushing to `main`.

1. **Build, lint, and test** — prefix with the nvm PATH export so Node is on PATH:
   ```bash
   export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
   npm run build && npm run lint && npm test
   ```
   Stop and report the failure if any step exits non-zero.

2. **Diff review** — show the size of what will be pushed:
   ```bash
   git diff origin/main --stat
   ```
   Read the summary and flag any unexpectedly large or unrelated files.

3. **Stray `console.log` check** — grep added lines for console.log outside `lib/jobs/` (which logs intentionally):
   ```bash
   git diff origin/main | grep '^+.*console\.log' | grep -v 'lib/jobs/'
   ```
   Flag any hits; remove them before pushing.

4. **Secret scan** — grep added lines for credential patterns:
   ```bash
   git diff origin/main | grep -E '^\+(sk_live|ghp_|AIza|hf_)'
   ```
   If anything matches, **stop immediately**. Do not push until the credential is removed from the diff and, if it was ever committed to history, rotated at the provider.

5. **Staged `.env` files** — confirm no `.env*` file is about to be committed:
   ```bash
   git diff --cached --name-only | grep '\.env'
   ```
   If any match, unstage them and abort.

6. **Summary** — report:
   - Build / lint / test: pass or fail (with error excerpt if fail)
   - Diff size: N files changed, +X −Y lines
   - console.log hits: none, or list them
   - Secret scan: clean, or BLOCKED
   - Staged .env files: none, or BLOCKED

   End with a clear verdict: "Ready to push" or "Blocked — fix X before pushing."
