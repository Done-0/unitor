---
description: Configure Unitor team members and settings
argument-hint: '[--show] [--add <provider>] [--remove <provider>] [--enable <provider>] [--disable <provider>]'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

Manage AI team members - add, remove, enable, disable, or configure providers.

Raw arguments:
`$ARGUMENTS`

Available operations:
- `--show`: View current configuration
- `--add <provider> --priority <1-10>`: Add new provider
- `--set-tag <provider> <tag>=<weight>`: Set provider tag weight
- `--add-tag <provider> <tag>=<weight>`: Add provider tag
- `--remove-tag <provider> <tag>`: Remove provider tag
- `--set-model <provider> <model>`: Set provider model
- `--unset-model <provider>`: Remove provider model
- `--enable <provider>`: Enable provider
- `--disable <provider>`: Disable provider
- `--remove <provider>`: Remove provider
- `--set-priority <provider>=<priority>`: Set provider priority

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" config $ARGUMENTS
```

Output handling:

- Present the command output to the user as-is.
- Configuration changes take effect immediately.
- Claude cannot be removed (always available as fallback).
