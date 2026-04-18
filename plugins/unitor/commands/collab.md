---
description: Multi-AI collaboration for complex multi-domain tasks
argument-hint: '[task description]'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

Orchestrate multiple AI providers to collaborate on multi-domain tasks.

Raw task:
`$ARGUMENTS`

Core constraint:
- Run the collaboration system and report results.
- The system handles AI-to-AI discussion, consensus, and implementation autonomously.

Execution flow:

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/unitor-runtime.mjs" collab "$ARGUMENTS"
```

Output handling:
- If "Single domain task": Falls back to regular routing, follow route command behavior.
- If "Multi-domain task detected": Multiple AIs collaborate autonomously:
  - Discussion phase: AIs discuss and negotiate contracts
  - Implementation phase: AIs create actual files
  - Verification phase: System validates implementation
  - Report the collaboration summary and created files to the user.

You do NOT need to orchestrate manually - the system handles everything.
