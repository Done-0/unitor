export class CollaborationCoordinator {
  constructor(router, config, providers) {
    this.router = router;
    this.config = config;
    this.providers = providers;
  }

  async start(task, decomposition) {
    const sessionId = `collab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const participants = { claude: { role: 'coordinator', provider: null } };
    const roleMap = { frontend: 'frontend', backend: 'backend', database: 'backend' };
    const descriptions = {
      frontend: 'Build UI components and interface with React',
      backend: 'Implement API endpoints and routes',
      database: 'Design database schema and queries'
    };

    for (const [domain, needed] of Object.entries(decomposition.domains)) {
      if (!needed || domain === 'other') continue;
      const role = roleMap[domain];
      if (!role) continue;

      const decision = this.router.route({ description: descriptions[domain] || `${role} development` }, this.config);

      if (decision.provider !== 'claude' && this.providers[decision.provider]) {
        const providerId = decision.provider;
        if (!Object.values(participants).some(p => p.provider === this.providers[providerId])) {
          participants[providerId] = { role, provider: this.providers[providerId] };
        }
      }
    }

    const conversation = {
      id: sessionId,
      task,
      participants,
      messages: [],
      consensusReached: false,
      interfaces: { endpoints: [], schemas: {} },
      files: {},
      startedAt: Date.now()
    };

    console.log(`\nCollaboration started`);
    console.log(`Participants: ${Object.keys(participants).filter(id => id !== 'claude').join(', ')}\n`);

    await this.discuss(conversation);

    if (conversation.interfaces?.endpoints?.length > 0) {
      await this.implement(conversation);
      const verified = await this.verify(conversation);
      return { conversation, verified };
    } else {
      console.log(`\nDiscussion complete\n`);
      return { conversation, verified: true };
    }
  }

  async discuss(conversation) {
    const participantIds = Object.keys(conversation.participants).filter(id => id !== 'claude');
    console.log("Discussion:\n");

    let round = 0;
    let consecutiveNoProgress = 0;
    const maxProviderCalls = 50;
    let totalProviderCalls = 0;

    while (true) {
      round++;
      const beforeMessages = conversation.messages.length;
      const historyBeforeRound = conversation.messages.slice(-20).map(m => `[${m.from}] ${m.content}`).join('\n');
      const roundResponses = [];

      for (const pid of participantIds) {
        if (totalProviderCalls >= maxProviderCalls) {
          console.log(`\nReached cost limit (${maxProviderCalls} calls)\n`);
          return;
        }

        const prompt = `You are ${pid} (${conversation.participants[pid].role}) in a multi-AI team collaboration.

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

      const history = conversation.messages.map(m => `[${m.from}] ${m.content}`).join('\n');
      const allParticipantsSpoke = participantIds.every(pid =>
        conversation.messages.some(m => m.from === pid && !m.content.includes('temporarily unavailable'))
      );
      const recentMessages = conversation.messages.slice(-participantIds.length * 2);
      const hasAgreementSignals = recentMessages.some(m =>
        /\b(agree|will implement|I'll create|ready to|let's proceed|sounds good|confirmed)\b/i.test(m.content)
      );
      const hasQuestions = recentMessages.some(m =>
        /\?/.test(m.content) && !m.content.includes('temporarily unavailable')
      );

      totalProviderCalls++;

      if (history.length >= 50 && allParticipantsSpoke && hasAgreementSignals && !hasQuestions) {
        console.log("Consensus reached\n");
        conversation.consensusReached = true;

        const endpointMatches = history.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+/g) || [];
        conversation.interfaces.endpoints = [...new Set(endpointMatches)].map(ep => {
          const [method, path] = ep.split(/\s+/);
          return { method, path, description: `Agreed endpoint from discussion` };
        });
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

    const participantIds = Object.keys(conversation.participants).filter(id => id !== 'claude');
    const backendFirst = participantIds.sort((a, b) => {
      if (conversation.participants[a].role === 'backend') return -1;
      if (conversation.participants[b].role === 'backend') return 1;
      return 0;
    });

    const { existsSync } = await import('fs');
    const { join } = await import('path');

    for (const pid of backendFirst) {
      const summary = conversation.messages.slice(-10).map(m => `[${m.from}] ${m.content.substring(0, 100)}`).join('\n');
      const otherFiles = Object.entries(conversation.files).filter(([id]) => id !== pid).map(([id, files]) => `${id}: ${files.join(', ')}`).join('\n');

      const prompt = `You are ${pid} (${conversation.participants[pid].role}) in a multi-AI team collaboration.

Task: ${conversation.task.description}
Working directory: ${conversation.task.cwd}

Discussion summary:
${summary}

Agreed interfaces:
${JSON.stringify(conversation.interfaces, null, 2)}

${otherFiles ? `Other team members created:\n${otherFiles}\n` : ''}

IMPLEMENT your part. You MUST create actual files in ${conversation.task.cwd}.

${conversation.participants[pid].role === 'frontend' ?
  `Create frontend files (e.g., src/App.js, src/components/UserList.js).
Use the agreed API endpoints.
${otherFiles ? 'You can import from backend files if needed.' : ''}` :
  `Create backend files (e.g., src/server.js, src/routes/users.js).
Implement the agreed API endpoints.`}

After creating files, end your response with:
FILES: path/to/file1.js, path/to/file2.js

Use your file writing capabilities to actually create the files.`;

      try {
        const result = await conversation.participants[pid].provider.executeTask({
          id: `${conversation.id}-impl-${pid}`,
          description: prompt,
          cwd: conversation.task.cwd
        });

        const filesMatch = result.output.match(/FILES:\s*(.+)/i);
        const reportedFiles = filesMatch ? filesMatch[1].split(',').map(f => f.trim()) : [];
        if (reportedFiles.length === 0) continue;

        let actualFiles = reportedFiles.filter(f => existsSync(join(conversation.task.cwd, f)));

        if (actualFiles.length === 0) {
          const retryResult = await conversation.participants[pid].provider.executeTask({
            id: `${conversation.id}-retry-${pid}`,
            description: `${prompt}\n\nCRITICAL: Files were not created. Use your file writing tool to actually write files to ${conversation.task.cwd}.`,
            cwd: conversation.task.cwd
          });

          const retryMatch = retryResult.output.match(/FILES:\s*(.+)/i);
          actualFiles = retryMatch ? retryMatch[1].split(',').map(f => f.trim()).filter(f => existsSync(join(conversation.task.cwd, f))) : [];
        }

        if (actualFiles.length > 0) {
          conversation.files[pid] = actualFiles;
          console.log(`[${pid}] ${actualFiles.join(', ')}\n`);
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

    let allPassed = true;

    for (const [pid, files] of Object.entries(conversation.files)) {
      if (!files || files.length === 0) {
        allPassed = false;
        continue;
      }

      const fileContents = {};
      for (const file of files) {
        const fullPath = join(conversation.task.cwd, file);
        if (existsSync(fullPath)) {
          fileContents[file] = readFileSync(fullPath, 'utf8');
        }
      }

      if (Object.keys(fileContents).length === 0) {
        allPassed = false;
        continue;
      }

      const issues = [];

      for (const [file, content] of Object.entries(fileContents)) {
        if (content.length < 50) {
          issues.push(`${file} too short`);
        }

        if (conversation.participants[pid].role === 'backend') {
          if (!/app\.(get|post|put|delete|patch)|router\.(get|post|put|delete|patch)|express\(\)/i.test(content)) {
            issues.push(`${file} missing Express routes`);
          }

          for (const ep of (conversation.interfaces.endpoints || [])) {
            const pathPattern = ep.path.replace(/\//g, '\\/');
            if (!new RegExp(`${ep.method.toLowerCase()}\\s*\\(\\s*['"\`]${pathPattern}`, 'i').test(content)) {
              issues.push(`${file} missing ${ep.method} ${ep.path}`);
            }
          }
        }

        if (conversation.participants[pid].role === 'frontend') {
          if (!/import.*react|from\s+['"]react['"]/i.test(content)) {
            issues.push(`${file} missing React import`);
          }

          for (const ep of (conversation.interfaces.endpoints || [])) {
            if (!content.includes(ep.path)) {
              issues.push(`${file} missing ${ep.path}`);
            }
          }
        }
      }

      if (issues.length === 0) {
        console.log(`[${pid}] verified\n`);
      } else {
        console.log(`[${pid}] issues:\n`);
        issues.forEach(issue => console.log(`  ${issue}`));
        console.log();
        allPassed = false;
      }
    }

    return allPassed;
  }
}
