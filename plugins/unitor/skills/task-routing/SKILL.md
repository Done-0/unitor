---
name: task-routing
description: "Internal guidance for understanding how Unitor routes tasks. Covers coordinator-driven routing decisions, provider selection logic, and when to route vs execute directly vs use collaboration."
user-invocable: false
---

# Task Routing Skill

Internal guidance for understanding how Unitor routes tasks.

## Routing vs Collaboration Decision

**Before routing, check if task needs collaboration:**

Use `/unitor:collab` instead of routing when:
- Task spans multiple domains (frontend + backend, API + database)
- Task needs multiple perspectives (review, critique, discussion)
- User uses collaboration keywords: negotiate, discuss, multiple angles, review from multiple perspectives
- Task benefits from specialist discussion

Use `/unitor:route` for:
- Single-domain focused tasks (frontend-only, backend-only, database-only)
- Clear technical scope without need for multiple viewpoints

## How Routing Works

### Coordinator-Driven Decision System

The Unitor routing uses a coordinator-driven approach:

1. **Coordinator sees provider capabilities**: Each provider has tags defining their expertise
   - Frontend: `frontend-ui`, `react`, `vue`, `css`, `html`
   - Backend: `backend-api`, `database`, `python`, `go`, `nodejs`
   - Architecture: `architecture`, `security`, `complex-reasoning`

2. **Coordinator analyzes task**: Understand what the task needs based on provider tags

3. **Coordinator decides provider**: Choose the best match based on provider capabilities

4. **Execute with decision**: Pass explicit provider to runtime or execute directly

### Provider Configuration

Each provider has:
- **Tags**: Expertise areas with weights (0.0-1.0)
- **Priority**: Tiebreaker value (1-10)
- **Model**: Specific model to use
- **Enabled**: Whether provider is active

Configuration is dynamic and user-customizable.

## When to Route vs Execute Directly

### Route to Runtime

When task is:
- Focused and delegatable
- Has clear domain indicators (frontend, backend, database)
- Not security-critical
- Not requiring deep architectural reasoning

### Execute Directly (Don't Route)

When task is:
- Architecture or system design
- Security-critical (auth, encryption, tokens)
- Complex debugging requiring deep reasoning
- Multi-system refactoring

## Fallback Strategy

The runtime handles fallback automatically:
1. If selected provider fails → Retry 3 times
2. If still failing → Fallback to Claude
3. Claude executes the task

You don't need to manage fallback logic.

## Example Routing Decisions

```javascript
// Example 1: Specialized task
"Fix the styling issue"
→ Coordinator sees Provider B has relevant expertise
→ Coordinator decides: route to Provider B
→ Executes: route --provider=provider-b "Fix the styling issue"

// Example 2: Different specialty
"Add the endpoint"
→ Coordinator sees Provider C has relevant expertise
→ Coordinator decides: route to Provider C
→ Executes: route --provider=provider-c "Add the endpoint"

// Example 3: Complex reasoning task
"Refactor the system architecture"
→ Coordinator sees this requires complex reasoning
→ Coordinator decides: execute directly
→ Claude handles the task
```

## Understanding Provider Selection

The runtime selects providers based on:
- **Current configuration**: User can add/remove/configure any provider
- **Tag weights**: Each provider's expertise areas
- **Priority**: Tiebreaker when scores are close
- **Enabled status**: Disabled providers are skipped

**Important**: Provider selection is dynamic and adapts to user configuration. Don't assume fixed assignments.

## Your Role

As Claude, you should:
1. **See provider capabilities**: Check provider tags via status command
2. **Analyze and decide**: Choose the best provider based on task needs
3. **Execute with decision**: Pass --provider parameter or execute directly
4. **Present results**: When other providers execute successfully

You are responsible for:
- Understanding provider capabilities (tags)
- Analyzing task requirements
- Making routing decisions
- Passing decisions to runtime

The runtime handles:
- Provider execution
- Retries and timeouts
- Fallback to Claude if provider fails
