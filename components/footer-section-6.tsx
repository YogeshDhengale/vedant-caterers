"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { Locale } from "@/lib/i18n";
import { Dictionary } from "@/content/dictionaries/en";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";

function pathWithoutLocale(pathname: string, locale: Locale) {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return "";
}

export function FooterSection6({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const pathname = usePathname();
  const localizedPath = pathWithoutLocale(pathname, locale);

  const navItems = [
    { name: dictionary.nav.home, link: `/${locale}` },
    { name: dictionary.nav.gallery, link: `/${locale}/gallery` },
    { name: dictionary.nav.menus, link: `/${locale}/menu` },
    { name: dictionary.nav.contact, link: `/${locale}/contact` },
  ];

  return (
    <footer className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Navigation */}
        <nav className="flex flex-col items-center justify-between gap-6 border-b py-8 md:flex-row md:py-10">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="text-foreground/80 hover:text-foreground relative font-medium transition-colors"
                aria-label={item.name}
              >
                {item.name}
                <span className="bg-foreground absolute inset-s-0 -bottom-1 h-0.5 w-0 transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          <LanguageSwitcher
            locale={locale}
            label={dictionary.language.label}
            localizedPath={localizedPath}
          />
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-6 py-8 text-sm lg:flex-row">
          <div className="mb-2 md:mb-0">
            <span className="text-muted-foreground me-2">
              &copy;
              <CopyrightYear />
            </span>
            <span className="text-foreground font-bold tracking-wider">
              Vedanta Caterrers
            </span>
          </div>

          <Button asChild variant="outline">
            <Link href={`/admin`} className="inline-flex items-center justify-center gap-2">
              <Settings data-icon="inline-start" /> Admin
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center mask-b-from-50%">
        <Image
          src="/logo.png"
          alt="Vedanta Caterrers"
          width={1200}
          height={1200}
          className="w-md object-contain"
        />
      </div>
    </footer>
  );
}

function CopyrightYear() {
  const [year, setYear] = useState("2026")

  useEffect(() => {
    setYear(String(new Date().getFullYear()))
  }, [])

  return <>{year}</>
}

export default FooterSection6;
