---
description: Configure Unitor statusline
allowed-tools: Bash, Read, Edit
---

Configuring Unitor statusline to show real-time AI team status...

## Step 1: Detect platform and plugin path

Detecting installation...

**macOS/Linux**:
```bash
ls -d "$HOME"/.claude/plugins/cache/unitor/unitor/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-
```

**Windows (PowerShell)**:
```powershell
(Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\unitor\unitor" -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName
```

If empty, plugin not installed. Tell user to install via `/plugin install unitor` first.

## Step 2: Get runtime path

**macOS/Linux**:
```bash
command -v node 2>/dev/null
```

**Windows (PowerShell)**:
```powershell
(Get-Command node -ErrorAction SilentlyContinue).Source
```

If empty, tell user to install Node.js.

## Step 3: Generate command

**macOS/Linux**:
```
bash -c 'plugin_dir=$(ls -d "$HOME"/.claude/plugins/cache/unitor/unitor/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $0 }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "RUNTIME_PATH" "${plugin_dir}statusline/index.mjs"'
```

**Windows (PowerShell)**:
```
powershell -Command "& {$p=(Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\unitor\unitor -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName; & 'RUNTIME_PATH' (Join-Path $p 'statusline\index.mjs')}"
```

Replace `RUNTIME_PATH` with actual runtime path from Step 2.

## Step 4: Test command

Test the generated command with mock input:
```bash
echo '{"cwd":"'$(pwd)'","terminal_width":120}' | GENERATED_COMMAND
```

Should output statusline. If fails or hangs, stop and report error.

## Step 5: Write configuration

Read settings file and merge in statusLine config:
- **macOS/Linux**: `~/.claude/settings.json`
- **Windows**: `$env:USERPROFILE\.claude\settings.json`

Add to settings.json:
```json
{
  "statusLine": {
    "type": "command",
    "command": "GENERATED_COMMAND"
  }
}
```

The statusline shows:
- Provider status (enabled providers)
- Active collaborations with participants, phase, and discussion preview
- Recent task activity when no active sessions

Done! The statusline appears immediately - no restart needed.
