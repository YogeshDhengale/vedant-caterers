# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Use `interface` for object contracts, including every content type.
- Validate unknown external input (form submissions, query params) at system boundaries with Zod before trusting it.

## Next.js

- Default to React Server Components.
- Add `"use client"` only for browser interactivity or hooks (mobile menu, forms, carousels, lightbox).
- Keep client components small and push them to the leaves of the tree.
- Use the Next.js metadata API for titles, descriptions, Open Graph, and canonical URLs.
- Use `next/image` for all raster images and `next/link` for internal navigation.
- Keep route handlers and server actions focused on a single responsibility.

## Styling

- Use shadcn semantic token utilities only (` `, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`, etc.).
- No raw Tailwind palette classes (`zinc-*`, `stone-*`, etc.) and no hardcoded hex values.
- Compose class names with the `cn` helper.
- Build mobile-first: base styles target small screens, then add `sm:`, `md:`, `lg:` refinements.
- Follow the shadcn radius scale; keep radii consistent.
- Do not edit `components/ui/*`. Wrap or compose instead.

## Content

- All copy and structured business data live in `content/` or the site config, typed with interfaces.
- No hardcoded phone numbers, addresses, prices, or testimonials inside components.
- Never present unconfirmed information as fact. Placeholder content is labeled and tracked.

## Forms and API

- Validate and parse input before any logic runs, on both client and server.
- Return a consistent response shape (for example `{ ok: true }` or `{ ok: false, errors }`).
- Include spam protection on the enquiry endpoint.
- Keep the handler thin; delegate delivery to the adapter in `lib/`.
- Never expose secrets to the client. Environment variables are read on the server only unless prefixed for public use.

## Accessibility and Performance

- Every interactive element is keyboard accessible with a visible focus state.
- Every image has appropriate alt text and defined dimensions.
- Avoid large client-side libraries for simple effects; prefer CSS.
- Lazy-load below-the-fold media; prioritize only the hero image.

## File Organization

- `app/` — routes, layouts, metadata, and the enquiry endpoint.
- `components/ui/` — generated shadcn components (protected).
- `components/` — project UI grouped by responsibility (for example `layout/`, `sections/`, `forms/`, `gallery/`).
- `content/` — typed site content.
- `lib/` — utilities, validation schemas, site config, SEO helpers, enquiry adapter.
- `public/` — static assets.
- Name files after the responsibility they contain, not the technology.
