# Contributor Guide: Syncing After History Rewrite

## What Happened

The git history on `main` was rewritten to remove AI attribution lines (`Co-Authored-By`) from 14 commit messages. This means all commit hashes from `3488fcc` onwards have changed. **Your local copy of `main` is now out of sync with the remote.**

## How to Update Your Local Copy

### Option 1: Fresh clone (simplest, recommended if no local work in progress)

```bash
cd ..
rm -rf oscillation
git clone https://github.com/nbarrett/oscillation.git
cd oscillation
pnpm install
```

### Option 2: Force-pull (if you want to keep your local directory)

```bash
git fetch origin
git reset --hard origin/main
pnpm install
```

### Option 3: If you have uncommitted or local branch work

```bash
# First, save your current work
git stash

# Fetch the new history
git fetch origin

# Rebase your local main onto the new remote
git checkout main
git reset --hard origin/main

# If you have a feature branch, rebase it
git checkout my-feature-branch
git rebase --onto origin/main <old-main-hash> my-feature-branch

# Re-apply stashed changes if needed
git stash pop

pnpm install
```

## Ensuring Git Hooks Are Enabled

The project uses git hooks (via `.githooks/`) to enforce commit message standards. If your Claude is adding `Co-Authored-By` lines, your hooks are being bypassed.

### Check your hooks are configured

```bash
# Verify the hooks path is set correctly
git config core.hooksPath

# It should output: .githooks
# If it doesn't, set it:
git config core.hooksPath .githooks
```

### Check hooks exist and are executable

```bash
ls -la .githooks/
chmod +x .githooks/*
```

### AGENTS.md Rules for Claude

Make sure your Claude instance follows the rules in `AGENTS.md`. The critical ones for commits:

1. **NEVER add AI attribution to commit messages** — no `Co-Authored-By`, no `Generated with Claude`, no emoji attribution
2. **NEVER use `--no-verify`** when committing — this bypasses the hooks
3. **NEVER commit without explicit user request**

### If hooks are still being bypassed

Check whether Claude is using `--no-verify` flag on git commits. Search your Claude session for any `git commit --no-verify` calls. The `--no-verify` flag skips all pre-commit and commit-msg hooks.

If you find this happening, explicitly tell Claude: **"Never use --no-verify on git commands"**.

## Questions?

Reach out to Nick if you have issues syncing.
