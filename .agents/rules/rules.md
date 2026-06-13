---
trigger: always_on
---

## Project Rules

Shadcn/ui:

- never create custom shadcn components manually
- always use official shadcn generator first
- install components with `npx shadcn@latest add <component>`
- customize styling after generation
- do not recreate component source from memory
- do not generate fake shadcn APIs

Builds:

- never run build automatically
- never run `npm run build`
- never run `pnpm build`
- never run deployment commands
- never run production builds for verification
- user decides when to build

Commands:

- avoid running commands unless required
- prefer code inspection over command execution
- ask before destructive operations
- ask before dependency installation

Dependencies:

- reuse existing packages first
- add new dependency only if clear benefit
- avoid dependency bloat
- prefer framework-native solutions

File Changes:

- modify smallest possible surface area
- preserve existing architecture
- do not rewrite working code unnecessarily
- do not rename files without reason
- do not move files without reason

Architecture:

- follow existing project patterns first
- consistency > personal preference
- simplest solution that solves problem
- optimize maintainability over cleverness

Output:

- show exact files changed
- explain only non-obvious decisions
- do not dump large code blocks when patch is small
