---
name: auto-routing
description: Automatically route tasks to optimal AI providers without user intervention
user-invocable: false
---

# Auto-Routing Skill

**IMPORTANT**: This skill is automatically active. You should proactively use Unitor to route tasks without waiting for user commands.

## When to Auto-Route

### Always Consider Routing

Before executing ANY task, ask yourself:
1. Could this benefit from a specialized AI provider?
2. Is this simple enough to delegate?
3. Or does it require deep reasoning that only Claude can provide?

### Decision Process

**Use the Unitor runtime** to make routing decisions:
- The runtime analyzes task tags and calculates scores
- It selects the best provider based on current configuration
- It handles execution and fallback automatically

**Do NOT hardcode** provider assignments:
- Don't assume "frontend → Gemini"
- Don't assume "backend → Codex"
- Let the runtime decide based on tag-weight matching

## How to Auto-Route

### Step 1: Analyze Task Type

Determine if the task should be routed:
- Simple, focused tasks → Consider routing
- Complex, architectural tasks → Keep in Claude
- Security-critical tasks → Keep in Claude

### Step 2: Use the Runtime

Execute the routing command:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" route "task description"
```

The runtime will:
- Extract tags from the task description
- Calculate scores for each enabled provider
- Select the best provider
- Execute via that provider or return control to you

### Step 3: Handle Result

**If output says "Claude will execute this task directly"**:
- You should now execute the task yourself
- The runtime determined you're the best choice

**If output shows provider execution results**:
- Present the results to the user
- The task is complete

**If output says "Falling back to Claude..."**:
- The provider failed, you should execute the task
- Handle gracefully without mentioning the failure

## Transparent Execution

**DO**:
- Route automatically without asking
- Present results seamlessly
- Only mention routing if user asks

**DON'T**:
- Ask "Should I route this to X?"
- Explain routing decisions unless requested
- Expose internal routing mechanics

## Example Workflows

### Example 1: Auto-Route Success

```
User: "Fix the login button color to blue"

You (internally):
1. Recognize this is a focused task
2. Execute: node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" route "Fix the login button color to blue"
3. Runtime routes to appropriate provider
4. Provider executes successfully
5. Present result to user

User sees:
"I've updated the login button color to blue in src/components/Login.tsx"
```

### Example 2: Auto-Route Returns to Claude

```
User: "Refactor the authentication system"

You (internally):
1. Execute routing command
2. Runtime outputs "Claude will execute this task directly"
3. You execute the task yourself

User sees:
"I'll refactor the authentication system..."
(Normal Claude execution)
```

### Example 3: Provider Fallback

```
User: "Add user registration API"

You (internally):
1. Execute routing command
2. Runtime tries selected provider
3. Provider fails, outputs "Falling back to Claude..."
4. You execute the task yourself

User sees:
"I've implemented the user registration API..."
(No mention of routing or fallback)
```

## Benefits of Auto-Routing

By using specialized AI providers:
- Tasks are handled by the most suitable AI
- Better results through specialization
- Automatic fallback ensures reliability

## Proactive Behavior

You should:
1. **Always check** if task can benefit from routing
2. **Route automatically** when appropriate
3. **Fallback gracefully** when routing returns to you
4. **Stay transparent** to user

## Integration with Commands

Users can still use explicit commands:
- `/unitor:route` - Manual routing
- `/unitor:status` - Check providers
- `/unitor:collab` - Detect multi-domain tasks
- `/unitor:config` - Configure providers

But by default, you should auto-route without these commands.

## Decision Guidelines

```
Task received
    ↓
Is it architecture/security/complex?
    ├─ Yes → Execute directly (don't route)
    └─ No ↓
Is it a focused, delegatable task?
    ├─ Yes → Auto-route via runtime
    └─ No → Execute directly
```

## Remember

- **Proactive**: Don't wait for `/unitor:route`
- **Transparent**: User shouldn't notice routing mechanics
- **Reliable**: Runtime handles fallback automatically
- **Dynamic**: Let runtime decide based on configuration
