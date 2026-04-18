# Unitor plugin for Claude Code

Multi-AI collaboration for complex software projects.

This plugin orchestrates Codex, Gemini, and Claude to work together as a team - discussing requirements, negotiating API contracts, and implementing complete full-stack applications autonomously.

## What You Get

- `/unitor:collab` for multi-AI collaboration on complex tasks
- `/unitor:route` for intelligent single-domain task routing
- `/unitor:config` and `/unitor:status` for team management

## Requirements

- **Claude Code**
- **Node.js 18.18 or later**
- **Gemini CLI** (optional, for frontend collaboration)
- **Codex CLI** (optional, for backend collaboration)

> [!NOTE]
> Unitor works with just Claude. Gemini and Codex are optional but highly recommended for multi-AI collaboration. Without them, all tasks route to Claude.

## Install

Add the marketplace in Claude Code:

```bash
/plugin marketplace add Done-0/unitor
```

Install the plugin:

```bash
/plugin install unitor@Done-0
```

Reload plugins:

```bash
/reload-plugins
```

The plugin is now ready. By default, Gemini and Codex are enabled but not required.

### Setting Up Gemini (Optional)

If you want Gemini to handle frontend tasks:

```bash
npm install -g @google/gemini-cli
gemini  # First run for authorization
```

### Setting Up Codex (Optional)

If you want Codex to handle backend tasks:

```bash
npm install -g @openai/codex
codex login
```

Check provider status:

```bash
/unitor:status
```

You should see which providers are available. If Gemini or Codex are not installed, they will show as unavailable and tasks will route to Claude instead.

### Setting Up Statusline (Optional)

Enable real-time statusline to show AI team activity:

```bash
/unitor:setup
```

The statusline shows:
- Provider status (enabled/disabled)
- Active collaborations with participants, phase, and discussion preview
- Recent task activity when no active sessions

To disable:

```bash
claude config unset statusline.command
```

## How It Works

### Multi-AI Collaboration

When you run `/unitor:collab` with a multi-domain task, Unitor orchestrates real AI-to-AI collaboration:

1. **Detects domains** - Identifies backend, frontend, database needs
2. **Assigns specialists** - Routes to Codex (backend), Gemini (frontend), Claude (architecture)
3. **Round-table discussion** - AIs discuss requirements and negotiate API contracts
4. **Autonomous implementation** - Each AI implements their part
5. **Verification** - System validates integration

Example:

```bash
/unitor:collab "build user list page: React frontend and Express backend with GET /api/users"
```

**What happens:**
- Codex proposes backend API structure
- Gemini proposes frontend component design
- They negotiate data format (object wrapper vs array)
- Both implement and create actual files
- System verifies the integration

**Result:** Complete working application in `user-list-app/`:
```
user-list-app/
├── backend/server.mjs       # Express API on port 3001
├── frontend/src/App.jsx     # React app
└── README.md                # Setup instructions
```

### Single-Domain Routing

For single-domain tasks, `/unitor:route` picks the best specialist:

- Frontend/CSS → Gemini
- Backend/API → Codex  
- Architecture/Security → Claude

Routing uses tag-weight matching based on each AI's expertise.

## Usage

### `/unitor:collab`

Orchestrate multiple AIs to collaborate on complex tasks.

Use it when you want:
- Multiple AIs to work together on a full-stack feature
- Backend and frontend implemented in one go
- Real AI discussion and negotiation

Examples:

```bash
/unitor:collab "build user authentication: React login form + Express JWT API"
/unitor:collab "create todo app with React frontend and Express backend"
```

> [!NOTE]
> Collaboration takes 5-8 minutes. AIs discuss, negotiate, implement, and verify. This is real work, not instant generation.

### `/unitor:route`

Route a single-domain task to the best specialist.

Use it when you want:
- A frontend task handled by Gemini
- A backend task handled by Codex
- Quick routing without collaboration overhead

Examples:

```bash
/unitor:route "fix the login button styling"
/unitor:route "implement user authentication API"
/unitor:route "refactor authentication architecture"
```

### `/unitor:config`

Manage your AI team configuration.

View current setup:

```bash
/unitor:config --show
```

Configure models:

```bash
/unitor:config --set-model gemini gemini-2.0-flash-exp
/unitor:config --set-model codex gpt-5.4
```

Enable/disable providers:

```bash
/unitor:config --enable gemini
/unitor:config --disable codex
```

### `/unitor:status`

Check provider health and recent tasks.

```bash
/unitor:status
/unitor:status --json
```

## Typical Flows

### Multi-Domain Feature

```bash
/unitor:collab "build user profile page with API and React UI"
```

### Single-Domain Task

```bash
/unitor:route "add search box to navigation"
```

### Check Team Status

```bash
/unitor:status
```

## Supported AI Providers

| Provider | Best For | Default Model |
|----------|----------|---------------|
| Claude | Architecture, security, orchestration | claude-sonnet-4-6 |
| Gemini | Frontend UI, CSS, React/Vue | gemini-flash-latest |
| Codex | Backend API, database, Python/Go | gpt-5.4 |

## Production Features

- **Real AI collaboration** - Calls actual Codex and Gemini CLIs, not simulated
- **Autonomous consensus** - AIs detect agreement and move to implementation
- **File verification** - Validates actual file contents match agreed contracts
- **Retry logic** - 2 retries with exponential backoff for transient errors
- **Timeout protection** - 300s default, configurable per provider
- **Cost protection** - Max 50 provider calls per collaboration
- **Graceful degradation** - Continues if one AI fails

## FAQ

### Do I need Gemini and Codex installed?

For **routing** (`/unitor:route`): No. Without them, all tasks route to Claude.

For **collaboration** (`/unitor:collab`): Highly recommended. Multi-AI collaboration needs at least 2 different providers. With only Claude, you lose the collaboration benefit.

### How does multi-AI collaboration work?

Unitor spawns real CLI processes:
- Codex: `codex exec "<prompt>"`
- Gemini: `gemini --prompt "<prompt>"`

Each AI receives full conversation history and responds naturally. The system detects consensus by analyzing responses for agreement signals and unresolved questions.

This is not simulated - it's real AI-to-AI communication.

### Why does collaboration take several minutes?

Real AI collaboration involves:
- Discussion rounds (30-60s per AI per round)
- File creation (2-5 minutes for complete projects)
- Verification (reading and validating files)

A typical 3-round collaboration takes 5-8 minutes. This is production-grade work.

### What if an AI times out?

The system retries twice. If both fail:
- Marks the AI as temporarily unavailable
- Continues with remaining AIs
- Other AIs can still complete their parts

### Can I see the conversation history?

Yes. The collaboration output shows all rounds with full AI responses.

### How do I install Gemini CLI?

```bash
npm install -g @google/gemini-cli
gemini  # First run for authorization
```

### How do I install Codex CLI?

```bash
npm install -g @openai/codex
codex login
```

### Will it use my existing CLI config?

Yes. Unitor uses your local CLI installations and picks up existing authentication and configuration.

### Can I use different models?

Yes:

```bash
/unitor:config --set-model gemini gemini-2.0-flash-exp
/unitor:config --set-model codex gpt-5.4
```

### What happens if a provider fails?

For **routing**: Retries, then falls back to Claude.

For **collaboration**: Retries twice, then marks as unavailable and continues with remaining AIs.

### How much does collaboration cost?

Depends on your provider pricing:
- Codex (OpenAI): ~$0.01-0.05 per collaboration
- Gemini (Google): Often has free tier
- Cost protection: Max 50 provider calls per collaboration

Typical 3-round collaboration: 6-10 API calls total.

## License

MIT
