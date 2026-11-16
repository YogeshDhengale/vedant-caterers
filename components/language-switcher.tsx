import { localeLabels, locales, type Locale } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";


export function LanguageSwitcher({
    locale,
    label,
    localizedPath,
  }: {
    locale: Locale;
    label: string;
    localizedPath: string;
  }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={label} variant="outline" size="lg">
            <Languages data-icon="inline-start" />
            <span>{locale}</span>
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {locales.map((code) => (
              <DropdownMenuItem key={code} asChild>
                <Link
                  href={`/${code}${localizedPath}`}
                  hrefLang={code}
                  lang={code}
                  aria-current={code === locale ? "page" : undefined}
                >
                  <Badge>{code}</Badge>
                  {localeLabels[code]}
                  {code === locale ? <Check /> : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
