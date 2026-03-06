# gemini-canvas-extension.plan.md

## Purpose
Build a VS Code extension that provides a **Gemini‑Canvas‑style visual design workspace** inside the editor area, with:
- A **custom editor Canvas** that replaces the editor during Design mode
- **Multi‑zone layout** with **drag handles**
- A **safe, preview‑only** workflow (no implicit file writes)
- Optional **AI‑assisted generation** (Gemini) that updates the Canvas **in place**
- Optional **worktree‑scoped persistence** and explicit `DESIGN.md` generation

This plan is written to be **implementation-ready**, **testable**, and **auditable**.

---

## Guiding principles
- **Canvas is a workspace, not chat:** no transcript, no bubbles, no append-only output.
- **In-place updates:** every “result” replaces the relevant region, never appends.
- **Explicitness over magic:** no silent persistence, no implicit mode changes, no hidden writes.
- **Safety by default:** preview-only until the user explicitly applies changes.
- **Editor-native:** Canvas behaves like a first-class editor tab (split/pin/move).
- **Separation of concerns:** domain logic is pure and testable; UI renders state; extension host owns side effects.
- **Reversibility:** nothing irreversible happens without explicit user action.

---

## Technology stack (locked)
### Extension host
- **TypeScript (strict)**
- **VS Code Custom Editor API**
- **Mocha + @vscode/test-electron** (integration tests)
- **Zod** (runtime validation for all message payloads)
- **XState** (small, explicit state machines in `src/domain/` only)

### WebView UI
- **React + TypeScript**
- **Vite** bundling
- **CSS Grid + Flexbox** (no UI frameworks)
- **Pointer Events** for drag handles

### Testing
- **Vitest** (unit tests for domain + UI pure logic)
- **Playwright** (WebView UI behavior tests: drag, disabled state, replacement rendering)
- **GitHub Actions** (CI on Linux/macOS/Windows)

---

## Milestones (end-to-end)
| Milestone | Goal | Ships | Exit criteria |
|---|---|---|---|
| **M0** | Scaffold + CI | Strict TS, lint/format, test harness, build pipeline | `npm test` green; extension loads |
| **M1** | Canvas custom editor | Custom editor opens in editor area; 3-zone layout | Feels like workspace, not panel |
| **M2** | Drag handles | Vertical + horizontal dividers; min sizes | Resizing is instinctive; no unusable zones |
| **M3** | Design mode + setting | Enter/Exit Design mode; inactive state; keep-open vs close setting | Mode clarity + editor replacement feel is right |
| **M4** | Explore vs Design sessions | Explicit promotion; in-memory session model | Explore leaves no artifacts; promotion is deliberate |
| **M5** | Gemini integration (preview-only) | Structured AI output; in-place updates; graceful failure | Useful without touching disk |
| **M6** | Worktree binding + `DESIGN.md` | Explicit binding; explicit note generation; deletion semantics | Persistence is unambiguous and reversible |
| **M7** | Apply-to-disk workflow | Explicit “Apply” with preview/diff gating | No accidental writes; robust rollback |
| **M8** | Hardening + polish | Accessibility, perf, error UX, docs | Stable, shippable, maintainable |

---

## Product behavior specification

### Modes
#### Design mode
- Canvas replaces the editor surface.
- Controls enabled; interactions live.
- No file writes unless user explicitly triggers Apply (M7).

#### Inactive Canvas (after exiting Design mode)
- Canvas remains open as a tab by default.
- Controls disabled; read-only.
- Visually muted with a clear “Design mode inactive” indicator.

### Sessions
#### Explore session
- Ephemeral, disposable.
- No persistence, no `DESIGN.md`, no worktree binding.

#### Design session
- Intentional.
- Eligible for worktree binding and `DESIGN.md` generation (M6), but only with explicit confirmation.

### Settings
Location: **Editor → AI / Assistance**

- **Canvas behavior after exiting Design mode**
  - Keep Canvas open (default)
  - Close Canvas automatically

Contract:
- Affects only post-exit visibility.
- Does not affect session state.
- Does not introduce persistence.

---

## Canvas UI specification

### Layout (always multi-zone)
- **Preview zone (dominant):** main visual output (structured preview, diagrams, multi-file preview, etc.)
- **Context zone (secondary):** intent, constraints, assumptions; not chat history.
- **Control strip (tertiary):** actions, mode indicator, minimal input.

