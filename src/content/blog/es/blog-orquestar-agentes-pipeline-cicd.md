---
title: "Orquestando Agentes de IA en tu Pipeline de CI/CD con Android"
description: "Aprende a integrar agentes especializados de IA (revisión de código, documentación, benchmarks) en tu pipeline CI/CD de Android con GitHub Actions y AGENTS.md."
pubDate: 2026-03-09
heroImage: "/images/blog-multiagente-pipeline-cicd.svg"
tags: ["IA", "Android", "CI/CD", "GitHub Actions", "Agentes", "Multi-Agent", "Automatización"]
draft: false
---

> Este artículo es parte de la serie sobre Agentes de IA en el desarrollo Android. Antes de continuar, te recomiendo revisar:
>
> - **[Más allá del Chat: Por qué necesitas Agentes en un entorno multi-agente en Android](/blog/blog-agentes-ia-android-teoria)** — La base teórica sobre qué son los agentes y por qué cambian el juego.
> - **[Tu Staff Virtual: Configurando Sentinel, Bolt y Palette](/blog/blog-configuracion-agentes-ia)** — Cómo montar cada agente en tu repositorio con `AGENTS.md`.
> - **[Agentes IA Autónomos en Android: Más Allá del Asistente](/blog/blog-agentes-ia-autonomos-android)** — El salto conceptual a agentes que actúan sin intervención humana.

---

Has configurado tus agentes. Sabes qué hace Sentinel, qué hace Bolt, qué hace Scribe. Los llamas manualmente cuando los necesitas, y funcionan bien. Pero hay un siguiente nivel: **hacer que esos agentes se activen solos, en el momento exacto que los necesitas, como parte natural de tu flujo de trabajo**. Eso es integrarlos en tu pipeline de CI/CD.

En este artículo vamos a construir una arquitectura donde tres agentes especializados colaboran de forma coordinada cada vez que abres una Pull Request en tu proyecto Android.

## 🗺️ La Arquitectura: Tres Agentes, Un Pipeline

El enfoque clásico de CI/CD Android tiene pasos bien conocidos: compilar, ejecutar tests, analizar lint, y publicar. Lo que vamos a hacer es insertar agentes de IA como *jobs adicionales* que corren en paralelo o en secuencia según las dependencias.

Nuestros tres agentes serán:

- **Sentinel** — Revisor de código. Analiza el diff de la PR, verifica convenciones Kotlin/Clean Architecture, busca problemas de seguridad y publica comentarios de review.
- **Scribe** — Documentador. Genera o actualiza KDoc para las funciones nuevas, actualiza el `CHANGELOG.md` con los cambios del PR, verifica que los `UseCase` tienen su descripción.
- **Bolt** — Performance. Ejecuta benchmarks de Android antes y después del cambio, compara los resultados y comenta si hay regresiones de rendimiento.

> **Principio clave:** Cada agente debe ser *stateless* dentro de su job. Recibe el contexto del evento (el diff del PR, el estado del repo), ejecuta su trabajo, y comunica su output via comentarios en GitHub o artefactos. No depende de que el agente anterior haya terminado — excepto cuando la lógica lo requiere.

## ⚙️ Estructura del Workflow YAML

El esqueleto del workflow tiene tres jobs de agentes. Sentinel corre primero (sus comentarios bloquean el merge si encuentra issues críticos), Scribe y Bolt corren en paralelo después de que Sentinel aprueba.

