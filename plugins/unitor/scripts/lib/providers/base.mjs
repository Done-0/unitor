export class AIProvider {
  constructor(id, config = {}) {
    this.id = id;
    this.config = config;
  }

  async executeTask(task) {
    return { output: '' };
  }

  async healthCheck() {
    return false;
  }

  getStatus() {
    return {
      id: this.id,
      available: false,
      lastCheck: null
    };
  }
}