### Drag handles
- **Vertical divider:** Preview ↔ Context
- **Horizontal divider:** Preview ↔ Controls
- **Minimum sizes:** enforced so zones never become unusable.
- **Persistence:** not persisted until M6+ (optional); resets on reopen in early milestones.

### Rendering rules
- Output replaces content in place.
- No append-only history.
- No “chat scroll” metaphors.
- Clear visual hierarchy (headings, sections, cards) without heavy UI frameworks.

---

## Architecture

### Repository layout
- `src/extension/`
  - activation, commands, settings, VS Code APIs, file system, worktree binding
- `src/editor/`
  - custom editor provider, webview lifecycle, resource URIs, CSP
- `src/webview/`
  - React app, layout, drag handles, renderers
- `src/domain/`
  - state machines, rules, validators, pure logic (no VS Code imports)
- `src/protocol/`
  - message types + Zod schemas + helpers
- `src/ai/`
  - Gemini client, prompt templates, output schema enforcement (M5)
- `src/persistence/`
  - worktree-scoped storage, design note writer (M6)
- `src/test/`
  - unit, integration, UI tests
- `resources/`
  - icons, static assets

### Core components
- **CustomEditorProvider:** owns editor replacement and webview creation.
- **SessionManager:** owns Explore/Design session lifecycle.
- **DesignModeController:** owns enter/exit behavior and focus restoration.
- **ProtocolBridge:** typed message bus (WebView ↔ extension).
- **CanvasRenderer (WebView):** renders state; no side effects.
- **AIOrchestrator (M5):** calls Gemini, validates output, returns structured updates.
- **PersistenceManager (M6):** worktree binding + explicit `DESIGN.md` generation.
- **ApplyEngine (M7):** explicit apply-to-disk with preview/diff gating.

---

## State machines (explicit)

### Design mode state machine (M3)
States:
- `idle`
- `design.active`
- `design.inactive`

Transitions:
- `idle → design.active` (Enter Design Mode)
- `design.active → design.inactive` (Exit Design Mode)
- `design.inactive → design.active` (Re-enter)

Invalid transitions must throw (or be rejected) and be test-covered.

### Session state machine (M4+)
States:
- `explore.active`
- `design.active`
- `design.closed`

Transitions:
- `explore.active → design.active` (Promote)
- `design.active → design.closed` (Close)
- `explore.active → (end)` (Close)

Rules:
- Explore never persists.
- Design can persist only with explicit worktree binding + explicit confirmation.

---

## Message protocol (hard rule)
All WebView ↔ extension messages:
- Typed
- Zod-validated
- Versioned
- Directional (request/response)

### Protocol rules
- WebView requests intent; extension decides.
- WebView never writes files.
- Extension never trusts WebView payloads without validation.

### Example message categories
- `ui.ready`, `ui.resize`, `ui.action`
- `mode.enter`, `mode.exit`, `mode.state`
- `session.create`, `session.promote`, `session.close`
- `ai.generatePreview`, `ai.result`, `ai.error`
- `persistence.bindWorktree`, `persistence.writeDesignNote`
- `apply.preview`, `apply.confirm`, `apply.result`

---

## Gemini integration (M5)

### Goals
- Generate structured Canvas updates (preview + context + suggested actions).
- Update in place.
- Never write to disk automatically.

### Output contract
Gemini must return a JSON object matching a strict schema, e.g.:
- `preview`: structured blocks (sections, files, diagrams)
- `context`: bullet constraints/assumptions/tradeoffs
- `actions`: suggested next steps (labels only)

If schema validation fails:
- Show a non-destructive error state in Context zone.
- Keep last good preview visible.

### Prompting rules
- Always include a “no file writes” constraint.
- Always request structured output.
- Always include current Canvas state summary (bounded length).
- Always include workspace constraints (language, repo type) only if explicitly known.

---

## Persistence and `DESIGN.md` (M6)

### Worktree binding
- Binding is explicit (user action).
- Storage is scoped to the worktree root.
- Deleting the worktree deletes the design artifacts.

### `DESIGN.md` generation rules
`DESIGN.md` is created only when all are true:
- Session is Design
- Worktree is bound
- User explicitly confirms generation on close (or explicit “Generate design note” action)

