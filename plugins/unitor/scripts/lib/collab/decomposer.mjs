export class TaskDecomposer {
  constructor(router, config) {
    this.router = router;
    this.config = config;
  }

  decompose(taskDescription) {
    const tags = this.router.extractRequiredTags(taskDescription);
    const tagMap = new Map(tags);

    const keywords = taskDescription.toLowerCase();
    const collabIndicators = [
      keywords.includes('review') && (keywords.includes('improve') || keywords.includes('feedback')),
      keywords.includes('discuss') || keywords.includes('debate') || keywords.includes('perspectives'),
      keywords.includes('analyze') && keywords.includes('different'),
      keywords.includes('team') || keywords.includes('collaborate'),
      keywords.includes('architecture') && keywords.includes('design'),
      tagMap.size >= 2
    ];

    const needsCollab = collabIndicators.filter(Boolean).length >= 1 || tagMap.size >= 2;

    if (!needsCollab) {
      return { needsCollab: false, reason: "single perspective task" };
    }

    const domains = {};
    if (tagMap.has("backend-api")) domains.backend = true;
    if (tagMap.has("frontend-ui")) domains.frontend = true;
    if (tagMap.has("database")) domains.database = true;

    return {
      needsCollab: true,
      reason: "multi-perspective task requires collaboration",
      assignedTo: "claude",
      domains
    };
  }
}
