// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import rehypeExternalLinks from 'rehype-external-links';
import { remarkLocaleLinks } from './src/plugins/remark-locale-links.ts';
// import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://arceapps.com',

  markdown: {
    remarkPlugins: [remarkLocaleLinks],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
        },
      ],
    ],
  },

  prefetch: true,

  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false
    }
  },

  integrations: [
    sitemap({
      filter: (page) => {
        if (page === '/' || page === '/about-me' || page === '/contact' || page.startsWith('/api')) {
          return false;
        }
        return true;
      },
      customPages: [
        'https://arceapps.com/blog',
        'https://arceapps.com/es/blog',
        'https://arceapps.com/apps',
        'https://arceapps.com/es/apps',
        'https://arceapps.com/devlog',
        'https://arceapps.com/es/devlog',
      ],
    }),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  base: '/',
  redirects: {
    '/blog/agents-of-chaos-ai-security': '/blog/agents-chaos-ai-security',
    '/blog/blog-grill-me-claude-skill-deep-dive': '/blog/grill-me-claude-skill-deep-dive',
    '/blog/blog-grill-me-sdd-adversarial-workflow-comparison': '/blog/grill-me-sdd-adversarial-workflow-comparison',
    '/blog/blog-gsd-core-context-engineering': '/blog/gsd-core-context-engineering',
    '/blog/blog-headroom-compression-layer': '/blog/headroom-compression-layer',
    '/blog/blog-mattpocock-skills': '/blog/mattpocock-skills',
    '/blog/blog-opencode-subagents': '/blog/opencode-subagents',
    '/blog/blog-openspec-mobile-development': '/blog/openspec-mobile-development',
    '/blog/blog-rules-md-estandar': '/blog/rules-md-estandar',
    '/blog/blog-semantic-code-search-tools': '/blog/semantic-code-search-tools',
    '/blog/blog-socratic-grilling-sdd': '/blog/socratic-grilling-sdd',
    '/blog/blog-socratic-method-prompts-kotlin-android': '/blog/socratic-method-prompts-kotlin-android',
    '/blog/blog-spec-kitty-mobile-development': '/blog/spec-kitty-mobile-development',
    '/blog/blog-superpowers-deep-dive': '/blog/superpowers-deep-dive',
    '/blog/blog-superpowers-vs-openspec': '/blog/superpowers-vs-openspec',
    '/blog/hermes-vs-openclaw-en': '/blog/hermes-vs-openclaw',
    '/blog/junior-to-senior-prioritization': '/blog/junior-senior-prioritization',
    '/devlog/2025-w50-perfecting-the-end': '/devlog/2025-w50-perfecting-end',
    '/devlog/2025-w53-difficulty-standardization-and-closing': '/devlog/2025-w53-difficulty-standardization-closing',
    '/devlog/2026-w07-the-assembly-line': '/devlog/2026-w07-assembly-line',
    '/devlog/2026-w18-security-and-visual-hierarchy': '/devlog/2026-w18-security-visual-hierarchy',
    '/devlog/refining-the-experience': '/devlog/refining-experience',
    '/es/blog/blog-agent-skills-contexto-dinamico': '/es/blog/agent-skills-contexto-dinamico',
    '/es/blog/blog-agentes-ia-android-teoria': '/es/blog/agentes-ia-android-teoria',
    '/es/blog/blog-agentes-ia-autonomos-android': '/es/blog/agentes-ia-autonomos-android',
    '/es/blog/blog-agentes-ia-skills': '/es/blog/agentes-ia-skills',
    '/es/blog/blog-agents-md-estandar': '/es/blog/agents-md-estandar',
    '/es/blog/blog-agents-of-chaos-seguridad-agentica': '/es/blog/agents-of-chaos-seguridad-agentica',
    '/es/blog/blog-ai-agents-coding': '/es/blog/ai-agents-coding',
    '/es/blog/blog-ai-skills-desarrollo': '/es/blog/ai-skills-desarrollo',
    '/es/blog/blog-android-16-baklava': '/es/blog/android-16-baklava',
    '/es/blog/blog-android-documentation': '/es/blog/android-documentation',
    '/es/blog/blog-automated-documentation': '/es/blog/automated-documentation',
    '/es/blog/blog-automated-versioning': '/es/blog/automated-versioning',
    '/es/blog/blog-cde-semantic-versioning': '/es/blog/cde-semantic-versioning',
    '/es/blog/blog-chatgpt-5-3-codex-review': '/es/blog/chatgpt-5-3-codex-review',
    '/es/blog/blog-claude-4-6-enterprise-launch': '/es/blog/claude-4-6-enterprise-launch',
    '/es/blog/blog-claude-4-6-sonnet-opus-review': '/es/blog/claude-4-6-sonnet-opus-review',
    '/es/blog/blog-clean-architecture': '/es/blog/clean-architecture',
    '/es/blog/blog-clean-architecture-ia': '/es/blog/clean-architecture-ia',
    '/es/blog/blog-code-review-ia': '/es/blog/code-review-ia',
    '/es/blog/blog-configuracion-agentes-ia': '/es/blog/configuracion-agentes-ia',
    '/es/blog/blog-contexto-efectivo-ia': '/es/blog/contexto-efectivo-ia',
    '/es/blog/blog-conventional-commits': '/es/blog/conventional-commits',
    '/es/blog/blog-deepseek-r1-coding': '/es/blog/deepseek-r1-coding',
    '/es/blog/blog-dependency-injection': '/es/blog/dependency-injection',
    '/es/blog/blog-design-md-estandar': '/es/blog/design-md-estandar',
    '/es/blog/blog-firebase-crashlytics': '/es/blog/firebase-crashlytics',
    '/es/blog/blog-flujos-trabajo-agentes-android': '/es/blog/flujos-trabajo-agentes-android',
    '/es/blog/blog-gemini-3-1-release': '/es/blog/gemini-3-1-release',
    '/es/blog/blog-gemini-desarrollo-android': '/es/blog/gemini-desarrollo-android',
    '/es/blog/blog-gemini-nano-android-on-device': '/es/blog/gemini-nano-android-on-device',
    '/es/blog/blog-github-actions': '/es/blog/github-actions',
    '/es/blog/blog-github-actions-play-store': '/es/blog/github-actions-play-store',
    '/es/blog/blog-github-copilot-android': '/es/blog/github-copilot-android',
    '/es/blog/blog-github-pages': '/es/blog/github-pages',
    '/es/blog/blog-grill-me-claude-skill-deep-dive': '/es/blog/grill-me-claude-skill-deep-dive',
    '/es/blog/blog-grill-me-sdd-adversarial-workflow-comparison': '/es/blog/grill-me-sdd-adversarial-workflow-comparison',
    '/es/blog/blog-gsd-core-context-engineering': '/es/blog/gsd-core-context-engineering',
    '/es/blog/blog-headroom-compression-layer': '/es/blog/headroom-compression-layer',
    '/es/blog/blog-herramientas-ia-2026': '/es/blog/herramientas-ia-2026',
    '/es/blog/blog-hipocampus-memoria-jerarquica-agentes': '/es/blog/hipocampus-memoria-jerarquica-agentes',
    '/es/blog/blog-hmem-sqlite-memoria-jerarquica-agentes': '/es/blog/hmem-sqlite-memoria-jerarquica-agentes',
    '/es/blog/blog-ia-tdd-android': '/es/blog/ia-tdd-android',
    '/es/blog/blog-kmp-2025-state': '/es/blog/kmp-2025-state',
    '/es/blog/blog-kotlin-2-1-features': '/es/blog/kotlin-2-1-features',
    '/es/blog/blog-kotlin-collections-sequences': '/es/blog/kotlin-collections-sequences',
    '/es/blog/blog-kotlin-coroutines': '/es/blog/kotlin-coroutines',
    '/es/blog/blog-kotlin-delegation': '/es/blog/kotlin-delegation',
    '/es/blog/blog-kotlin-flow-advanced': '/es/blog/kotlin-flow-advanced',
    '/es/blog/blog-kotlin-let': '/es/blog/kotlin-let',
    '/es/blog/blog-lean-task-first-beads-leanspec-taskmaster': '/es/blog/lean-task-first-beads-leanspec-taskmaster',
    '/es/blog/blog-mattpocock-skills': '/es/blog/mattpocock-skills',
    '/es/blog/blog-memoria-persistente-agentes-ia': '/es/blog/memoria-persistente-agentes-ia',
    '/es/blog/blog-memoria-seguridad-privacidad-agentica': '/es/blog/memoria-seguridad-privacidad-agentica',
    '/es/blog/blog-metodo-para-memoria-ia-archivos': '/es/blog/metodo-memoria-ia-archivos',
    '/es/blog/blog-mvvm-architecture': '/es/blog/mvvm-architecture',
    '/es/blog/blog-mvvm-model': '/es/blog/mvvm-model',
    '/es/blog/blog-mvvm-view': '/es/blog/mvvm-view',
    '/es/blog/blog-mvvm-viewmodel': '/es/blog/mvvm-viewmodel',
    '/es/blog/blog-nanostack-agentes-ia': '/es/blog/nanostack-agentes-ia',
    '/es/blog/blog-null-safety': '/es/blog/null-safety',
    '/es/blog/blog-opencode-plugins-memoria-nativos': '/es/blog/opencode-plugins-memoria-nativos',
    '/es/blog/blog-opencode-subagents': '/es/blog/opencode-subagents',
    '/es/blog/blog-openspec-desarrollo-movil': '/es/blog/openspec-desarrollo-movil',
    '/es/blog/blog-orquestar-agentes-pipeline-cicd': '/es/blog/orquestar-agentes-pipeline-cicd',
    '/es/blog/blog-paperclip-ai-empresa-cero-humanos': '/es/blog/paperclip-ai-empresa-cero-humanos',
    '/es/blog/blog-paradigmas-alternativos-ingenieria-software-ia': '/es/blog/paradigmas-alternativos-ingenieria-software-ia',
    '/es/blog/blog-plugmem-microsoft-memoria-agentes': '/es/blog/plugmem-microsoft-memoria-agentes',
    '/es/blog/blog-primeros-principios-razonamiento-ia-quint-code': '/es/blog/primeros-principios-razonamiento-ia-quint-code',
    '/es/blog/blog-reasoning-models-o1-r1': '/es/blog/reasoning-models-o1-r1',
    '/es/blog/blog-refactoring-ia': '/es/blog/refactoring-ia',
    '/es/blog/blog-repository-pattern': '/es/blog/repository-pattern',
    '/es/blog/blog-room-database': '/es/blog/room-database',
    '/es/blog/blog-rules-md-estandar': '/es/blog/rules-md-estandar',
    '/es/blog/blog-sdd-frameworks-spec-kit-openspec-bmad': '/es/blog/sdd-frameworks-spec-kit-openspec-bmad',
    '/es/blog/blog-semantic-code-search-tools': '/es/blog/semantic-code-search-tools',
    '/es/blog/blog-semantic-versioning': '/es/blog/semantic-versioning',
    '/es/blog/blog-servidores-mcp-memoria-cross-agent': '/es/blog/servidores-mcp-memoria-cross-agent',
    '/es/blog/blog-slms-vs-llms-android-inferencia-local': '/es/blog/slms-vs-llms-android-inferencia-local',
    '/es/blog/blog-socratic-grilling-sdd': '/es/blog/socratic-grilling-sdd',
    '/es/blog/blog-socratic-method-prompts-kotlin-android': '/es/blog/socratic-method-prompts-kotlin-android',
    '/es/blog/blog-solid-principles': '/es/blog/solid-principles',
    '/es/blog/blog-spec-kitty-mobile-development': '/es/blog/spec-kitty-mobile-development',
    '/es/blog/blog-specs-driven-development': '/es/blog/specs-driven-development',
    '/es/blog/blog-stack-completo-agentes-ia-2026': '/es/blog/stack-completo-agentes-ia-2026',
    '/es/blog/blog-stack-memoria-persistente-implementacion': '/es/blog/stack-memoria-persistente-implementacion',
    '/es/blog/blog-stateflow-sharedflow': '/es/blog/stateflow-sharedflow',
    '/es/blog/blog-superpowers-deep-dive': '/es/blog/superpowers-deep-dive',
    '/es/blog/blog-superpowers-vs-openspec': '/es/blog/superpowers-vs-openspec',
    '/es/blog/blog-use-cases': '/es/blog/use-cases',
    '/es/blog/hermes-vs-openclaw-es': '/es/blog/hermes-vs-openclaw',
    '/es/blog/obsidian-para-desarrolladores': '/es/blog/obsidian-desarrolladores',
    '/es/devlog/2025-W50-Perfeccionando-El-Final': '/es/devlog/2025-W50-Perfeccionando-Final',
    '/es/devlog/2025-W53-Estandarizacion-Dificultad-y-Cierre': '/es/devlog/2025-W53-Estandarizacion-Dificultad-Cierre',
    '/es/devlog/2026-W18-Seguridad-Y-Jerarquia-Visual': '/es/devlog/2026-W18-Seguridad-Jerarquia-Visual',
    '/es/devlog/refinando-la-experiencia': '/es/devlog/refinando-experiencia',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