Content rules:
- Markdown
- Execution-agnostic language
- No “implemented” claims
- No commit references
- Deterministic structure

Title:
- Auto-generated from final Canvas state (deterministic, bounded length)

---

## Apply-to-disk workflow (M7)

### Goals
- Explicit, reviewable application of changes.
- No surprises.

### Required steps
1. Generate proposed changes (still preview-only).
2. Show a review surface (diff-like or structured file list).
3. User explicitly confirms Apply.
4. Apply writes to disk with error handling and rollback strategy.

### Safety constraints
- Never apply partial changes silently.
- If any write fails, surface error and leave workspace consistent.

---

## Code quality rules (non-negotiable)

### TypeScript and structure
- `strict: true`
- No implicit `any`
- Domain logic has no VS Code imports
- Side effects only in `src/extension/` and `src/persistence/` and `src/apply/`

### UI rules
- No chat transcript UI
- Replace-in-place rendering only
- Inactive state must be obvious and enforced

### Security rules (WebView)
- Strict CSP
- No remote script execution
- Only load local bundled assets via `asWebviewUri`
- Validate all inbound messages

### Operational rules
- No telemetry by default
- If logging exists, it is local and user-controlled

---

## Development workflow (feedback loop)

### Feature workflow (mandatory)
1. **Intent statement** (≤10 lines)
2. **State impact** (which machines/states/transitions)
3. **Protocol impact** (new messages + schemas)
4. **Tests first** (at least acceptance + one negative test)
5. **Implement smallest slice**
6. **Manual “workspace feel” check**
7. **CI green**
8. **Merge**

### Review gates
- **Gate A (UX):** still feels like a workspace, not chat.
- **Gate B (Safety):** no implicit writes/persistence.
- **Gate C (Determinism):** state transitions + protocol validated.
- **Gate D (Regression):** bug fixes add tests.

---

## Testing strategy (complete)

### Unit tests (Vitest)
Targets:
- State machines (Design mode, sessions)
- Rules (persistence eligibility, design note gating)
- Protocol validation helpers
- Pure UI reducers (if any)

Must include:
- Negative tests for invalid transitions
- “No persistence in Explore” tests
- “No design note without confirmation” tests

### Integration tests (Mocha + @vscode/test-electron)
Targets:
- Custom editor opens in editor area
- Enter/Exit Design mode focus restoration
- Setting toggles keep-open vs close behavior
- Worktree binding (M6)
- Apply workflow gating (M7)

### WebView UI tests (Playwright)
Targets:
- Drag handles resize zones
- Minimum sizes enforced
- Active ↔ inactive state disables interactions
- Preview replacement (no append)
- Error states render without destroying last good preview

### Regression tripwires
- Assert no file writes during Design mode (until M7 Apply)
- Assert no `DESIGN.md` without explicit confirmation
- Assert Explore sessions create no artifacts

---

## CI pipeline (required)
On every PR:
- Lint (ESLint)
- Format check (Prettier)
- Typecheck (`tsc --noEmit`)
- Unit tests (Vitest)
- Build (Vite bundle + extension compile)

On main (or nightly until stable on PRs):
- Integration tests (VS Code host)
- Playwright UI tests
- Matrix OS runs (Linux/macOS/Windows)

---

## Documentation deliverables
- `README.md`: what it is, what it is not, safety guarantees
- `docs/architecture.md`: components, state machines, protocol
- `docs/testing.md`: how to run unit/integration/ui tests
- `docs/contributing.md`: workflow + gates + coding rules
- `docs/security.md`: CSP, message validation, no remote scripts
- `CHANGELOG.md`: milestone-based, behavior-focused

---

## Definition of done (project-level)
The project is “done” when:
- Canvas feels like a real workspace for thinking
- Design mode is explicit and trustworthy
- AI adds value without taking control
- Persistence is optional, explicit, and worktree-scoped
- Applying changes is explicit, reviewable, and safe
- Tests prevent regressions in safety and UX semantics

---

## Immediate next step
Implement M3 exactly as specified, then run the evaluation checklist:
- Do I want to think in this Canvas?
- Does it feel safe to explore?
- Does returning to code feel clean and intentional?
- Would I keep the Canvas open while coding?

Only proceed to M4+ if the answers are “yes”.
