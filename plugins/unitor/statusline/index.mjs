#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

const CYAN = '\x1b[36m';
const BRIGHT_CYAN = '\x1b[96m';

const GREEN = '\x1b[32m';
const BRIGHT_GREEN = '\x1b[92m';
const YELLOW = '\x1b[33m';
const BRIGHT_YELLOW = '\x1b[93m';
const RED = '\x1b[31m';
const BRIGHT_RED = '\x1b[91m';

const BLUE = '\x1b[34m';
const BRIGHT_BLUE = '\x1b[94m';

function truncate(text, maxLen) {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
}

async function main() {
  let stdinData = '';
  for await (const chunk of process.stdin) {
    stdinData += chunk;
  }

  let stdin;
  try {
    stdin = JSON.parse(stdinData);
  } catch {
    return;
  }

  if (!stdin?.cwd) return;

  const termWidth = stdin.terminal_width || 80;
  const stateFile = join(stdin.cwd, '.unitor', 'state.json');

  if (!existsSync(stateFile)) {
    process.stdout.write(`${BRIGHT_CYAN}Unitor${RESET} ${DIM}│${RESET} claude\n`);
    return;
  }

  let state;
  try {
    state = JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    process.stdout.write(`${BRIGHT_CYAN}Unitor${RESET} ${DIM}│${RESET} claude\n`);
    return;
  }

  const lines = [];

  const providers = state?.config?.providers;
  if (providers) {
    const status = Object.entries(providers)
      .filter(([id]) => id !== 'claude')
      .map(([id, cfg]) => cfg.enabled ? `${CYAN}${id}${RESET}` : `${DIM}${id}${RESET}`)
      .join(` ${DIM}·${RESET} `);
    lines.push(status ? `${BRIGHT_CYAN}Unitor${RESET} ${DIM}│${RESET} ${status}` : `${BRIGHT_CYAN}Unitor${RESET} ${DIM}│${RESET} claude`);
  } else {
    lines.push(`${BRIGHT_CYAN}Unitor${RESET} ${DIM}│${RESET} claude`);
  }

  const sessions = state?.sessions;
  const activeSessions = sessions?.filter(s => s.status === 'active' || s.status === 'running') || [];

  if (activeSessions.length > 0) {
    const maxLines = Math.min(3, activeSessions.length);
    activeSessions.slice(0, maxLines).forEach((session, idx) => {
      const participants = session.participants?.join('+') || '';
      const phase = session.phase === 'discussion' ? 'discussing' :
        session.phase === 'implementation' ? 'implementing' :
          session.phase === 'verification' ? 'verifying' : session.phase;

      const phaseColor = phase === 'discussing' ? BRIGHT_BLUE :
        phase === 'implementing' ? BRIGHT_YELLOW : BRIGHT_GREEN;

      const messages = session.messages || [];
      const lastMsg = messages[messages.length - 1];

      const sessionNum = activeSessions.length > 1 ? `[${idx + 1}] ` : '';
      const sep = '│';

      const fixedWidth = sessionNum.length + participants.length + 3 + phase.length + 3;
      const previewMaxWidth = Math.max(0, termWidth - fixedWidth - 10);
      const preview = lastMsg && previewMaxWidth > 20 ? truncate(lastMsg.content, previewMaxWidth) : '';

      lines.push(`${sessionNum ? `${DIM}${sessionNum}${RESET}` : ''}${CYAN}${participants}${RESET} ${DIM}${sep}${RESET} ${phaseColor}${phase}${RESET}${preview ? ` ${DIM}${sep}${RESET} ${DIM}${preview}${RESET}` : ''}`);
    });

    if (activeSessions.length > maxLines) {
      lines.push(`${DIM}... and ${activeSessions.length - maxLines} more${RESET}`);
    }
  } else {
    const tasks = state?.tasks;
    if (tasks && tasks.length > 0) {
      const recent = tasks.slice(0, 2);
      recent.forEach(task => {
        const icon = task.status === 'completed' ? `${BRIGHT_GREEN}✓${RESET}` :
          task.status === 'failed' ? `${BRIGHT_RED}✗${RESET}` : `${BRIGHT_YELLOW}◐${RESET}`;
        const elapsed = Date.now() - new Date(task.completedAt || task.createdAt).getTime();
        const time = elapsed < 60000 ? 'now' :
          elapsed < 3600000 ? `${Math.floor(elapsed / 60000)}m` :
            `${Math.floor(elapsed / 3600000)}h`;

        const provider = task.assignedTo || 'unknown';
        const sep = '│';

        const fixedWidth = 2 + provider.length + 3 + time.length + 3;
        const previewMaxWidth = Math.max(0, termWidth - fixedWidth - 10);
        const preview = previewMaxWidth > 20 ? truncate(task.description, previewMaxWidth) : '';

        lines.push(`${icon} ${CYAN}${provider}${RESET} ${DIM}${sep}${RESET} ${DIM}${time}${RESET}${preview ? ` ${DIM}${sep}${RESET} ${DIM}${preview}${RESET}` : ''}`);
      });
    }
  }

  process.stdout.write(lines.join('\n') + '\n');
}

main();









