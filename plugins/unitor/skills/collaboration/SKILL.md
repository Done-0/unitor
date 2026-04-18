---
name: collaboration
description: Multi-domain task detection and Claude orchestration
user-invocable: false
---

# Collaboration Skill

Guidance for understanding how Unitor handles multi-domain tasks.

## When to Use Collaboration

Use the collaboration command when a task spans multiple domains:
- Frontend + Backend (e.g., "Build user profile with API and React UI")
- Backend + Database (e.g., "Create registration endpoint with user table")
- Frontend + Backend + Database (e.g., "Implement full authentication system")

Use the collaboration command:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" collab "task description"
```

## How Collaboration Works

The runtime uses a simple detection mechanism:

1. **Task Analysis**: Extract tags from description
   - Detects: `backend-api`, `frontend-ui`, `database`
   - Counts how many domains are present

2. **Decision**:
   - If < 2 domains → Falls back to regular routing (single-domain task)
   - If ≥ 2 domains → Hands task to Claude for orchestration

3. **Claude Orchestration**: When multi-domain detected
   - Runtime returns control to Claude
   - Claude breaks down the task as needed
   - Claude coordinates execution across domains
   - Claude ensures consistency between components

## Example Flow

```
User: "Build user profile page with backend API and React frontend"

Runtime automatically:
1. Analyzes task → Detects: backend-api, frontend-ui
2. Counts domains → 2 domains detected
3. Returns: "Multi-domain task requires orchestration by Claude"
4. Claude takes over and orchestrates the full implementation

You see:
- Domain detection summary
- Message that Claude will handle orchestration
- Claude then executes the multi-domain task
```

## Your Role in Collaboration

As Claude, you should:
1. **Invoke collaboration**: When task spans multiple domains
2. **Execute orchestration**: When runtime hands task back to you
3. **Coordinate components**: Ensure consistency across domains

You are responsible for:
- Breaking down multi-domain tasks into subtasks
- Executing or delegating each subtask
- Ensuring interface consistency (API contracts, data models)
- Integrating results

## When NOT to Collaborate

Don't use collaboration for:
- Single-domain tasks (use regular routing)
- Architecture/design tasks (execute directly)
- Simple tasks (execute directly)

The runtime will automatically fall back to regular routing if only one domain is detected.
