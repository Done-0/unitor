export class TaskDecomposer {
  constructor(router, config) {
    this.router = router;
    this.config = config;
  }

  decompose(taskDescription) {
    const tags = this.router.extractRequiredTags(taskDescription);
    const tagMap = new Map(tags);

    const hasBackend = tagMap.has("backend-api");
    const hasFrontend = tagMap.has("frontend-ui");
    const hasDatabase = tagMap.has("database");

    const domainCount = [hasBackend, hasFrontend, hasDatabase].filter(Boolean).length;

    if (domainCount < 2) {
      return { needsCollab: false, reason: "single domain task" };
    }

    return {
      needsCollab: true,
      reason: "multi-domain task requires orchestration",
      assignedTo: "claude",
      domains: {
        backend: hasBackend,
        frontend: hasFrontend,
        database: hasDatabase
      }
    };
  }
}
