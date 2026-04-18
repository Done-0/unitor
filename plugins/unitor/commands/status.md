---
description: Check Unitor status and provider availability
argument-hint: '[--json]'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

Check the status of Unitor, available providers, and recent tasks.

Raw arguments:
`$ARGUMENTS`

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" status $ARGUMENTS
```

Output handling:

- Present the command output to the user as-is.
- If `--json` was passed, the output will be in JSON format.
- Otherwise, the output will be formatted with provider health status and recent tasks.
