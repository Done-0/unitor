---
description: "Route single-domain task to the best AI provider. Use for focused tasks matching a provider's specialty. For tasks needing multiple perspectives, discussion, or negotiation, use /unitor:collab instead."
argument-hint: '[task description]'
allowed-tools: Bash(node:*)
---

Route task to the best AI provider based on their capabilities.

Raw task:
`$ARGUMENTS`

## Workflow

1. **Get provider capabilities** - See what each AI is good at
2. **Analyze task** - Understand what needs to be done
3. **Decide provider** - Choose the best match based on capabilities
4. **Execute** - Call runtime with your decision or execute yourself

## Step 1: Get Provider Capabilities

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" status
```

This shows each provider's strengths:
- **Provider A**: architecture, security, complex-reasoning, backend-api
- **Provider B**: frontend-ui, react, css, vue
- **Provider C**: backend-api, python, database, sql

## Step 2: Analyze Task

Understand `$ARGUMENTS`:
- What type of work? (UI, API, database, architecture)
- What technologies? (React, Python, SQL)
- What complexity? (simple fix vs complex design)

## Step 3: Decide Provider

Based on provider capabilities and task analysis, decide which provider best matches the task requirements.

If you are the best match, execute the task directly.

## Step 4: Execute

If routing to another provider:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" route --provider=<provider-id> "$ARGUMENTS"
```

Replace `<provider-id>` with the chosen provider.

If you are the best match:
- Execute the task in `$ARGUMENTS` directly
- Don't call the runtime

## Output Handling

If you called runtime:
- Present provider output verbatim to user
- If provider fails, execute the task yourself

## Example

Task: "fix the login button styling"

1. Get status → Provider B has frontend-ui, css expertise
2. Analyze → this is UI styling work
3. Decide → Provider B is best match
4. Execute → route to Provider B
