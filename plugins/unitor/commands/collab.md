---
description: Multi-AI collaboration for complex multi-domain tasks
argument-hint: '[options] [task description]'
allowed-tools: Bash(node:*), Write
---

Orchestrate multiple AI providers to collaborate on multi-domain tasks.

Raw task:
`$ARGUMENTS`

## Your Role

You are the coordinator. Analyze the task, define roles, and orchestrate the collaboration.

## Workflow

1. Parse `$ARGUMENTS` to extract model options (if any) and task description
2. Analyze the task - understand what needs to be built
3. Define roles - determine required specialists and write specific role descriptions
4. Write roles to temporary JSON file
5. Execute collaboration via runtime
6. Report results to user

## Model Selection

Users can specify AI models:

```bash
# Individual models
/unitor:collab --claude=claude-opus-4-7 --codex=gpt-5.4 "task"

# Compact format
/unitor:collab --models=claude:opus-4-7,codex:gpt-5.4 "task"

# Default models (no flags)
/unitor:collab "task"
```

## Role Descriptions

Write task-specific role descriptions (not generic templates).

Good:
- "JWT auth API - implement /login, /register, /refresh with jsonwebtoken, bcrypt hashing, token validation middleware"
- "React login UI - build login/signup forms with email/password validation, error display, loading states, localStorage token storage"

Bad:
- "Backend developer"
- "Frontend specialist for: build login"

## Execution

Create roles file:
```json
{
  "roles": {
    "role-key-1": "specific role description",
    "role-key-2": "specific role description"
  }
}
```

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" collab [model-options] /tmp/unitor-roles-*.json "task description"
```

Output handling:
- Present collaboration summary to user
- Show participants, messages, files created
- Report verification status (files created, not quality assessment)
- Coordinator (you) should review file quality if needed
