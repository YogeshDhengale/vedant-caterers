import type { Metadata } from "next"

import type { Dictionary } from "@/content/dictionaries/en"
import type { Locale } from "@/lib/i18n"
import { business, languageAlternates, localePath, siteUrl } from "@/lib/site"

const seoKeywords: Record<Locale, string[]> = {
  en: [
    "Vedant Caterers",
    "catering services Pune",
    "wedding caterers Pune",
    "corporate catering Pune district",
    "live food counter catering",
    "Maharashtrian catering Pune",
    "event catering Hinjewadi Wakad",
    "thali catering Pune",
  ],
  mr: [
    "वेदांत केटरर्स",
    "पुण्यात केटरिंग",
    "विवाह केटरिंग पुणे",
    "कॉर्पोरेट केटरिंग",
    "लाइव्ह फूड काउंटर",
  ],
  hi: [
    "वेदांत केटरर्स",
    "पुणे में केटरिंग",
    "शादी केटरर्स पुणे",
    "कॉर्पोरेट केटरिंग",
  ],
}

export function buildSiteMetadata(locale: Locale, dictionary: Dictionary, pathname = ""): Metadata {
  const url = localePath(locale, pathname)
  const title = dictionary.meta.title
  const description = dictionary.meta.description
  const site = siteUrl()

  return {
    metadataBase: new URL(site),
    title: {
      default: title,
      template: `%s | ${business.legalName}`,
    },
    description,
    keywords: seoKeywords[locale],
    applicationName: business.legalName,
    authors: [{ name: business.legalName, url: site }],
    creator: business.legalName,
    publisher: business.legalName,
    category: "Food & Drink",
    alternates: {
      canonical: url,
      languages: languageAlternates(pathname),
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      url,
      siteName: business.legalName,
      title,
      description,
      images: [
        {
          url: "/logo.png",
          width: 512,
          height: 512,
          alt: `${business.legalName} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "geo.region": `IN-${business.region}`,
      "geo.placename": business.locality,
      "geo.position": `${business.latitude};${business.longitude}`,
      ICBM: `${business.latitude}, ${business.longitude}`,
    },
  }
}

export function organizationJsonLd(locale: Locale, dictionary: Dictionary) {
  const url = localePath(locale)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl()}/#organization`,
        name: business.legalName,
        url: siteUrl(),
        logo: `${siteUrl()}/logo.png`,
        email: business.email,
        telephone: business.phoneE164,
        areaServed: business.areaServed,
        knowsAbout: [
          "Wedding catering",
          "Corporate event catering",
          "Live food counters",
          "Maharashtrian cuisine",
          "Large-scale banquets in Pune",
        ],
      },
      {
        "@type": "FoodEstablishment",
        "@id": `${siteUrl()}/#caterer`,
        name: business.legalName,
        description: dictionary.meta.description,
        url,
        image: `${siteUrl()}/logo.png`,
        telephone: business.phoneE164,
        email: business.email,
        servesCuisine: ["Indian", "Maharashtrian", "South Indian", "Chinese", "Italian"],
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          streetAddress: business.streetAddress,
          addressLocality: business.locality,
          addressRegion: business.region,
          postalCode: business.postalCode,
          addressCountry: business.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: business.latitude,
          longitude: business.longitude,
        },
        areaServed: {
          "@type": "AdministrativeArea",
          name: business.areaServed,
        },
        hasMenu: localePath(locale, "/menu"),
        potentialAction: {
          "@type": "CommunicateAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: localePath(locale, "/contact"),
            inLanguage: locale,
          },
          name: "Request a catering quote",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}/#website`,
        url: siteUrl(),
        name: business.legalName,
        description: dictionary.meta.description,
        inLanguage: locale,
        publisher: { "@id": `${siteUrl()}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: dictionary.meta.title,
        description: dictionary.meta.description,
        isPartOf: { "@id": `${siteUrl()}/#website` },
        about: { "@id": `${siteUrl()}/#caterer` },
        inLanguage: locale,
      },
    ],
  }
}

function openGraphLocale(locale: Locale) {
  if (locale === "mr") return "mr_IN"
  if (locale === "hi") return "hi_IN"
  return "en_IN"
}