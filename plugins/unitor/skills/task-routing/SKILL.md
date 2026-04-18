---
name: task-routing
description: Intelligent task routing decision guidance
user-invocable: false
---

# Task Routing Skill

Internal guidance for understanding how Unitor routes tasks.

## How Routing Works

### Tag-Weight Matching System

The Unitor runtime uses a dynamic tag-weight matching system:

1. **Extract Tags**: Analyze task description for relevant tags
   - Frontend: `frontend-ui`, `react`, `vue`, `css`, `html`
   - Backend: `backend-api`, `database`, `python`, `go`, `nodejs`
   - Architecture: `architecture`, `security`, `complex-reasoning`
   - Other: `debugging`, `testing`, `chinese-tasks`, `simple-tasks`

2. **Calculate Scores**: For each enabled provider
   ```
   score = Σ(provider_tag_weight × task_tag_importance) / Σ(task_tag_importance)
   ```

3. **Select Best Provider**: Highest score wins
   - If scores are close (< 0.05), priority is tiebreaker
   - If no tags match, use priority / 100 as fallback

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
// Example 1: Frontend task
"Fix the login button color"
→ Runtime extracts: frontend-ui, css
→ Runtime calculates scores for all providers
→ Runtime selects best match
→ Executes via selected provider

// Example 2: Backend task
"Add user registration endpoint"
→ Runtime extracts: backend-api
→ Runtime calculates scores
→ Runtime selects best match
→ Executes via selected provider

// Example 3: Architecture task
"Refactor authentication system"
→ Runtime extracts: architecture, security
→ Runtime calculates scores
→ Claude likely has highest score
→ Returns control to Claude
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
1. **Delegate to runtime**: Let it make routing decisions
2. **Execute when selected**: When runtime returns control to you
3. **Present results**: When other providers execute successfully
4. **Handle gracefully**: When fallback occurs

You are NOT responsible for:
- Calculating tag scores
- Deciding which provider to use
- Managing provider execution
- Handling retries and timeouts

The runtime handles all of this automatically.
