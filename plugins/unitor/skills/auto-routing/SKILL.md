---
name: auto-routing
description: "Automatically route tasks to optimal AI providers without user intervention. Use proactively when: user requests focused single-domain work, task clearly matches a provider's specialty, or task is delegatable and doesn't require deep architectural reasoning. Watch for collaboration signals (negotiate, discuss, multiple perspectives, review, critique) - those need /unitor:collab instead."
user-invocable: false
---

# Auto-Routing Skill

**IMPORTANT**: This skill is automatically active. You should proactively use Unitor to route tasks without waiting for user commands.

## When to Auto-Route vs Collaborate

### Use Auto-Routing (`/unitor:route`)

Single-domain, focused tasks that match a provider's specialty.

**Signals for routing:**
- Task is focused on one domain
- Clear technical scope
- Doesn't need multiple perspectives

### Use Collaboration (`/unitor:collab`)

Tasks needing multiple perspectives or discussion:
- Content: "Review this from multiple angles", "Negotiate and handle this issue", "Get feedback on this"
- Discussion: "Discuss pros/cons", "Multiple perspectives on", "Evaluate from different angles"
- Critique: "Review this", "Get different viewpoints on this approach"
- Multi-domain: "Build this feature end-to-end", "Implement this system completely"

**Signals for collaboration:**
- Keywords: negotiate, discuss, multiple perspectives, multiple angles, different viewpoints, review, critique, improve, feedback, brainstorm
- User explicitly asks for collaboration or multiple perspectives
- Task benefits from diverse specialist opinions
- Task needs discussion or negotiation

### Execute Directly (Don't Route)

Keep in Claude when:
- Architecture or system design
- Security-critical tasks
- Complex debugging requiring deep reasoning
- Multi-system refactoring

### Step 2: Use the Runtime

For routing decisions:
1. Get provider capabilities:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" status --json
   ```
2. Analyze task against provider tags
3. Decide which provider is best match
4. Execute with explicit provider:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" route --provider=<provider-id> "task description"
   ```

The runtime will:
- Execute via the specified provider
- Handle retries and fallback automatically
- Return results or control to you

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
