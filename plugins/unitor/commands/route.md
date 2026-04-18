---
description: Intelligently route task to the best AI provider
argument-hint: '[task description]'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

Route task to the best AI provider based on tag-weight matching.

Raw task:
`$ARGUMENTS`

Core constraint:
- Your job is to run the routing decision and either execute the task yourself or present the provider's output.
- Do not skip the routing step.

Execution flow:

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" route "$ARGUMENTS"
```

Output handling:
- If the command outputs "Claude will execute this task directly":
  - You (Claude) should now execute the task described in `$ARGUMENTS`.
  - Do not just report the routing decision - actually perform the task.
  
- If the command outputs "Falling back to Claude...":
  - The selected provider failed after retries.
  - You (Claude) should now execute the task described in `$ARGUMENTS`.
  - Do not just report the fallback - actually perform the task.

- If the command outputs execution results from another provider:
  - Present the provider's output to the user verbatim.
  - Do not add commentary or modify the output.
  - The task is complete.
