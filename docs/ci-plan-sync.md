# CI Plan Sync Setup

This repository includes a workflow that syncs milestones from `gemini-canvas-extension.plan.md` into:
- GitHub Issues (idempotent create/update)
- GitHub Project v2 items (`https://github.com/users/davidacres/projects/4/`)

Workflow file: `.github/workflows/plan-sync.yml`

## What the workflow does
- Parses the Milestones table in `gemini-canvas-extension.plan.md`
- Ensures one issue per milestone (`M0`, `M1`, ...)
- Re-runs safely (updates existing issues instead of creating duplicates)
- Adds issues to Project v2 if missing
- Sets project `Status` behavior:
  - New item defaults to `Backlog`
  - Manual moves (`Ready`, `In Progress`, `In Review`) are preserved
  - Closed issues are forced to `Done`
  - Reopened issues move from `Done` back to `Backlog`

## Required authentication for Project sync
Issue sync can run with the default `GITHUB_TOKEN`, but Project v2 updates often require a PAT.

Create a fine-grained personal access token:
1. Open `https://github.com/settings/personal-access-tokens/new`
2. Select **Fine-grained personal access token**
3. Resource owner: `davidacres`
4. Repository access: `davidacres/gemini-canvas-extension`
5. Set permissions:
   - Repository permissions:
     - `Issues`: `Read and write`
   - Account permissions:
     - `Projects`: `Read and write`
6. Generate token and copy it

Store token as an Actions secret:
1. Open `https://github.com/davidacres/gemini-canvas-extension/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `PLAN_SYNC_TOKEN`
4. Value: paste the token
5. Save

The workflow uses:
- `secrets.PLAN_SYNC_TOKEN` if present
- otherwise falls back to `github.token`

## Running the workflow
Manual run:
1. Open `https://github.com/davidacres/gemini-canvas-extension/actions`
2. Select **Sync plan milestones to GitHub issues**
3. Click **Run workflow**

Automatic run:
- Triggered on pushes that change:
  - `gemini-canvas-extension.plan.md`
  - `.github/workflows/plan-sync.yml`

## Troubleshooting
- Warning: `Project sync disabled (could not access project v2)`
  - Usually missing or insufficient `PLAN_SYNC_TOKEN` permissions
  - Confirm token has `Projects: Read and write` and access to the correct owner
- Issues sync works but project status does not change
  - Verify the project has a single-select field named `Status`
  - Verify options include: `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`
