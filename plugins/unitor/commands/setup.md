---
description: Configure Unitor statusline
disable-model-invocation: true
allowed-tools: Bash(*)
---

Configure the Unitor statusline to show real-time AI team status.

Run:
```bash
claude config set statusline.command "node ${CLAUDE_PLUGIN_ROOT}/statusline/index.mjs"
```

The statusline shows:
- Provider status (enabled/disabled)
- Active collaborations with participants, phase, and discussion preview
- Recent task activity when no active sessions

To disable:
```bash
claude config unset statusline.command
```

Done! The statusline appears immediately - no restart needed.