```yaml
# .github/workflows/ai-agents-pipeline.yml
name: AI Agents Pipeline

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  # ── JOB 1: Sentinel — Code Review Agent ─────────────────────────────
  sentinel-review:
    name: "🛡️ Sentinel: Code Review"
    runs-on: ubuntu-latest
    outputs:
      review_passed: ${{ steps.review.outputs.passed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get PR diff
        id: diff
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > pr_diff.txt
          echo "diff_lines=$(wc -l < pr_diff.txt)" >> $GITHUB_OUTPUT

      - name: Run Sentinel Agent
        id: review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: |
          python scripts/agents/sentinel_review.py \
            --diff pr_diff.txt \
            --pr-number "$PR_NUMBER" \
            --agents-config AGENTS.md \
            --output review_result.json

      - name: Post review comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const result = JSON.parse(fs.readFileSync('review_result.json'));
            if (result.comments.length > 0) {
              await github.rest.pulls.createReview({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.payload.pull_request.number,
                body: result.summary,
                event: result.critical_issues ? 'REQUEST_CHANGES' : 'COMMENT',
                comments: result.comments
              });
            }

  # ── JOB 2: Scribe — Documentation Agent ─────────────────────────────
  scribe-docs:
    name: "📝 Scribe: Documentation"
    runs-on: ubuntu-latest
    needs: sentinel-review
    if: needs.sentinel-review.outputs.review_passed == 'true'
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Run Scribe Agent
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          python scripts/agents/scribe_docs.py \
            --branch ${{ github.head_ref }} \
            --base ${{ github.base_ref }} \
            --update-kdoc \
            --update-changelog

      - name: Commit documentation updates
        run: |
          git config user.name "Scribe Agent"
          git config user.email "scribe-agent@arceapps.github.io"
          git add -A
          git diff --staged --quiet || \
            git commit -m "docs(scribe): auto-update KDoc and CHANGELOG [skip ci]"
          git push

  # ── JOB 3: Bolt — Performance Agent ─────────────────────────────────
  bolt-benchmarks:
    name: "⚡ Bolt: Performance Benchmarks"
    runs-on: ubuntu-latest
    needs: sentinel-review
    if: needs.sentinel-review.outputs.review_passed == 'true'
    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run Macrobenchmarks
        run: ./gradlew :benchmark:connectedBenchmarkAndroidTest

      - name: Run Bolt Analysis
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          python scripts/agents/bolt_benchmarks.py \
            --results benchmark/outputs/ \
            --baseline benchmark/baseline.json \
            --pr-number ${{ github.event.pull_request.number }} \
            --threshold-regression 10
```

## 🤖 Implementando Cada Agente como Script Python

Los workflows de GitHub Actions son el *orquestador*, pero la lógica real del agente vive en scripts Python que llaman a la API del LLM. Aquí el esquema de `sentinel_review.py`:

```python
# scripts/agents/sentinel_review.py
import argparse, json, os
from openai import OpenAI

def load_agents_config(path: str) -> str:
    """Lee el AGENTS.md para extraer las convenciones del proyecto."""
    with open(path) as f:
        return f.read()

def build_sentinel_prompt(diff: str, config: str) -> str:
    return f"""Eres Sentinel, un agente especializado en revisión de código Android/Kotlin.

CONVENCIONES DEL PROYECTO:
{config}

DIFF DEL PULL REQUEST:
{diff}

Revisa el código según las convenciones. Para cada problema encontrado, indica:
- file: ruta del archivo
- line: número de línea aproximado
- severity: critical | warning | suggestion
- body: descripción del problema y cómo solucionarlo

Responde en JSON con esta estructura:
{{
  "summary": "Resumen del review en Markdown",
  "critical_issues": boolean,
  "comments": [
    {{"path": "...", "position": N, "body": "..."}}
  ]
}}"""

def run_sentinel(diff_path: str, pr_number: str, config_path: str, output_path: str):
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    
    diff = open(diff_path).read()[:15000]  # límite de contexto
    config = load_agents_config(config_path)
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": build_sentinel_prompt(diff, config)}],
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    result["passed"] = not result["critical_issues"]
    
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    # Output para GitHub Actions
    print(f"passed={'true' if result['passed'] else 'false'}")
    with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as gho:
        gho.write(f"passed={'true' if result['passed'] else 'false'}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--diff")
    parser.add_argument("--pr-number")
    parser.add_argument("--agents-config")
    parser.add_argument("--output")
    args = parser.parse_args()
    run_sentinel(args.diff, args.pr_number, args.agents_config, args.output)
```

> **Nota de seguridad:** El diff nunca debe enviarse completo si supera el contexto del modelo. Implementa un sistema de chunking o filtra solo los archivos `.kt` relevantes para mantener la calidad del análisis.

## 📋 AGENTS.md como Fuente de Verdad del Pipeline

La clave para que los agentes sean *consistentes* entre ejecuciones es que todos lean el mismo `AGENTS.md`. Este archivo define las convenciones que Sentinel debe verificar, el tono que Scribe debe usar, y los umbrales que Bolt debe respetar.

