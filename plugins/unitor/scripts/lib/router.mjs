export class TaskRouter {
  route(task, config, taskTags = null) {
    const candidates = Object.entries(config.providers)
      .filter(([id, cfg]) => cfg.enabled || id === "claude")
      .map(([id, cfg]) => {
        let score = 0;
        let matchedTags = [];

        if (taskTags && Object.keys(taskTags).length > 0) {
          let totalScore = 0;
          let totalWeight = 0;

          for (const [tag, importance] of Object.entries(taskTags)) {
            const providerWeight = (cfg.tags && cfg.tags[tag]) || 0;
            totalScore += providerWeight * importance;
            totalWeight += importance;

            if (providerWeight > 0.5) {
              matchedTags.push(tag);
            }
          }

          score = totalWeight > 0 ? totalScore / totalWeight : 0;
        }

        if (score === 0 || matchedTags.length === 0) {
          score = (cfg.priority || 5) / 100;
        }

        return {
          provider: id,
          score,
          matchedTags,
          priority: cfg.priority || 5
        };
      });

    if (candidates.length === 0) {
      return {
        provider: "claude",
        reason: "no providers available, fallback to claude",
        confidence: 1.0
      };
    }

    candidates.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.05) {
        return b.priority - a.priority;
      }
      return b.score - a.score;
    });

    const best = candidates[0];

    return {
      provider: best.provider,
      reason: best.matchedTags.length > 0
        ? `matched tags: ${best.matchedTags.join(", ")}`
        : `selected by priority (${best.priority})`,
      confidence: best.matchedTags.length > 0 ? best.score : 0.5
    };
  }
}
