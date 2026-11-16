import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
} from "next/font/google";
import { notFound } from "next/navigation";

import { CartProvider } from "@/components/cart/cart-provider";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale, locales } from "@/lib/i18n";
import { buildSiteMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import "../globals.css";
import FooterSection6 from "@/components/footer-section-6";

const instrumentSerifHeading = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-noto-serif",
});

export const instant = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dictionary = getDictionary(lang);
  return buildSiteMetadata(lang, dictionary);
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const devanagari = lang === "hi" || lang === "mr";
  const dictionary = getDictionary(lang);

  return (
    <html
      lang={lang}
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        instrumentSerifHeading.variable,
        devanagari && notoSansDevanagari.variable,
        devanagari && notoSerifDevanagari.variable,
      )}
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="flex relative min-h-screen flex-col">
        <SiteJsonLd locale={lang} />
        <CartProvider>
          {/* Amber Glow Background */}
          <div className="absolute h-screen w-full">
          <div
            className="absolute inset-0 z-1"
            style={{
              backgroundImage: `
        radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)
      `,
              backgroundSize: "100% 100%",
            }}
          />
          </div>
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <SiteNavbar locale={lang} dictionary={dictionary} />
            <main className="min-w-0 flex-1">{children}</main>
            <FooterSection6 locale={lang} dictionary={dictionary} />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
