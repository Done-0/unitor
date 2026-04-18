import { AIProvider } from "./base.mjs";

export class ClaudeProvider extends AIProvider {
  constructor(config = {}) {
    super("claude", config);
  }

  async executeTask(task) {
    return {
      provider: "claude",
      action: "self-execute",
      task: task,
      output: "Claude provider requires external API call - not available in Claude Code context"
    };
  }

  async healthCheck() {
    return true;
  }

  getStatus() {
    return {
      id: "claude",
      available: true,
      lastCheck: new Date().toISOString(),
      tags: this.config.tags || {}
    };
  }
}
