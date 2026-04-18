export class TaskRouter {
  assessComplexity(task) {
    const desc = task.description || "";
    const indicators = {
      fileCount: task.files?.length || 0,
      hasArchitecture: /architect|design|refactor|structure|system/i.test(desc),
      hasSecurity: /auth|security|encrypt|token/i.test(desc),
      hasComplexKeywords: /complex|memory leak|performance|optimize|scale|concurrent|async|race condition/i.test(desc),
      hasDeepDebugging: /debug.*complex|investigate|diagnose|root cause|memory|leak|crash/i.test(desc),
      hasMultiStep: desc.split("\n").length > 3
    };

    if (indicators.hasArchitecture || indicators.hasSecurity || indicators.hasComplexKeywords || indicators.hasDeepDebugging) {
      return "high";
    }
    if (indicators.fileCount > 5 || indicators.hasMultiStep) {
      return "medium";
    }
    return "low";
  }

  extractRequiredTags(description) {
    const tags = new Map();
    const desc = description.toLowerCase();

    if (/component|ui|interface|page|button|form|modal|dialog/.test(desc)) {
      tags.set("frontend-ui", 1.0);
    }
    if (/react/.test(desc)) tags.set("react", 0.9);
    if (/vue/.test(desc)) tags.set("vue", 0.9);
    if (/css|style|styling|color|layout|responsive/.test(desc)) tags.set("css", 0.8);
    if (/html/.test(desc)) tags.set("html", 0.7);

    if (/api|endpoint|route|handler|controller/.test(desc)) {
      tags.set("backend-api", 1.0);
    }
    if (/database|db|sql|query|migration|schema/.test(desc)) {
      tags.set("database", 0.9);
    }
    if (/python/.test(desc)) tags.set("python", 0.8);
    if (/\bgo\b/.test(desc)) tags.set("go", 0.8);
    if (/node|nodejs|express/.test(desc)) tags.set("nodejs", 0.8);

    if (/architect|design|refactor|structure|system/.test(desc)) {
      tags.set("architecture", 1.0);
    }
    if (/security|auth|encrypt|token|password|credential/.test(desc)) {
      tags.set("security", 1.0);
    }

    const complexity = this.assessComplexity({description});
    if (complexity === "high") {
      tags.set("complex-reasoning", 1.0);
    } else if (complexity === "low") {
      tags.set("simple-tasks", 0.7);
    }

    if (/[\u4e00-\u9fa5]/.test(description)) {
      tags.set("chinese-tasks", 0.8);
    }

    if (/fix|bug|error|issue|problem/.test(desc)) {
      tags.set("debugging", 0.7);
    }

    if (/test|testing|unit|integration/.test(desc)) {
      tags.set("testing", 0.7);
    }

    return tags;
  }

  route(task, config) {
    const requiredTags = this.extractRequiredTags(task.description);

    const candidates = Object.entries(config.providers)
      .filter(([id, cfg]) => cfg.enabled || id === "claude")
      .map(([id, cfg]) => {
        let totalScore = 0;
        let totalWeight = 0;
        let matchedTags = [];

        for (const [tag, importance] of requiredTags) {
          const aiWeight = (cfg.tags && cfg.tags[tag]) || 0;
          const score = aiWeight * importance;
          totalScore += score;
          totalWeight += importance;

          if (aiWeight > 0.5) {
            matchedTags.push(tag);
          }
        }

        const matchScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const finalScore = matchedTags.length > 0 ? matchScore : cfg.priority / 100;

        return {
          provider: id,
          score: finalScore,
          matchedTags,
          confidence: matchScore
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
        return config.providers[b.provider].priority - config.providers[a.provider].priority;
      }
      return b.score - a.score;
    });

    const best = candidates[0];

    return {
      provider: best.provider,
      reason: best.matchedTags.length > 0 ? `matched: ${best.matchedTags.join(", ")}` : "default fallback",
      confidence: best.confidence
    };
  }
}
