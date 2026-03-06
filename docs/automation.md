# Automation model

This repository uses GitHub Actions to keep planning, board state, and PR flow aligned.

## How work starts
1. Plan milestones are defined in `gemini-canvas-extension.plan.md`.
2. `plan-sync.yml` creates or updates one milestone issue per phase (`M0`..`M8`).
3. Work starts when a milestone issue is moved to `Ready` or assigned.
4. Board status then updates automatically from issue/PR events.

## Workflows
- `.github/workflows/plan-sync.yml`
  - Source of truth sync from plan file -> issues + project items
  - Triggers:
    - `push` to plan/workflow file
    - `issues` lifecycle events
    - `schedule` hourly reconciliation
    - `workflow_dispatch`

- `.github/workflows/board-automation.yml`
  - Keeps Project v2 Status aligned to issue/PR lifecycle
  - Status model:
    - `Backlog`, `Ready`, `In Progress`, `In Review`, `Done`
  - Rules:
    - Closed issue -> `Done`
    - Reopened issue -> `Backlog` (unless labels override)
    - Assigned issue -> `In Progress`
    - PR opened/reopened/ready_for_review (non-draft) -> `In Review`
    - PR draft or converted_to_draft -> `In Progress`
    - Merged PR -> `Done`

- `.github/workflows/pr-automation.yml`
  - PR labels/reviewers/auto-merge helper
  - Label behavior:
    - Draft PR -> `wip`
    - Ready PR -> `needs-review`
    - Approved review -> `ready-to-merge`
  - Optional auto-merge:
    - Add label `automerge` to a PR
    - Workflow attempts to enable GitHub auto-merge (still requires branch protection checks/approvals)
  - Optional reviewer assignment:
    - Set repository variable `AUTO_REVIEWERS` to comma-separated GitHub usernames

- `.github/workflows/weekly-status-report.yml`
  - Weekly summary issue for milestone progress

## Required repository settings
- Branch protection on `main` should require:
  - Pull request before merge
  - Required checks
  - Required approvals
- Optional: CODEOWNERS for deterministic reviewer routing

## Required secrets
- `PLAN_SYNC_TOKEN` (recommended classic PAT)
  - scopes:
    - `repo` (or `public_repo`)
    - `project`

## What is and is not fully automatable
- Automated:
  - task generation from plan
  - board status updates from issue/PR lifecycle
  - reviewer requests
  - enabling auto-merge when labeled and allowed
- Not bypassed by automation:
  - mandatory human approvals from branch protection
  - required checks and policy gates
