import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

const STATE_VERSION = 1;
const PLUGIN_DATA_ENV = "CLAUDE_PLUGIN_DATA";
const FALLBACK_STATE_ROOT = path.join(os.tmpdir(), "unitor");
const STATE_FILE = "state.json";
const MAX_TASKS = 50;

function nowIso() {
  return new Date().toISOString();
}

function defaultState() {
  return {
    version: STATE_VERSION,
    config: {
      orchestrator: "claude",
      autoRoute: true,
      defaultProvider: "claude",
      providers: {
        claude: {
          enabled: true,
          priority: 10,
          model: "claude-sonnet-4-6",
          tags: {
            "architecture": 1.0,
            "security": 1.0,
            "complex-reasoning": 0.95,
            "backend-api": 0.5,
            "database": 0.5
          }
        },
        gemini: {
          enabled: true,
          priority: 8,
          model: "gemini-flash-latest",
          tags: {
            "frontend-ui": 1.0,
            "css": 0.95,
            "react": 0.95,
            "vue": 0.9,
            "html": 0.9,
            "simple-tasks": 0.8
          }
        },
        codex: {
          enabled: true,
          priority: 7,
          model: "gpt-5.4",
          tags: {
            "backend-api": 0.95,
            "database": 0.9,
            "python": 0.9,
            "go": 0.85,
            "nodejs": 0.85
          }
        }
      }
    },
    tasks: [],
    sessions: []
  };
}

export function resolveStateDir(cwd) {
  const hash = createHash("sha256").update(cwd).digest("hex").slice(0, 16);
  const pluginDataDir = process.env[PLUGIN_DATA_ENV];
  const stateRoot = pluginDataDir ? path.join(pluginDataDir, "state") : FALLBACK_STATE_ROOT;
  return path.join(stateRoot, `unitor-${hash}`);
}

export function resolveStateFile(cwd) {
  return path.join(resolveStateDir(cwd), STATE_FILE);
}

export function ensureStateDir(cwd) {
  fs.mkdirSync(resolveStateDir(cwd), { recursive: true });
}

export function loadState(cwd) {
  const stateFile = resolveStateFile(cwd);
  if (!fs.existsSync(stateFile)) {
    return defaultState();
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(cwd, state) {
  ensureStateDir(cwd);
  const nextState = {
    version: STATE_VERSION,
    config: { ...defaultState().config, ...(state.config ?? {}) },
    tasks: (state.tasks ?? []).slice(0, MAX_TASKS),
    sessions: (state.sessions ?? []).slice(0, MAX_TASKS)
  };
  fs.writeFileSync(resolveStateFile(cwd), JSON.stringify(nextState, null, 2) + "\n", "utf8");
  return nextState;
}

export function updateState(cwd, mutate) {
  const state = loadState(cwd);
  mutate(state);
  return saveState(cwd, state);
}

export function generateId(prefix = "task") {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function upsertTask(cwd, taskPatch) {
  return updateState(cwd, (state) => {
    const timestamp = nowIso();
    const existingIndex = state.tasks.findIndex((t) => t.id === taskPatch.id);
    if (existingIndex === -1) {
      state.tasks.unshift({ createdAt: timestamp, updatedAt: timestamp, ...taskPatch });
    } else {
      state.tasks[existingIndex] = { ...state.tasks[existingIndex], ...taskPatch, updatedAt: timestamp };
    }
  });
}

export function listTasks(cwd) {
  return loadState(cwd).tasks;
}

export function getConfig(cwd) {
  return loadState(cwd).config;
}

export function setConfig(cwd, key, value) {
  return updateState(cwd, (state) => {
    state.config[key] = value;
  });
}
