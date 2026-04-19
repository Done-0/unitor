#!/usr/bin/env node

import process from "node:process";
import { TaskRouter } from "./lib/router.mjs";
import { ClaudeProvider } from "./lib/providers/claude.mjs";
import { GeminiProvider } from "./lib/providers/gemini.mjs";
import { CodexProvider } from "./lib/providers/codex.mjs";
import { TaskDecomposer } from "./lib/collab/decomposer.mjs";
import { CollaborationCoordinator } from "./lib/collab/coordinator.mjs";
import { generateId, upsertTask, listTasks, getConfig, updateState } from "./lib/state.mjs";

const router = new TaskRouter();
const [command, ...args] = process.argv.slice(2);
const cwd = process.cwd();

function createProviders(config) {
  const providers = {};
  const availableProviders = {
    claude: ClaudeProvider,
    gemini: GeminiProvider,
    codex: CodexProvider
  };

  for (const [id, cfg] of Object.entries(config.providers)) {
    const ProviderClass = availableProviders[id];
    if (ProviderClass) {
      providers[id] = new ProviderClass(cfg);
    }
  }

  if (!providers.claude) {
    providers.claude = new ClaudeProvider(config.providers.claude || { enabled: true, priority: 10, tags: {} });
  }

  return providers;
}

try {
  if (command === "route") {
    const taskDescription = args.join(" ");
    if (!taskDescription) throw new Error("Task description required");

    const config = getConfig(cwd);
    const providers = createProviders(config);
    const task = { id: generateId("task"), description: taskDescription, cwd };
    const decision = router.route(task, config);

    console.log(`\nProvider: ${decision.provider}`);
    console.log(`Confidence: ${(decision.confidence * 100).toFixed(0)}%\n`);

    upsertTask(cwd, { id: task.id, description: taskDescription, assignedTo: decision.provider, status: "pending", decision });

    if (decision.provider === "claude") {
      console.log("Claude will execute this task\n");
    } else {
      const provider = providers[decision.provider];
      if (!provider) {
        console.log(`Provider ${decision.provider} not found, falling back to Claude\n`);
        upsertTask(cwd, { id: task.id, status: "failed", error: "Provider not found" });
      } else {
        try {
          const result = await provider.executeTask(task);
          upsertTask(cwd, { id: task.id, status: "completed", result });
          console.log(result.output);
        } catch (error) {
          console.log(`Execution failed: ${error.message}\n`);
          upsertTask(cwd, { id: task.id, status: "failed", error: error.message });
          console.log("Falling back to Claude\n");
        }
      }
    }
  } else if (command === "status") {
    const tasks = listTasks(cwd);
    const config = getConfig(cwd);
    const providers = createProviders(config);
    const healthChecks = await Promise.all(
      Object.entries(providers).map(async ([id, provider]) => ({
        id, healthy: await provider.healthCheck(), status: provider.getStatus()
      }))
    );

    if (args.includes("--json")) {
      console.log(JSON.stringify({ config, providers: healthChecks, tasks: tasks.slice(0, 10) }, null, 2));
    } else {
      console.log("\nUnitor Status\n");
      console.log(`Orchestrator: ${config.orchestrator || "claude"}\n`);
      console.log("Providers:");
      healthChecks.forEach(({ id, healthy, status }) => {
        console.log(`  [${healthy ? "available" : "unavailable"}] ${id}`);
        if (status.tags) {
          const topTags = Object.entries(status.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, weight]) => `${tag}(${weight})`)
            .join(", ");
          console.log(`    Tags: ${topTags}`);
        }
      });
      console.log(`\nRecent Tasks: ${tasks.length}`);
      tasks.slice(0, 5).forEach((task) => console.log(`  - ${task.id}: ${task.status} (${task.assignedTo})`));
      console.log();
    }
  } else if (command === "health-check") {
    const config = getConfig(cwd);
    const providers = createProviders(config);
    console.log("\nHealth Check\n");
    for (const [id, provider] of Object.entries(providers)) {
      console.log(`[${await provider.healthCheck() ? "OK" : "UNAVAILABLE"}] ${id}`);
    }
    console.log();
  } else if (command === "collab") {
    const modelOverrides = {};
    const taskArgs = [];
    let rolesFilePath = null;

    for (const arg of args) {
      if (arg.startsWith('--models=')) {
        const modelsStr = arg.slice(9);
        modelsStr.split(',').forEach(pair => {
          const [provider, model] = pair.split(':');
          if (provider && model) {
            modelOverrides[provider.trim()] = model.trim();
          }
        });
      } else if (arg.startsWith('--claude=')) {
        modelOverrides.claude = arg.slice(9);
      } else if (arg.startsWith('--codex=')) {
        modelOverrides.codex = arg.slice(8);
      } else if (arg.startsWith('--gemini=')) {
        modelOverrides.gemini = arg.slice(9);
      } else if (!rolesFilePath && arg.endsWith('.json')) {
        rolesFilePath = arg;
      } else {
        taskArgs.push(arg);
      }
    }

    const taskDescription = taskArgs.join(" ");

    if (!rolesFilePath || !taskDescription) {
      throw new Error("Usage: collab [options] <roles-file.json> <task description>");
    }

    const { readFileSync, existsSync } = await import('fs');

    if (!existsSync(rolesFilePath)) {
      throw new Error(`Roles file not found: ${rolesFilePath}`);
    }

    let rolesData;
    try {
      rolesData = JSON.parse(readFileSync(rolesFilePath, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid JSON in roles file: ${error.message}`);
    }

    const customRoles = rolesData.roles || {};

    if (typeof customRoles !== 'object' || Array.isArray(customRoles) || customRoles === null) {
      throw new Error("Roles file must contain 'roles' as an object with role definitions");
    }

    if (Object.keys(customRoles).length === 0) {
      throw new Error("Roles file must contain at least one role in 'roles' object");
    }

    const config = getConfig(cwd);

    if (Object.keys(modelOverrides).length > 0) {
      for (const [provider, model] of Object.entries(modelOverrides)) {
        if (config.providers[provider]) {
          config.providers[provider].model = model;
        }
      }
    }

    const providers = createProviders(config);

    console.log(`\nMulti-AI collaboration\n`);

    const coordinator = new CollaborationCoordinator(router, config, providers);
    const task = { id: generateId("task"), description: taskDescription, cwd };

    const decomposition = {
      needsCollab: true,
      domains: Object.keys(customRoles).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    };

    try {
      const { conversation, verified } = await coordinator.start(task, decomposition, customRoles);

      console.log("\nSummary:");
      const participantDisplay = Object.entries(conversation.participants)
        .map(([roleKey, p]) => `${p.id}: ${p.role}`)
        .join('\n  ');
      console.log(`Participants:\n  ${participantDisplay}`);
      console.log(`Messages: ${conversation.messages.length}`);
      console.log(`Verified: ${verified ? 'Yes' : 'No'}\n`);

      if (Object.keys(conversation.files).length > 0) {
        console.log("Files:");
        for (const [roleKey, files] of Object.entries(conversation.files)) {
          const participant = conversation.participants[roleKey];
          const displayName = participant ? `${participant.id} (${participant.domain})` : roleKey;
          console.log(`  ${displayName}: ${Array.isArray(files) ? files.join(', ') : files}`);
        }
        console.log();
      }

      const participantsList = Object.entries(conversation.participants)
        .reduce((acc, [roleKey, p]) => {
          const existing = acc.find(item => item.id === p.id);
          if (existing) {
            existing.domains.push(p.domain);
          } else {
            acc.push({ id: p.id, domains: [p.domain] });
          }
          return acc;
        }, [])
        .map(({ id, domains }) => domains.length > 1 ? `${id}(${domains.join('+')})` : id);

      upsertTask(cwd, {
        id: task.id,
        status: verified ? "completed" : "failed",
        sessionId: conversation.id,
        participants: participantsList,
        messages: conversation.messages.length,
        files: Object.keys(conversation.files || {}).length,
        verified
      });
    } catch (error) {
      console.log(`Collaboration failed: ${error.message}\n`);
      upsertTask(cwd, { id: task.id, status: "failed", error: error.message });
    }

    process.exit(0);
  } else if (command === "config") {
    const config = getConfig(cwd);

    if (args.includes("--show") || args.length === 0) {
      console.log("\nUnitor Configuration\n");
      console.log(`Orchestrator: ${config.orchestrator || "claude"}`);
      console.log(`Auto-routing: ${config.autoRoute ? "enabled" : "disabled"}`);
      console.log(`Default provider: ${config.defaultProvider}\n`);
      console.log("Team Members:");
      Object.entries(config.providers).forEach(([id, cfg]) => {
        const modelInfo = cfg.model ? `, model: ${cfg.model}` : "";
        console.log(`  [${cfg.enabled ? "enabled" : "disabled"}] ${id} (priority: ${cfg.priority}${modelInfo})`);
        if (cfg.tags) {
          const topTags = Object.entries(cfg.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, weight]) => `${tag}(${weight})`)
            .join(", ");
          console.log(`    Tags: ${topTags}`);
        }
      });
      console.log();
    } else if (args.includes("--set-orchestrator")) {
      const orchestrator = args[args.indexOf("--set-orchestrator") + 1];
      updateState(cwd, (state) => { state.config.orchestrator = orchestrator; });
      console.log(`Set orchestrator to: ${orchestrator}`);
    } else if (args.includes("--add")) {
      const providerId = args[args.indexOf("--add") + 1];
      const priorityIdx = args.indexOf("--priority");
      updateState(cwd, (state) => {
        state.config.providers[providerId] = {
          enabled: true,
          priority: priorityIdx >= 0 ? parseInt(args[priorityIdx + 1]) : 5,
          tags: {}
        };
      });
      console.log(`Added provider: ${providerId}`);
    } else if (args.includes("--remove")) {
      const providerId = args[args.indexOf("--remove") + 1];
      if (providerId === "claude") {
        console.error("Error: Claude cannot be removed (always available as fallback)");
        process.exit(1);
      }
      updateState(cwd, (state) => { delete state.config.providers[providerId]; });
      console.log(`Removed provider: ${providerId}`);
    } else if (args.includes("--enable")) {
      const providerId = args[args.indexOf("--enable") + 1];
      updateState(cwd, (state) => { if (state.config.providers[providerId]) state.config.providers[providerId].enabled = true; });
      console.log(`Enabled provider: ${providerId}`);
    } else if (args.includes("--disable")) {
      const providerId = args[args.indexOf("--disable") + 1];
      if (providerId === "claude") {
        console.error("Error: Claude cannot be disabled (always available as fallback)");
        process.exit(1);
      }
      updateState(cwd, (state) => { if (state.config.providers[providerId]) state.config.providers[providerId].enabled = false; });
      console.log(`Disabled provider: ${providerId}`);
    } else if (args.includes("--set-priority")) {
      const [providerId, priority] = args[args.indexOf("--set-priority") + 1].split("=");
      updateState(cwd, (state) => { if (state.config.providers[providerId]) state.config.providers[providerId].priority = parseInt(priority); });
      console.log(`Set ${providerId} priority to ${priority}`);
    } else if (args.includes("--set-tag")) {
      const providerId = args[args.indexOf("--set-tag") + 1];
      const tagValue = args[args.indexOf("--set-tag") + 2];
      const [tag, weight] = tagValue.split("=");
      updateState(cwd, (state) => {
        if (state.config.providers[providerId]) {
          if (!state.config.providers[providerId].tags) state.config.providers[providerId].tags = {};
          state.config.providers[providerId].tags[tag] = parseFloat(weight);
        }
      });
      console.log(`Set ${providerId} tag ${tag} to ${weight}`);
    } else if (args.includes("--add-tag")) {
      const providerId = args[args.indexOf("--add-tag") + 1];
      const tagValue = args[args.indexOf("--add-tag") + 2];
      const [tag, weight] = tagValue.split("=");
      updateState(cwd, (state) => {
        if (state.config.providers[providerId]) {
          if (!state.config.providers[providerId].tags) state.config.providers[providerId].tags = {};
          state.config.providers[providerId].tags[tag] = parseFloat(weight);
        }
      });
      console.log(`Added tag ${tag}=${weight} to ${providerId}`);
    } else if (args.includes("--remove-tag")) {
      const providerId = args[args.indexOf("--remove-tag") + 1];
      const tag = args[args.indexOf("--remove-tag") + 2];
      updateState(cwd, (state) => {
        if (state.config.providers[providerId]?.tags) {
          delete state.config.providers[providerId].tags[tag];
        }
      });
      console.log(`Removed tag ${tag} from ${providerId}`);
    } else if (args.includes("--set-model")) {
      const providerId = args[args.indexOf("--set-model") + 1];
      const model = args[args.indexOf("--set-model") + 2];
      updateState(cwd, (state) => {
        if (state.config.providers[providerId]) {
          state.config.providers[providerId].model = model;
        }
      });
      console.log(`Set ${providerId} model to ${model}`);
    } else if (args.includes("--unset-model")) {
      const providerId = args[args.indexOf("--unset-model") + 1];
      updateState(cwd, (state) => {
        if (state.config.providers[providerId]) {
          delete state.config.providers[providerId].model;
        }
      });
      console.log(`Unset ${providerId} model (will use CLI default)`);
    } else {
      console.log("Usage:\n  config --show\n  config --set-orchestrator <provider>\n  config --add <provider> --priority <n>\n  config --remove <provider>\n  config --enable <provider>\n  config --disable <provider>\n  config --set-priority <provider>=<n>\n  config --set-tag <provider> <tag>=<weight>\n  config --add-tag <provider> <tag>=<weight>\n  config --remove-tag <provider> <tag>\n  config --set-model <provider> <model>\n  config --unset-model <provider>");
    }
  } else {
    console.log("Usage:\n  route <task-description>\n  status [--json]\n  health-check\n  config [options]");
    process.exit(1);
  }
} catch (error) {
  console.error(`\nError: ${error.message}\n`);
  process.exit(1);
}

