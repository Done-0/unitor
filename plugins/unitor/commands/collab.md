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

1. **Get provider capabilities** - Understand what each AI is good at
2. **Parse arguments** - Extract model options and task description
3. **Analyze task** - Understand what needs to be built
4. **Define roles** - Create specific role descriptions for each specialist
5. **Write roles JSON** - Map roles to appropriate providers
6. **Execute collaboration** - Call runtime to orchestrate
7. **Report results** - Present summary to user

## Step 1: Get Provider Capabilities

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" status --json
```

This shows each provider's strengths via tags:
- **claude**: architecture(1), security(1), complex-reasoning(0.95), backend-api(0.7)
- **gemini**: frontend-ui(1), react(0.95), css(0.95), vue(0.9)
- **codex**: backend-api(0.95), python(0.9), database(0.9), sql(0.85)

Use this to assign roles to the right specialists.

## Step 2: Parse Arguments

Extract model options (if any) and task description from `$ARGUMENTS`:

```bash
# Individual models
/unitor:collab --claude=claude-opus-4-7 --codex=gpt-5.4 "task"

# Compact format
/unitor:collab --models=claude:opus-4-7,codex:gpt-5.4 "task"

# Default models (no flags)
/unitor:collab "task"
```

## Step 3: Analyze Task

Understand what needs to be built:
- What domains are involved? (frontend, backend, database, etc.)
- What technologies? (React, Python, SQL, etc.)
- What's the complexity? (simple CRUD vs complex system)

## Step 4: Define Roles

Write **task-specific** role descriptions (not generic templates).

**Good examples**:
- "JWT auth API - implement /login, /register, /refresh with jsonwebtoken, bcrypt hashing, token validation middleware"
- "React login UI - build login/signup forms with email/password validation, error display, loading states, localStorage token storage"
- "User database - design users table with id, email, password_hash, created_at; add sessions table for refresh tokens"

**Bad examples**:
- "Backend developer"
- "Frontend specialist"
- "Database person"

## Step 5: Write Roles JSON

Create roles file with role keys and descriptions:

```json
{
  "roles": {
    "auth-api": "JWT auth API - implement /login, /register, /refresh with jsonwebtoken, bcrypt hashing, token validation middleware",
    "login-ui": "React login UI - build login/signup forms with email/password validation, error display, loading states",
    "user-db": "User database - design users table with email, password_hash, created_at; sessions table for refresh tokens"
  }
}
```

**Role assignment**:
- Runtime routes each role to the best provider by matching role description against provider tags
- Order matters: roles are executed in the order defined (dependencies first)
- Use descriptive keys: `auth-api`, `login-ui`, `user-db` (not `role1`, `role2`)

Write to `/tmp/unitor-roles-${random}.json`

## Step 6: Execute Collaboration

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" collab [model-options] /tmp/unitor-roles-*.json "task description"
```

The runtime will:
- Route each role to appropriate provider (based on provider tags)
- Orchestrate discussion phase (AIs discuss and reach consensus)
- Execute implementation phase (AIs create files in order)
- Verify results (check files were created)

## Step 7: Report Results

Present collaboration summary:
- Participants and their roles
- Number of discussion rounds
- Files created by each participant
- Verification status (files created, not quality assessment)

**Note**: Verification only confirms files exist. You (coordinator) should review file quality if needed.
