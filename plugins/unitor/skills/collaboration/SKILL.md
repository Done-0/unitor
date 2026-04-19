---
name: collaboration
description: Multi-AI collaboration orchestration guidance
user-invocable: false
---

# Collaboration Skill

Guidance for orchestrating multi-AI collaboration in Unitor.

## When to Use Collaboration

Use `/unitor:collab` when a task requires multiple AI specialists working together.

## How It Works

You (Claude) are the coordinator. The workflow:

1. **Analyze the task** - Understand what needs to be built
2. **Define roles** - Determine required specialists (not limited to frontend/backend/database)
3. **Write role descriptions** - Create specific, task-focused descriptions
4. **Create roles JSON** - Write to temporary file
5. **Execute** - Call runtime with roles file
6. **Report** - Present results to user

## Role Descriptions

Write task-specific descriptions (not generic templates):

**Good:**
- "JWT auth API - implement /login, /register, /refresh with jsonwebtoken, bcrypt hashing, token validation middleware"
- "React login UI - build login/signup forms with email/password validation, error display, loading states"

**Bad:**
- "Backend developer"
- "Frontend specialist"

## Example

Task: "Build user authentication"

Roles JSON:
```json
{
  "roles": {
    "auth-api": "JWT authentication API - implement login/register/refresh endpoints with token generation, validation middleware, bcrypt password hashing",
    "login-ui": "React authentication UI - build login/signup forms with validation, error handling, loading states, token storage",
    "user-db": "User database - design users table with email, password_hash, created_at, sessions table for refresh tokens"
  }
}
```

Runtime call:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" collab /tmp/roles.json "build user authentication"
```

## Your Role

- Analyze each task individually
- Generate specific role descriptions
- No hardcoded templates or rules
- Each task is unique
