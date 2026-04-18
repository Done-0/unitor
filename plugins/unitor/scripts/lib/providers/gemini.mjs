import { spawn } from "node:child_process";
import { AIProvider } from "./base.mjs";

export class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    super("gemini", config);
  }

  async executeTask(task) {
    const timeout = this.config.timeout || 300000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await new Promise((resolve, reject) => {
          const args = ["--prompt", task.description];
          if (this.config.model) args.unshift("--model", this.config.model);

          const proc = spawn("gemini", args, {
            cwd: task.cwd || process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
          });

          proc.stdin.end();

          let stdout = "";
          let stderr = "";
          const timeoutId = setTimeout(() => {
            if (!proc.killed) proc.kill();
            reject(new Error(`timeout`));
          }, timeout);

          proc.stdout.on("data", (data) => { stdout += data.toString(); });
          proc.stderr.on("data", (data) => { stderr += data.toString(); });

          proc.on("close", (code) => {
            clearTimeout(timeoutId);
            if (code === 0) {
              resolve({ provider: "gemini", status: "success", output: stdout, stderr });
            } else {
              reject(new Error(`exit ${code}`));
            }
          });

          proc.on("error", (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`spawn failed: ${err.message}`));
          });
        });
      } catch (error) {
        const isRetryable = /503|429|ECONNRESET|timeout/.test(error.message);
        if (attempt < 3 && isRetryable) {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 10000)));
          continue;
        }
        throw error;
      }
    }
  }

  async healthCheck() {
    try {
      return await new Promise((resolve) => {
        const proc = spawn("gemini", ["--version"]);
        let resolved = false;

        const finish = (result) => {
          if (!resolved) {
            resolved = true;
            if (!proc.killed) proc.kill();
            resolve(result);
          }
        };

        proc.on("close", (code) => finish(code === 0));
        proc.on("error", () => finish(false));
        setTimeout(() => finish(false), 5000);
      });
    } catch {
      return false;
    }
  }

  getStatus() {
    return {
      id: "gemini",
      available: false,
      lastCheck: new Date().toISOString(),
      tags: this.config.tags || {}
    };
  }
}
