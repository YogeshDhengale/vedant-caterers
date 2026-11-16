"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
} from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  Navbar,
  NavItems,
} from "@/components/layout/resizable-navbar";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content/dictionaries/en";
import { type Locale } from "@/lib/i18n";
import Image from "next/image";
import { LanguageSwitcher } from "../language-switcher";

function pathWithoutLocale(pathname: string, locale: Locale) {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return "";
}



function CartLink({ locale, label }: { locale: Locale; label: string }) {
  const cart = useCart();

  return (
    <Button variant="outline" size="lg" asChild>
      <Link href={`/${locale}/cart`} aria-label={label}>
        <ShoppingBag data-icon="inline-start" />
        {cart.total > 0 ? <span>{cart.total}</span> : null}
      </Link>
    </Button>
  );
}

function NavbarLogo({ locale, name }: { locale: Locale; name: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="text-foreground relative z-20 flex items-center gap-2 py-1 text-sm font-medium"
    >
      <Image src={"/logo.png"} alt={"logo"} width={50} height={50} />
    </Link>
  );
}

export function SiteNavbar({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const localizedPath = pathWithoutLocale(pathname, locale);

  const navItems = [
    { name: dictionary.nav.home, link: `/${locale}` },
    { name: dictionary.nav.gallery, link: `/${locale}/gallery` },
    { name: dictionary.nav.menus, link: `/${locale}/menu` },
    { name: dictionary.nav.contact, link: `/${locale}/contact` },
  ];

  const actions = (
    <>
      <LanguageSwitcher
        locale={locale}
        label={dictionary.language.label}
        localizedPath={localizedPath}
      />
      <Button size="lg" variant={"secondary"} className="max-lg:hidden" asChild>
        <Link href="#">{dictionary.actions.login}</Link>
      </Button>
    </>
  );

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo locale={locale} name={dictionary.logo} />
        <NavItems items={navItems} currentPath={pathname} />
        <div className="relative z-20 flex items-center gap-2">{actions}</div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo locale={locale} name={dictionary.logo} />
          <div className="flex items-center gap-1">
            <CartLink locale={locale} label={dictionary.actions.viewCart} />
            <MobileNavToggle
              isOpen={open}
              label={dictionary.actions.menu}
              onClick={() => setOpen((value) => !value)}
            />
          </div>
        </MobileNavHeader>
        <MobileNavMenu isOpen={open}>
          <div className="w-full">
            <LanguageSwitcher
              locale={locale}
              label={dictionary.language.label}
              localizedPath={localizedPath}
            />
          </div>
          {navItems.map((item) => (
            <Button
              key={item.link}
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 font-normal"
              asChild
            >
              <Link
                href={item.link}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.link ? "page" : undefined}
              >
                {item.name}
              </Link>
            </Button>
          ))}
          <Button size="lg" className="w-full" asChild>
            <Link href="#" onClick={() => setOpen(false)}>
              {dictionary.actions.login}
            </Link>
          </Button>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
