# Automation model

This repository uses GitHub Actions to keep planning, board state, and PR flow aligned.

## How work starts
1. Plan milestones are defined in `gemini-canvas-extension.plan.md`.
2. `plan-sync.yml` creates or updates:
  - one milestone issue per phase (`M0`..`M8`)
  - one parent orchestration issue labeled `plan-orchestrator`
3. Move a milestone issue to `Ready` or assign it to an allowed kickoff assignee.
4. `kickoff-phase-work.yml` checks dependencies and parallelism, then dispatches `copilot-phase-worker.yml`.
5. `copilot-phase-worker.yml` creates a GitHub Copilot agent task, which should open an implementation PR into `plan-base`.
6. Board status then updates automatically from issue/PR events.

Moving the parent orchestrator issue to `In Progress` and assigning it is a coordination signal.
It is enough to keep autonomous kickoff alive, but it does not directly create implementation code by itself.

## Branch strategy
- `main`: stable integration branch
- `plan-base`: gated branch for milestone completion merges
- `phase/*`: implementation branches for each milestone/phase
- `copilot/*`: GitHub-managed implementation branches opened by Copilot agent tasks

Recommended PR convention for phase branches:
- PR title includes milestone token (example: `[M3] Design mode`)
- PR body references issue (example: `Closes #4`)

## Workflows
- `.github/workflows/plan-sync.yml`
  - Source of truth sync from plan file -> issues + project items
  - Also manages a parent `plan-orchestrator` issue linking all milestone issues
  - Writes machine-readable dependency metadata to milestone issues:
    - `<!-- dependencies: Mx,My -->`
  - Dependency source:
    - preferred: optional `## Dependencies` table in plan
    - fallback: sequential chain (`M1` depends on `M0`, etc.)
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

- `.github/workflows/project-status-label-sync.yml`
  - Mirrors Project v2 `Status` field back to issue labels (`state:*`)
  - Trigger: `projects_v2_item` changes (for project item edits)
  - Status mapping:
    - `Backlog` -> `state:backlog`
    - `Ready` -> `state:ready`
    - `In Progress` -> `state:in-progress`
    - `In Review` -> `state:in-review`
    - `Done` -> `state:done`
  - This enables board column moves (for example to `Ready`) to create label events that kickoff automation can consume.

- `.github/workflows/pr-automation.yml`
  - PR labels/reviewers/auto-merge helper
  - For `phase/* -> plan-base` and `copilot/* -> plan-base` PRs, auto-converts draft to ready-for-review when non-kickoff files are detected
  - Label behavior:
    - Draft PR -> `wip`
    - Ready PR -> `needs-review`
    - Approved review -> `ready-to-merge`
  - Optional auto-merge:
    - Add label `automerge` to a PR
    - Workflow attempts to enable GitHub auto-merge (still requires branch protection checks/approvals)
  - Optional reviewer assignment:
    - Set repository variable `AUTO_REVIEWERS` to comma-separated GitHub usernames

- `.github/workflows/phase-gate.yml`
  - Enforces merge readiness for implementation PRs into `plan-base`
  - Gate checks:
    - PR source branch matches `phase/*` or `copilot/*`
    - PR is not draft
    - milestone token present (`M0`..`M8`) in title/body/branch
    - corresponding milestone issue exists and is closed
  - Approval/label gate is disabled for single-maintainer mode

- `.github/workflows/weekly-status-report.yml`
  - Weekly summary issue for milestone progress

- `.github/workflows/ci.yml`
  - Baseline CI for implementation branches and PRs
  - Runs on `main`, `plan-base`, and working branches (`phase/*`, `copilot/*`, `chore/*`)
  - Executes `lint`, `typecheck`, `test`, `build` scripts when present

