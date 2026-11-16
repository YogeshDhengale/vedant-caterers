# Vedant Caterers — Website Redesign

## Overview

Vedant Caterers is a luxury catering company based in Wakad, Pune, positioned as "one of India's premier luxury caterers." It serves weddings, corporate events, and private soirées, with a promise of exceptional food and flawless service.

This project is a redesign of the existing site at https://www.vedantcaterers.com/. The new site is a fast, elegant, mobile-first marketing website whose single job is to turn visitors into qualified event enquiries.

## Source of Truth For Business Facts

Only the following facts are confirmed from the current site:

- Brand name: Vedant Caterers
- Positioning: India's premier luxury catering
- Event types: weddings, corporate events, private soirées
- Promise: exceptional food, flawless service
- Base: Wakad, Pune

Everything else (menus, pricing, guest capacity, service area, cuisines, testimonials, contact details, social links) is **unconfirmed** until the client supplies it. Do not invent business facts, prices, client names, or reviews. Unknown content is tracked in `progress-tracker.md` under Open Questions and rendered with clearly marked placeholder content in development.

## Goals

1. Communicate premium, trustworthy luxury catering within the first screen.
2. Showcase services by event type (weddings, corporate, private events).
3. Let visitors explore food and menus through rich imagery and clear menu presentation.
4. Build trust with gallery, testimonials, and past-event proof.
5. Make it effortless to enquire — form, call, and WhatsApp — from any page, especially on mobile.
6. Rank well for local intent such as luxury and wedding catering in Pune and Wakad.

## Core User Flow

1. Visitor lands on the home page (search, referral, or social).
2. Visitor understands who Vedant is and what they offer from the hero and service highlights.
3. Visitor explores a service page, menus, or gallery.
4. Visitor reads testimonials or sees past events.
5. Visitor submits an enquiry (event type, date, guest count, contact) or taps call / WhatsApp.
6. Vedant's team receives the enquiry and follows up offline.

## Pages and Features

### Home

- Hero with brand statement and primary enquiry call to action.
- Service highlights, signature menu preview, gallery teaser, testimonials, closing enquiry call to action.

### Services

- Index plus one page per event type: weddings, corporate events, private soirées.
- Each page covers what is offered, the style of service, and an enquiry call to action.

### Menus

- Presentation of cuisines, signature dishes, and service styles (for example buffet, live counters, plated).
- Content depth depends on what the client provides.

### Gallery

- Curated, categorized photography of food, setups, and events.

### About

- Brand story, philosophy, team, and credentials.

### Testimonials

- Client quotes, only with real, client-approved content.

### Contact and Enquiry

- Enquiry form with validation and confirmation.
- Direct call and WhatsApp actions, address, and map for the Wakad base.

### Site-wide

- Responsive header with persistent enquiry call to action, footer with contact details, SEO metadata, and local business structured data.

## Scope

### In Scope

- Responsive marketing site covering the pages above
- Enquiry form with server-side validation and delivery to the business
- Call and WhatsApp click-to-contact actions
- Image-led gallery and menu presentation
- SEO, local business structured data, sitemap, and social sharing metadata
- Accessibility and performance suitable for mobile networks
- shadcn/ui with its default theme as the visual baseline
- English, Hindi, and Marathi, with a language switcher

### Out Of Scope

- Online ordering, cart, checkout, or payments
- User accounts and customer logins
- Live availability calendars or automated quote engines
- Additional languages beyond English, Hindi, and Marathi
- Native mobile apps
- Theme and brand-color finalization (deferred; see `ui-context.md`)

## Success Criteria

1. A first-time visitor can tell what Vedant offers and where it is based within seconds.
2. A visitor can submit a valid enquiry from any page in under a minute on a phone.
3. Every page passes basic accessibility checks and loads quickly on mobile.
4. The site surfaces correctly for local searches and shares cleanly on social platforms.
5. Client content can be updated without restructuring components.
6. Swapping the shadcn theme later requires changes only in the theme tokens, not in components.
