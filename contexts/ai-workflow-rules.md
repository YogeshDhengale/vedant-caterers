# Development Workflow

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior or business facts from scratch.

## Scoping Rules

- Work on one page, section, or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When To Split Work

Split an implementation step if it combines:

- Layout shell changes and page content work
- Multiple unrelated pages
- Form UI and enquiry delivery integration
- Theme or token changes and component work
- SEO infrastructure and page building
- Behavior or content that is not clearly defined in the context files

If a change cannot be verified quickly in the browser (desktop and mobile widths), the scope is too broad — split it.

## Suggested Build Order

1. Project setup: Next.js, TypeScript strict, Tailwind, shadcn/ui initialized with the default theme.
2. Site config and typed content scaffolding.
3. Layout shell: header, mobile navigation, footer, contact bar.
4. Home page sections.
5. Services pages.
6. Menus and gallery.
7. About and testimonials.
8. Contact page and enquiry form (UI), then enquiry delivery as a separate step.
9. SEO, structured data, sitemap, and social metadata.
10. Accessibility, performance, and content QA pass.

This order is a default and may be adjusted in `progress-tracker.md`.

## Handling Missing Requirements

- Do not invent product behavior or business facts that are not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement or piece of client content is missing, add it as an open question in `progress-tracker.md` before continuing. Use clearly marked placeholders in the meantime.

## Protected Foundation Components

Do not modify generated third-party foundation components unless explicitly instructed.

This includes:

- `components/ui/*` (shadcn/ui components)
- third-party library internals

These should remain default and reusable.

Project-specific styling, layout changes, and feature logic must be implemented in app-level components instead of modifying foundation components.

Only modify these files when a task explicitly requires it.

## Theme Changes

The theme is intentionally undecided. Do not introduce custom colors, fonts, or token edits unless the decision is recorded in `progress-tracker.md` and `ui-context.md` has been updated first.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries
- Content model or enquiry flow
- Theme, typography, or layout conventions
- Code conventions or standards
- Page scope

Progress state must reflect the actual state of the implementation, not the intended state.

## Before Moving To The Next Unit

1. The current unit works end to end within its defined scope, on desktop and mobile widths.
2. No invariant defined in `architecture-context.md` was violated.
3. No hardcoded business content or raw color classes were introduced.
4. `progress-tracker.md` reflects the completed work.
