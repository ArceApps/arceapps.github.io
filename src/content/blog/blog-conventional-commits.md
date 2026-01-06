---
title: "Conventional Commits: El Lenguaje Universal de tu Repositorio"
description: "Descubre por qué Conventional Commits es el estándar de oro para equipos modernos, habilitando versionado semántico automático y changelogs generados por IA."
pubDate: "2025-11-01"
heroImage: "/images/placeholder-article-commits.svg"
tags: ["Git", "Best Practices", "DevOps", "Conventional Commits", "Communication"]
---
## 🗣️ El Problema de la Comunicación en Git

Revisemos el historial de un proyecto promedio:

```text
commit a1b2c3: fix bug
commit d4e5f6: updates
commit 789012: wtf is going on
commit 345678: final fix for real
```

**¿Qué problemas tiene esto?**
1.  **Imposible de automatizar**: Una máquina no sabe si "updates" es un breaking change o un cambio de documentación.
2.  **Difícil de leer**: Un humano no puede escanear esto para saber qué pasó en la última semana.
3.  **Sin contexto**: "fix bug" no dice qué bug, ni dónde, ni por qué.

**Conventional Commits** es una especificación ligera sobre cómo escribir mensajes de commit para resolver esto.

## 📏 La Estructura Anatómica

Un commit convencional tiene esta forma rígida:

```text
<tipo>(<ámbito opcional>): <descripción>

[cuerpo opcional]

[pie opcional]
```

### 1. El Tipo (Type)
Es la parte más importante para la automatización.
- `feat`: Una nueva característica (correlaciona con `MINOR` en SemVer).
- `fix`: Solución a un bug (correlaciona con `PATCH` en SemVer).
- `docs`: Cambios solo en documentación.
- `style`: Formato, puntos y comas faltantes (no afecta lógica).
- `refactor`: Cambio de código que no arregla bugs ni añade features.
- `test`: Añadir o corregir tests.
- `chore`: Tareas de mantenimiento (actualizar dependencias, scripts de build).

### 2. El Ámbito (Scope)
El contexto del cambio (ej. `auth`, `profile`, `database`).
- `feat(auth): implement google login`
- `fix(ui): correct padding in settings screen`

### 3. El Breaking Change (¡Peligro!)
Si el commit introduce un cambio que rompe compatibilidad, se añade un `!` después del tipo o un pie de página `BREAKING CHANGE:`.
- `feat!: remove legacy v1 api` -> Esto dispara un **MAJOR** version bump.

## 🤖 Beneficios de la Automatización (El "Por Qué")

Adoptar Conventional Commits habilita superpoderes en tu pipeline:

1.  **Versionado Semántico Automático**: Herramientas como `semantic-release` leen tus commits y deciden: "Hay 3 fixes y 1 feat, así que subo de v1.0.0 a v1.1.0". (Ver [artículo de versionado](blog-automated-versioning.md)).
2.  **Changelogs Generados**:
    ```markdown
    ## v1.1.0
    ### Features
    - **auth**: implement google login (a1b2c3)
    ### Bug Fixes
    - **ui**: correct padding in settings screen (d4e5f6)
    ```
3.  **Navegación Histórica**: Puedes filtrar fácilmente: `git log --grep="^feat"` para ver solo nuevas características.

## 🛠️ Herramientas para Forzar el Estándar

No confíes en la memoria humana. Configura herramientas para exigir el estándar.

### Husky + Commitlint
En tu proyecto Node/Android (vía npm):

```bash
# Instalar
npm install --save-dev @commitlint/{config-conventional,cli} husky

# Configurar hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

Ahora, si alguien intenta `git commit -m "fixed stuff"`, el commit fallará:
> ❌ input: fixed stuff
> ✖   subject may not be empty [subject-empty]
> ✖   type may not be empty [type-empty]

## 🧠 Mejores Prácticas Culturales

1.  **Commits Atómicos**: Conventional Commits te fuerza a pensar en unidades de trabajo. No puedes hacer un commit `feat(auth): login and fix database bug` porque mezcla tipos. Haz dos commits.
2.  **Imperativo Presente**: Usa "add" en lugar de "added". Piensa que estás completando la frase: "If applied, this commit will... **add google login**".
3.  **Cuerpo Explicativo**: Usa el cuerpo del commit para explicar el *por qué*, no el *qué*.
    ```text
    fix(auth): handle token expiration gracefully

    Previously, the app crashed when the token expired
    because we were force-unwrapping the result.
    Now we catch the exception and redirect to login.

    Closes #123
    ```

## 🎯 Conclusión

Conventional Commits es la diferencia entre un historial de git que es un "diario personal desordenado" y uno que es un "registro logístico preciso". Es el primer paso indispensable para cualquier equipo que aspire a DevOps maduro y automatización real.
