# Architecture Context

Items marked **(assumed)** follow the reference project conventions and should be confirmed in `progress-tracker.md`.

## Stack

| Layer          | Technology                       | Role                                                        |
| -------------- | -------------------------------- | ----------------------------------------------------------- |
| Framework      | Next.js (App Router) + TypeScript **(assumed)** | Static-first site with a small server surface    |
| UI             | shadcn/ui + Tailwind CSS         | Component composition and styling                           |
| Theme          | shadcn default theme             | Baseline tokens; final theme not yet decided                |
| Icons          | Lucide React                     | Stroke-based icons                                          |
| Forms          | React Hook Form + Zod **(assumed)** | Enquiry form state and validation (via shadcn `form`)    |
| Images         | `next/image`                     | Optimized, responsive imagery                               |
| Enquiry intake | Next.js server action or route handler | Validate and deliver enquiries; delivery channel is an open question |
| Hosting        | Undecided                        | See open questions                                          |
| Language       | Locale routes (`/en`, `/hi`, `/mr`) | English, Hindi, and Marathi content from dictionaries   |

## System Boundaries

- `app/` — Routes, layouts, metadata, and the enquiry endpoint or server action. Pages are Server Components by default.
- `components/ui/` — Generated shadcn/ui components. Protected; do not edit.
- `components/` — Project UI: sections, layout shell, forms, gallery, and menu displays.
- `content/` — Typed, structured site content (services, menus, testimonials, gallery items, site settings) and locale dictionaries. No business content is hardcoded inside components.
- `lib/` — Shared utilities: `cn` helper, validation schemas, site config, SEO helpers, enquiry delivery adapter.
- `public/` — Static assets such as the logo, favicons, and optimized imagery.

## Content Model

- All editable copy and structured data live in `content/` as typed TypeScript modules.
- Visible copy is localized in `content/dictionaries` for English (`en`), Hindi (`hi`), and Marathi (`mr`). Routes are prefixed with the locale. `/` redirects to the visitor's preferred locale, falling back to English.
- Each content type has an `interface` (for example `Service`, `MenuCategory`, `Testimonial`, `GalleryItem`, `SiteSettings`).
- Pages and sections receive content as props or read it from `content/`; they never embed copy directly.
- A headless CMS is not part of the first version. If adopted later, only the `content/` layer should need to change.
- Menu, testimonials, and gallery metadata live in MongoDB when `MONGODB_URI` is set (`vedant_caterers` database by default). Gallery images are stored as BSON binaries in `gallery_media` and served from `/api/gallery/media/[id]`. Without MongoDB, the same data falls back to `public/data/*.csv` and files under `public/gallery/`. `/admin` edits through the APIs with the `ADMIN_PASSWORD` session.
- Placeholder content must be clearly flagged so it cannot reach production unnoticed.

## Enquiry Model

- The enquiry form collects: name, phone, email, event type, event date, approximate guest count, event location, and a message.
- Input is validated on the client for UX and re-validated on the server before any processing.
- The server handler is thin: validate, apply basic spam protection (for example a honeypot field and rate limiting), deliver, return a consistent response shape.
- The cart also builds a program PDF in `lib/program-pdf.ts`. It fills page 2 of `public/filler-pages.pdf` and inserts copies of `public/menu-page.pdf`, twelve selected dishes per page. For Marathi and Hindi carts, dish names use the localized menu fields with English fallback; Devanagari text uses an embedded font in `public/fonts/`.
- Delivery is a WhatsApp click-to-chat link built by `lib/whatsapp.ts` for `919922187575`. The contact form and the cart enquiry open `https://api.whatsapp.com/send/` with the visitor's details in the message. Nothing is stored on the server.
- The menu selection (packages and dishes, with quantities) is kept in the browser under `vedant-menu-selection` so the cart survives a refresh. Submitted enquiry text is not stored.
- Direct WhatsApp actions are plain links. There is no enquiry API route.

## Rendering and Performance Model

- Static generation by default for all marketing pages.
- Dynamic behavior is limited to the enquiry submission.
- Images use `next/image` with explicit dimensions or aspect ratios, appropriate `sizes`, and priority loading only for the above-the-fold hero.
- Client components are restricted to interactive pieces: mobile navigation, forms, carousels, lightbox, and accordion-style elements.

## SEO and Discoverability

- Per-page metadata with unique titles and descriptions through the Next.js metadata API.
- `LocalBusiness` (or `FoodEstablishment`/`CateringBusiness`-appropriate) JSON-LD using confirmed name, address, phone, and service area.
- Sitemap, robots, canonical URLs, and Open Graph/Twitter images.
- Local intent wording (Pune, Wakad) only where it reflects confirmed service areas.

## Invariants

1. Business content comes from `content/` and `lib/site config`, never from inline strings in components.
2. Pages default to Server Components; `"use client"` is added only for browser interactivity.
3. The enquiry endpoint validates all input server-side and does no long-running work.
4. `components/ui/*` is never edited; customization happens in app-level components.
5. Components use semantic shadcn tokens only, so the theme can be swapped in one place.
6. No unconfirmed business fact (price, capacity, testimonial, client name) is presented as real.
7. Every page remains usable and conversion-ready on a small mobile viewport.
