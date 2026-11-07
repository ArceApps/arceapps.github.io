export const agentSeries = [
  {
    "slug": "chatgpt-desktop-agent-orchestration",
    "date": "2026-11-07",
    "es": "ChatGPT Desktop como orquestador",
    "en": "ChatGPT Desktop as an orchestrator"
  },
  {
    "slug": "claude-desktop-external-coding-agents",
    "date": "2026-11-09",
    "es": "Claude Desktop y agentes externos",
    "en": "Claude Desktop and external agents"
  },
  {
    "slug": "mcp-acp-a2a-agent-protocols",
    "date": "2026-11-11",
    "es": "MCP, ACP y A2A: protocolos",
    "en": "MCP, ACP and A2A protocols"
  },
  {
    "slug": "multi-provider-coding-agent-workflow",
    "date": "2026-11-14",
    "es": "Agentes de varios proveedores hasta la PR",
    "en": "Multi-provider agents from task to PR"
  },
  {
    "slug": "multi-agent-routing-cost-control",
    "date": "2026-11-17",
    "es": "Controlar costes y routing de agentes",
    "en": "Agent routing and cost control"
  }
] as const;
export const agentSeriesSlugs: readonly string[] = agentSeries.map(item => item.slug);