```markdown
<!-- AGENTS.md — extracto de la sección para CI/CD -->
## Pipeline Rules

### Sentinel (Code Review)
- CRITICAL: Toda función pública debe tener KDoc
- CRITICAL: Los UseCase deben estar en el paquete `domain.usecase`
- WARNING: Evitar lógica de negocio en ViewModels
- SUGGESTION: Preferir `StateFlow` sobre `LiveData` en código nuevo

### Scribe (Documentation)
- Formato KDoc: primer párrafo = descripción, @param = todos los parámetros no obvios
- CHANGELOG: seguir formato Keep A Changelog, sección [Unreleased]
- Idioma: inglés para KDoc, español para comentarios internos

### Bolt (Performance)
- Regression threshold: 10% en startup time, 15% en operaciones de lista
- Baseline file: benchmark/baseline.json (actualizar en cada release)
- Métricas prioritarias: TimeToFullDisplayMs, FrameOverrunMs
```

Con este contrato, un nuevo agente que se añada a tus herramientas en el futuro puede leer el mismo `AGENTS.md` y comportarse de forma coherente. **Es como un onboarding automatizado para los agentes.**

## 🔀 Coordinación Avanzada: Flujos Condicionales

El ejemplo básico es lineal: Sentinel → (Scribe + Bolt). Pero los pipelines reales necesitan lógica condicional más sofisticada.

### Bypass de Scribe para PRs Pequeñas

```yaml
scribe-docs:
  needs: sentinel-review
  if: |
    needs.sentinel-review.outputs.review_passed == 'true' &&
    github.event.pull_request.changed_files > 3
```

### Agente de Seguridad Solo en Cambios de Capa de Datos

```yaml
security-scan:
  needs: sentinel-review
  if: |
    contains(github.event.pull_request.labels.*.name, 'data-layer') ||
    contains(steps.diff.outputs.changed_files, 'data/repository')
```

### Loop de Corrección Automática

El patrón más avanzado es el **self-healing pipeline**: si Sentinel encuentra problemas de estilo simples (no críticos), Bolt los corrige automáticamente, commitea, y re-trigger el workflow.

```yaml
- name: Auto-fix style issues
  if: steps.review.outputs.has_style_issues == 'true'
  run: |
    python scripts/agents/sentinel_autofix.py \
      --issues review_result.json \
      --apply-fixes
    git commit -am "fix(sentinel): auto-fix style issues [skip ci]"
    git push
```

> **¡Cuidado con los loops infinitos!** Añade siempre la condición `[skip ci]` en los commits automáticos de los agentes, o un check que detecte si el commit fue hecho por el agente para no re-trigger el pipeline.

## 🚀 Rollout Gradual: Del Piloto a Producción

No implementes todo esto de un golpe. Un rollout gradual reduce el riesgo y te permite calibrar los agentes:

**Semana 1-2:** Sentinel en modo `COMMENT` (no bloquea). Observa la calidad de sus reviews y ajusta el prompt.

**Semana 3-4:** Sentinel en modo `REQUEST_CHANGES` para issues críticas. Añade Scribe en modo de solo lectura (genera el KDoc pero no lo commitea).

**Semana 5+:** Pipeline completo. Bolt activo con thresholds conservadores (30% regresión antes de alertar). Afina hasta llegar al 10%.

Este enfoque te deja tiempo para **confiar** en tus agentes antes de darles permisos de escritura sobre el repositorio.

## Conclusión

Integrar agentes de IA en tu pipeline de CI/CD no es reemplazar tu proceso actual, sino **añadir una capa de inteligencia especializada** en los momentos exactos donde más valor aporta. Sentinel garantiza consistencia de código sin que el tech lead tenga que revisar cada PR manualmente. Scribe asegura que la documentación no se queda atrás del código. Bolt evita que las regresiones de performance lleguen a producción sin que nadie las detecte.

El `AGENTS.md` actúa como el contrato que mantiene a todos los agentes —humanos e IA— trabajando con las mismas reglas. Y GitHub Actions es el orquestador que decide cuándo y en qué orden actúa cada uno.

El siguiente paso natural es añadir un agente de planificación que coordine a los demás usando un framework como CrewAI o LangGraph. Pero eso ya es otra historia.

## Referencias

- [GitHub Actions Documentation — Jobs and Contexts](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/contexts)
- [OpenAI API — Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Android Benchmarking — Macrobenchmark](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
- [Keep A Changelog](https://keepachangelog.com/en/1.1.0/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [LangGraph — Agentic Workflows](https://langchain-ai.github.io/langgraph/)
