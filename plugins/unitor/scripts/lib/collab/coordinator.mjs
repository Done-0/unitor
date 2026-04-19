export class CollaborationCoordinator {
  constructor(router, config, providers) {
    this.router = router;
    this.config = config;
    this.providers = providers;
  }

  async start(task, decomposition, customRoles = {}) {
    const sessionId = `collab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const participants = {};
    const domainOrder = [];

    for (const [domain, needed] of Object.entries(decomposition.domains)) {
      if (!needed || domain === 'other') continue;

      const roleDescription = customRoles[domain] || `${domain} specialist for: ${task.description}`;
      const decision = this.router.route({ description: roleDescription }, this.config);

      if (this.providers[decision.provider]) {
        const providerId = decision.provider;
        const roleKey = `${providerId}-${domain}`;

        if (!participants[roleKey]) {
          participants[roleKey] = {
            id: providerId,
            role: roleDescription,
            domain: domain,
            provider: this.providers[providerId]
          };
          domainOrder.push(roleKey);
        }
      }
    }

    if (Object.keys(participants).length === 0) {
      throw new Error("No available providers for the specified roles. Check provider configuration.");
    }

    const conversation = {
      id: sessionId,
      task,
      participants,
      participantOrder: domainOrder,
      messages: [],
      consensusReached: false,
      interfaces: { endpoints: [], schemas: {} },
      files: {},
      startedAt: Date.now()
    };

    console.log(`\nCollaboration started`);
    console.log(`Participants: ${Object.keys(participants).join(', ')}\n`);

    await this.discuss(conversation);

    if (conversation.consensusReached) {
      await this.implement(conversation);
      const verified = await this.verify(conversation);
      return { conversation, verified };
    } else {
      console.log(`\nDiscussion ended without consensus\n`);
      return { conversation, verified: false };
    }
  }

  async discuss(conversation) {
    const participantIds = conversation.participantOrder;
    console.log("Discussion:\n");

    let round = 0;
    let consecutiveNoProgress = 0;
    const maxProviderCalls = 50;
    let totalProviderCalls = 0;

    while (true) {
      round++;
      const beforeMessages = conversation.messages.length;
      const historyBeforeRound = conversation.messages.map(m => `[${m.from}] ${m.content}`).join('\n');
      const roundResponses = [];

      for (const pid of participantIds) {
        if (totalProviderCalls >= maxProviderCalls) {
          console.log(`\nReached cost limit (${maxProviderCalls} calls)\n`);
          conversation.consensusReached = true;
          return;
        }

        const participant = conversation.participants[pid];
        const prompt = `You are ${participant.id} working on ${participant.role} in a multi-AI team collaboration.

Task: ${conversation.task.description}

Recent conversation:
${historyBeforeRound || 'No messages yet'}

Respond naturally to move the discussion forward. Share what you need, what you can provide, ask questions, or propose solutions.`;

        let response = null;
        let attempts = 0;

        while (attempts < 2 && !response) {
          attempts++;
          try {
            const result = await conversation.participants[pid].provider.executeTask({
              id: `${conversation.id}-discuss-${pid}-r${round}-a${attempts}`,
              description: prompt,
              cwd: conversation.task.cwd
            });

            totalProviderCalls++;
            response = result.output.trim();
            if (response.length < 10) response = null;
          } catch (error) {
            if (attempts >= 2) response = `[${pid} is temporarily unavailable]`;
          }
        }

        if (!response) response = `[${pid} did not respond]`;
        console.log(`[${pid}] ${response}\n`);
        roundResponses.push({ from: pid, content: response, at: Date.now() });
      }

      conversation.messages.push(...roundResponses);

      const allParticipantsSpoke = participantIds.every(pid =>
        conversation.messages.some(m => m.from === pid && !m.content.includes('temporarily unavailable'))
      );

      if (allParticipantsSpoke && round >= 2) {
        console.log(`Discussion complete (${round} rounds)\n`);
        conversation.consensusReached = true;

        const history = conversation.messages.map(m => `[${m.from}] ${m.content}`).join('\n');
        const endpointMatches = history.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+/g) || [];
        if (endpointMatches.length > 0) {
          conversation.interfaces.endpoints = [...new Set(endpointMatches)].map(ep => {
            const [method, path] = ep.split(/\s+/);
            return { method, path, description: `Agreed endpoint from discussion` };
          });
        }
        break;
      }

      if (conversation.messages.length > beforeMessages) {
        consecutiveNoProgress = 0;
      } else {
        consecutiveNoProgress++;
        if (consecutiveNoProgress >= 3) {
          console.log("No progress, ending discussion\n");
          break;
        }
      }
    }
  }

  async implement(conversation) {
    console.log("\nImplementation:\n");

    const { existsSync, readdirSync } = await import('fs');
    const { join } = await import('path');

    const scanDirectory = (dir) => {
      const files = new Set();

      const isDependencyDir = (dirPath) => {
        try {
          const entries = readdirSync(dirPath, { withFileTypes: true });
          if (entries.length === 0) return false;

          const fileCount = entries.filter(e => e.isFile()).length;
          const dirCount = entries.filter(e => e.isDirectory()).length;

          if (fileCount === 0 && dirCount > 50) return true;
          if (dirCount > 100) return true;

          const hasPackageMarkers = entries.some(e =>
            e.name === 'package.json' ||
            e.name === 'package-lock.json' ||
            e.name === 'yarn.lock' ||
            e.name === 'pnpm-lock.yaml' ||
            e.name === 'bun.lockb' ||
            e.name === 'deno.json' ||
            e.name === 'deno.lock' ||
            e.name === 'Cargo.toml' ||
            e.name === 'Cargo.lock' ||
            e.name === 'go.mod' ||
            e.name === 'go.sum' ||
            e.name === 'pom.xml' ||
            e.name === 'mvn.lock' ||
            e.name === 'build.gradle' ||
            e.name === 'build.gradle.kts' ||
            e.name === 'settings.gradle' ||
            e.name === 'gradle.lockfile' ||
            e.name === 'packages.lock.json' ||
            e.name === 'Package.swift' ||
            e.name === 'Package.resolved' ||
            e.name === 'Podfile' ||
            e.name === 'Podfile.lock' ||
            e.name === 'Cartfile' ||
            e.name === 'Cartfile.resolved' ||
            e.name === 'pubspec.yaml' ||
            e.name === 'pubspec.lock' ||
            e.name === 'Gemfile' ||
            e.name === 'Gemfile.lock' ||
            e.name === 'composer.json' ||
            e.name === 'composer.lock' ||
            e.name === 'requirements.txt' ||
            e.name === 'Pipfile' ||
            e.name === 'Pipfile.lock' ||
            e.name === 'poetry.lock' ||
            e.name === 'setup.py' ||
            e.name === 'pyproject.toml' ||
            e.name === 'mix.exs' ||
            e.name === 'mix.lock' ||
            e.name === 'rebar.config' ||
            e.name === 'rebar.lock' ||
            e.name === 'project.clj' ||
            e.name === 'deps.edn' ||
            e.name === 'build.sbt' ||
            e.name === 'build.sc' ||
            e.name === 'stack.yaml' ||
            e.name === 'cabal.project' ||
            e.name === 'Makefile.PL' ||
            e.name === 'Build.PL' ||
            e.name === 'cpanfile' ||
            e.name === 'conan.txt' ||
            e.name === 'conanfile.py' ||
            e.name === 'vcpkg.json' ||
            e.name === 'CMakeLists.txt' ||
            e.name === 'meson.build' ||
            e.name === 'zig.build' ||
            e.name === 'WORKSPACE' ||
            e.name === 'BUILD' ||
            e.name === '.buckconfig' ||
            e.name === 'hardhat.config.js' ||
            e.name === 'hardhat.config.ts' ||
            e.name === 'truffle-config.js' ||
            e.name === 'foundry.toml' ||
            e.name === 'brownie-config.yaml' ||
            e.name === 'ape-config.yaml' ||
            e.name === 'Move.toml' ||
            e.name === 'Scarb.toml' ||
            e.name === 'anchor.toml' ||
            e.name === 'next.config.js' ||
            e.name === 'next.config.mjs' ||
            e.name === 'next.config.ts' ||
            e.name === 'nuxt.config.js' ||
            e.name === 'nuxt.config.ts' ||
            e.name === 'vite.config.js' ||
            e.name === 'vite.config.ts' ||
            e.name === 'webpack.config.js' ||
            e.name === 'rollup.config.js' ||
            e.name === 'svelte.config.js' ||
            e.name === 'astro.config.mjs' ||
            e.name === 'remix.config.js' ||
            e.name === 'gatsby-config.js' ||
            e.name === 'lerna.json' ||
            e.name === 'nx.json' ||
            e.name === 'turbo.json' ||
            e.name === 'tauri.conf.json' ||
            e.name === 'electron-builder.yml' ||
            e.name === 'wagmi.config.ts'
          );

          if (hasPackageMarkers && dirCount > 10) return true;

          return false;
        } catch (e) {
          return false;
        }
      };

      try {
        const scan = (currentDir, depth = 0) => {
          if (depth > 8) return;

          const entries = readdirSync(currentDir, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.env') continue;

            const fullPath = join(currentDir, entry.name);

            if (entry.isDirectory()) {
              if (isDependencyDir(fullPath)) continue;
              scan(fullPath, depth + 1);
            } else if (entry.isFile()) {
              files.add(fullPath);
            }
          }
        };
        scan(dir);
      } catch (e) {}
      return files;
    };

    for (const pid of conversation.participantOrder) {
      const participant = conversation.participants[pid];
      const summary = conversation.messages.slice(-10).map(m => `[${m.from}] ${m.content.substring(0, 100)}`).join('\n');
      const otherFiles = Object.entries(conversation.files).filter(([id]) => id !== pid).map(([id, files]) => `${id}: ${files.join(', ')}`).join('\n');

      const prompt = `You are ${participant.id} with role: ${participant.role}

Task: ${conversation.task.description}
Working directory: ${conversation.task.cwd}

Discussion summary:
${summary}

Agreed interfaces:
${JSON.stringify(conversation.interfaces, null, 2)}

${otherFiles ? `Other team members created:\n${otherFiles}\n` : ''}

IMPLEMENT your part based on your role description and the discussion. You MUST create actual files in ${conversation.task.cwd}.

After creating files, end your response with:
FILES: path/to/file1.js, path/to/file2.js

Use your file writing capabilities to actually create the files.`;

      const filesBeforeImpl = scanDirectory(conversation.task.cwd);

      try {
        const result = await conversation.participants[pid].provider.executeTask({
          id: `${conversation.id}-impl-${pid}`,
          description: prompt,
          cwd: conversation.task.cwd
        });

        const filesAfterImpl = scanDirectory(conversation.task.cwd);
        const newFiles = [...filesAfterImpl].filter(f => !filesBeforeImpl.has(f));
        const relativeFiles = newFiles.map(f => f.replace(conversation.task.cwd + '/', ''));

        if (relativeFiles.length === 0) {
          const filesMatch = result.output.match(/FILES:\s*(.+)/i);
          if (filesMatch) {
            const reportedFiles = filesMatch[1].split(',').map(f => f.trim()).filter(f => existsSync(join(conversation.task.cwd, f)));
            if (reportedFiles.length > 0) {
              relativeFiles.push(...reportedFiles);
            }
          }
        }

        if (relativeFiles.length === 0) {
          const filesBeforeRetry = scanDirectory(conversation.task.cwd);

          await conversation.participants[pid].provider.executeTask({
            id: `${conversation.id}-retry-${pid}`,
            description: `${prompt}\n\nCRITICAL: Files were not created. Use your file writing tool to actually write files to ${conversation.task.cwd}.`,
            cwd: conversation.task.cwd
          });

          const filesAfterRetry = scanDirectory(conversation.task.cwd);
          const retryNewFiles = [...filesAfterRetry].filter(f => !filesBeforeRetry.has(f));
          relativeFiles.push(...retryNewFiles.map(f => f.replace(conversation.task.cwd + '/', '')));
        }

        if (relativeFiles.length > 0) {
          conversation.files[pid] = [...new Set(relativeFiles)];
          console.log(`[${pid}] ${conversation.files[pid].join(', ')}\n`);
        }
      } catch (error) {
        continue;
      }
    }
  }

  async verify(conversation) {
    console.log("\nVerification:\n");

    const { readFileSync, existsSync } = await import('fs');
    const { join } = await import('path');

    let allCreated = true;

    for (const [pid, files] of Object.entries(conversation.files)) {
      if (!files || files.length === 0) {
        console.log(`[${pid}] no files created\n`);
        allCreated = false;
        continue;
      }

      const existing = [];
      const missing = [];

      for (const file of files) {
        const fullPath = join(conversation.task.cwd, file);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf8');
          if (content.length > 0) {
            existing.push(`${file} (${content.length} chars)`);
          } else {
            missing.push(`${file} (empty)`);
          }
        } else {
          missing.push(`${file} (not found)`);
        }
      }

      if (existing.length > 0) {
        console.log(`[${pid}] created: ${existing.join(', ')}\n`);
      }

      if (missing.length > 0) {
        console.log(`[${pid}] missing: ${missing.join(', ')}\n`);
        allCreated = false;
      }
    }

    return allCreated;
  }
}
