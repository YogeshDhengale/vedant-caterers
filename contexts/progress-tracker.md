# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Home hero block integrated from the supplied section component.

## Current Goal

- Replace the remaining hero demo copy (logo, Login, Try It Now) with the enquiry call to action.

## Completed

- Context files drafted from the reference project structure.
- Confirmed business facts captured from the current site's title and meta description.
- Next.js, TypeScript, Tailwind, and shadcn/ui are in place. UI components live in `components/ui`; styles live in `app/globals.css`.
- Home page renders `components/hero-section-01.tsx` (header, mobile menu, hero).
- Hero heading uses Instrument Serif via `font-heading`. The badge is removed. The photo area is a clipped row of rounded food images.
- Hero links and the menu control use the shared `Button` component.
- The site is localized for English, Hindi, and Marathi. Copy lives in `content/dictionaries`, routes are `/en`, `/hi`, and `/mr`, and the header switches language.
- Home includes a Why Choose Us section: three stat cards and a four-card bento. The third stat, 700+ guests at one event, comes from the supplied large-event detail. Stat cards are separated with the shadcn `Separator`.
- The header language control uses the shadcn `DropdownMenu` (English, Hindi, Marathi).
- Home includes a Testimonials section after Why Choose Us. The three quotes are labeled placeholders for a wedding, a corporate event, and a private gathering. They are not client-approved reviews. Two Vedant Instagram reels are embedded below the quotes.
- The hero photo row is the rotunda carousel, using the placeholder food images.
- Gallery page is at `/en/gallery`, `/hi/gallery`, and `/mr/gallery`. It has the five supplied categories and a booking banner that links to the contact page. Photo frames are labeled placeholders.
- Contact is a real enquiry form at `/en/contact`, `/hi/contact`, and `/mr/contact`. Business contact details (phone, email, address, hours) sit beside the form in a two-column layout. It collects name, email, phone, event date, event type, guest range, venue, and notes, then opens WhatsApp to +91 99221 87575 with that message. Contact and cart enquiry forms validate with Zod via `react-hook-form` and shared schemas in `lib/enquiry-schemas.ts`.
- The cart can download one program PDF. It keeps the filler pages, fills the cover with the guest's name, phone, venue, and date, and inserts menu sheets from the menu template with 12 selected dishes per page.
- The menu shows each subgroup as a card: a section badge, the group title, and the dishes. Thali and breakfast packages are added as one package with a quantity. Other dishes are added one at a time. The selection cart is at `/en/cart`, `/hi/cart`, and `/mr/cart`, and its enquiry also opens the same WhatsApp chat.
- The shared resizable navbar (`SiteNavbar` + `resizable-navbar`) renders once from `app/[lang]/layout.tsx` with scroll blur/shrink motion, centered nav links, cart, language switcher, and mobile menu. Home, Gallery, and Contact use real locale paths. The hero “Book Your Event Now” button also goes to the contact page.
- Menu page is at `/en/menu`, `/hi/menu`, and `/mr/menu`, with the supplied heading. Dishes are grouped in tabs for All Selection and the eleven menu sections, and each dish is a Card with an Item. Admin can add, edit, and delete categories from `/admin`. `public/data/menu.csv` starts with the supplied default menu: 70 categories and 853 dishes, from thali and breakfast packages through starters, soups, mains, breads, sweets, drinks, and paan counters. Hindi and Marathi names are blank and fall back to English until translated. Categories and dishes are edited at `/admin`. The local admin password is in `.env.local` as `ADMIN_PASSWORD`. Change it before the site is public. The hero “Explore Our Menu” button opens the menu page.
- Admin CSV data (menu, testimonials, gallery) is stored under `public/data/`. Program PDFs use Marathi or Hindi dish names when the visitor locale is `mr` or `hi` (English fallback when a translation is missing), with Noto Sans Devanagari embedded for those PDFs.

## In Progress

- None yet.

## Next Up

- Site config and `content/` scaffolding with clearly marked placeholders.
- Replace the hero block's demo copy (shadcn/studio, Login, summer recipes) with confirmed Vedant content and an enquiry call to action.
- Layout shell (header, mobile navigation, footer) aligned with the site information architecture.

## Open Questions

### Product and content

- Exact sitemap: are Menus, Gallery, About, and Testimonials separate pages or home-page sections?
- Real menus, cuisines, service styles, and any pricing or "starting from" information to display?
- Guest capacity range, service area beyond Wakad/Pune, and whether outstation events are served?
- Phone, WhatsApp number, email, full address, working hours, and social links?
- Professional photography and logo files: who supplies them, and in what formats?
- Real testimonials and past-event highlights approved for publication?
- Any certifications or credentials (for example FSSAI) to display?
- Should any language besides English, Hindi, and Marathi be added later?

### Design

- Final theme: palette, fonts, and radius (deferred; using shadcn default for now).
- Light only, dark only, or both?
- Any existing brand guidelines to respect, or a free redesign?

### Technical

- Confirm Next.js (App Router) + TypeScript as the framework.
- Enquiry delivery channel: email, WhatsApp API, CRM, or spreadsheet?
- Spam protection approach (honeypot, rate limit, CAPTCHA)?
- Hosting and domain handling (keep vedantcaterers.com; hosting provider)?
- Analytics and tracking needs (for example Google Analytics, Meta Pixel)?
- Will the client need to edit content themselves (requires a CMS) or is developer-managed content fine?

## Architecture Decisions

- UI uses shadcn/ui with the default theme and semantic tokens only; the theme is swappable via `globals.css` without component edits.
- Site content is typed and lives in `content/`; no business copy inside components.
- Enquiry delivery sits behind a single adapter in `lib/` so the channel can change independently.
- Site is static-first; the only dynamic surface is enquiry submission.
- Public routes are locale-prefixed. English, Hindi, and Marathi are the supported languages. Hindi and Marathi use Noto Devanagari fonts.

## Session Notes

- The live site renders client-side, so only the title and meta description were retrievable. Review the live site manually to capture sections, copy, and imagery before designing pages.
- The hero headline and supporting text use confirmed Vedant facts. The logo, Login, and Try It Now labels are still the original block copy. The photo row is temporary Unsplash food photography and must be replaced with Vedant photography before launch.
- `lucide-react` was already installed. The logo mark uses `UtensilsCrossedIcon`. The underline graphic stays as an inline SVG because it is a decorative stroke, not an icon.
- Testimonial cards use placeholder copy in all three languages. Replace the quotes, names, and event details with client-approved reviews before launch.