- `.github/workflows/kickoff-phase-work.yml`
  - Starts execution from an open orchestrator issue or directly from milestone issue assignment / `Ready`
  - Triggers:
    - scheduled reconciliation every 15 minutes
    - push to automation or plan files on `main` / `plan-base`
    - open/reopen/edit/label events on orchestrator issue (`plan-orchestrator`)
    - assign/label events on milestone issues (`plan-sync` + `milestone:Mx`)
      - labeling a milestone with `state:ready` (or `ready`) requests kickoff
    - manual dispatch (`workflow_dispatch`)
  - Behavior:
    - verifies whether the preferred assignee is assignable through the repository issues API before claiming assignment
    - preserves an existing manual Copilot assignment on the orchestrator issue when present
    - reads open milestone issues and their dependency metadata
    - selects dependency-ready milestones only
    - dependency completion is based on merged implementation PRs into `plan-base` (`phase/*` or `copilot/*`), not manual issue closure
    - respects parallel cap (`max_parallel`, default 2)
    - treats milestones already marked `state:in-progress`, `state:in-review`, or with open implementation PRs as active work
    - attempts to assign started milestone issues to the preferred allowed assignee when GitHub reports that assignee as API-assignable
    - dispatches `copilot-phase-worker.yml` for each dependency-ready milestone it starts
    - temporarily moves the issue to `state:in-progress` before worker dispatch; if dispatch fails, it restores `state:ready`
    - comments the queue result on the milestone issue and on the orchestrator summary
  - Notes:
    - an open orchestrator issue is enough for automatic kickoff and recovery; no manual `Ready` label is required
    - orchestrator assignment does not itself trigger implementation work
    - assignment to a milestone issue prioritizes that specific milestone
    - marking a milestone issue `state:ready` can trigger kickoff and Copilot worker dispatch
    - optional label `ai-start` on a milestone issue can request kickoff without reassignment
    - milestone issue kickoff is gated by assignee allow-list (default: `copilot`)
      - configure repository variable `KICKOFF_ALLOWED_ASSIGNEES` as comma-separated GitHub logins
    - if the preferred assignee is not assignable via the repository issues API, the workflow still uses the Copilot worker path instead of logging a false assignment success
    - if kickoff is skipped by assignee policy, the workflow comments the reason on the milestone issue
    - scheduled and push-based runs provide self-healing if an issue event is missed

- `.github/workflows/copilot-phase-worker.yml`
  - Creates the GitHub Copilot coding task for a milestone issue
  - Trigger:
    - internal `workflow_dispatch` from kickoff (and manual dispatch for recovery/testing)
  - Behavior:
    - validates that the issue is an open synced milestone issue
    - refuses to queue duplicate work when an open implementation PR already exists
    - builds a task prompt with milestone token, PR title rules, and `Closes #...` requirements
    - runs `gh agent-task create --base plan-base`
    - marks the issue `state:in-progress` only after the task is queued successfully
    - restores `state:ready` and comments the failure reason when task creation cannot be queued
- `.github/workflows/phase-automerge.yml`
  - Enables GitHub auto-merge on implementation PRs into `plan-base` (squash)
  - PR merges automatically once required checks pass

- `.github/workflows/execution-controller.yml`
  - Autonomous progression controller
  - On merged implementation PR into `plan-base` (`phase/*` or `copilot/*`):
    - closes linked milestone issue(s) from PR body (`Closes #...`)
    - dispatches kickoff again for next dependency-ready phases
  - On scheduled or manual reconciliation runs:
    - scans merged implementation PRs into `plan-base`
    - closes any still-open linked milestone issues that should already be completed
    - re-dispatches kickoff when milestones remain open
  - Generic issue closure does not advance execution
  - When all milestone issues are closed:
    - dispatches `promote-plan-base.yml` to open/update promotion PR to `main`

## Required repository settings
- Branch protection on `main` should require:
  - Pull request before merge
  - Required checks:
    - `Quality (ubuntu-latest)` from `.github/workflows/ci.yml`
  - Approvals optional (currently 0 required)
- Branch protection on `plan-base` should require:
  - Pull request before merge
  - Required checks:
    - `Quality (ubuntu-latest)` from `.github/workflows/ci.yml`
  - Approvals optional (currently 0 required)
- Optional: CODEOWNERS for deterministic reviewer routing

Optional repository variables:
- `KICKOFF_ALLOWED_ASSIGNEES`
  - default behavior if unset: `copilot` is the preferred assignee name for orchestration, but assignment is only recorded when GitHub exposes that login as assignable through the issues API
  - format: comma-separated GitHub logins (example: `copilot,github-copilot[bot],davidacres`)

You can enforce these automatically by running:
- `.github/workflows/apply-branch-protection.yml`

This uses `PLAN_SYNC_TOKEN` in Actions. Local `gh` CLI tokens may not have admin scope for branch protection updates.

## Required secrets
- `PLAN_SYNC_TOKEN` (recommended classic PAT)
  - scopes:
    - `repo` (or `public_repo`)
    - `project`
- `COPILOT_AGENT_TOKEN` (recommended for `gh agent-task create`)
  - use a token type accepted by the GitHub CLI Copilot task preview feature
  - if unset, the worker falls back to `PLAN_SYNC_TOKEN` and then `github.token`, but task creation may still fail if GitHub requires a different token type

## What is and is not fully automatable
- Automated:
  - task generation from plan
  - Copilot task dispatch from milestone `Ready` state
  - board status updates from issue/PR lifecycle
  - reviewer requests
  - enabling auto-merge when labeled and allowed
- Not bypassed by automation:
  - mandatory human approvals from branch protection
  - required checks and policy gates
