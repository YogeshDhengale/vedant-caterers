"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/enquiry/quantity-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Dictionary } from "@/content/dictionaries/en";
import { dishKey, packageKey } from "@/lib/cart";
import type { Locale } from "@/lib/i18n";
import {
  categoryLabel,
  categorySection,
  isPackageSection,
  menuSections,
} from "@/lib/menu-sections";
import { localized } from "@/lib/menu-text";
import type { MenuData } from "@/lib/menu-store";
import { useIsMobile } from "@/hooks/use-mobile";

export function MenuPage({
  content,
  locale,
  menu,
}: {
  content: Dictionary["menuPage"];
  locale: Locale;
  menu: MenuData;
}) {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const cart = useCart();
  const cartBarSpring = {
    type: "spring" as const,
    stiffness: 320,
    damping: 28,
  };
  const groups = menu.categories
    .map((category) => ({
      category,
      section: categorySection(localized(category.name, "en")),
      items: menu.items.filter((item) => item.categoryId === category.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="  text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="font-heading text-primary-foreground text-3xl font-normal text-balance sm:text-4xl lg:text-5xl">
          {content.title}
        </h1>
        <p className="text-muted-foreground text-balance">{content.subtitle}</p>
        {cart.total > 0 ? (
          <Button asChild>
            <Link href={`/${locale}/cart`}>
              <ShoppingBag data-icon="inline-start" />
              {content.viewSelection} ({cart.total})
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col px-4 pb-16 sm:px-6 lg:px-8">
        <Tabs
          defaultValue="all"
          orientation={isMobile ? "horizontal" : "vertical"}
        >
          <TabsList className="md:sticky top-20 h-fit w-full md:w-fit max-w-fit overflow-x-auto md:overflow-hidden justify-start">
            <TabsTrigger value="all">{content.allTab}</TabsTrigger>
            {menuSections.map((section) => (
              <TabsTrigger key={section} value={section}>
                {content.sections[section]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all">
            <MenuGrid
              groups={groups}
              locale={locale}
              content={content}
              empty={content.empty}
            />
          </TabsContent>
          {menuSections.map((section) => (
            <TabsContent key={section} value={section}>
              <MenuGrid
                groups={groups.filter((group) => group.section === section)}
                locale={locale}
                content={content}
                empty={content.empty}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
        <AnimatePresence>
          {cart.total > 0 ? (
            <motion.div
              key="menu-cart-bar"
              initial={reduceMotion ? false : { width: "0%", opacity: 0 }}
              animate={{ width: "fit-content", opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { width: "0%", opacity: 0 }}
              transition={cartBarSpring}
              className="w-fit overflow-hidden inline-flex h-fit items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-foreground ring-2 ring-primary ring-offset-2"
            >
              <Link href={`/${locale}/cart`} className="inline-flex items-center justify-center gap-2">
                <ShoppingBag
                  data-icon="inline-start"
                  className="size-4 shrink-0"
                />
                {content.viewSelection} ({cart.total})
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuGrid({
  groups,
  locale,
  content,
  empty,
}: {
  groups: Array<{
    category: MenuData["categories"][number];
    section: ReturnType<typeof categorySection>;
    items: MenuData["items"];
  }>;
  locale: Locale;
  content: Dictionary["menuPage"];
  empty: string;
}) {
  if (groups.length === 0) {
    return <p className="text-muted-foreground text-center">{empty}</p>;
  }

  return (
    <div className="columns-1 space-y-4 gap-4 md:columns-2 xl:columns-3">
      {groups.map((group) => (
        <MenuCard
          key={group.category.id}
          group={group}
          locale={locale}
          content={content}
        />
      ))}
    </div>
  );
}

function MenuCard({
  group,
  locale,
  content,
}: {
  group: {
    category: MenuData["categories"][number];
    section: ReturnType<typeof categorySection>;
    items: MenuData["items"];
  };
  locale: Locale;
  content: Dictionary["menuPage"];
}) {
  const cart = useCart();
  const englishName = localized(group.category.name, "en");
  const title = categoryLabel(englishName);
  const sectionLabel = group.section ? content.sections[group.section] : title;
  const packaged = isPackageSection(group.section);
  const key = packageKey(group.category.id);
  const quantity = cart.quantityOf(key);

  return (
    <Card className="bg-card mb-4 break-inside-avoid gap-0 py-0">
      <CardHeader className="gap-3 pt-5">
        <Badge variant="secondary" className="uppercase tracking-wide">
          {sectionLabel}
        </Badge>
        <CardTitle className="font-heading text-xl font-normal">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <ItemGroup className="gap-0">
          {group.items.map((item, index) => {
            const name = localized(item.name, locale);
            const itemKey = dishKey(item.id);
            return (
              <div key={item.id}>
                {index > 0 ? <ItemSeparator className="my-0" /> : null}
                <Item size="sm" className="rounded-none px-1">
                  <ItemContent>
                    <ItemTitle className="line-clamp-none whitespace-normal font-normal">
                      {name}
                    </ItemTitle>
                  </ItemContent>
                  {packaged ? null : (
                    <ItemActions>
                      <Button
                        type="button"
                        variant={
                          cart.quantityOf(itemKey) > 0 ? "default" : "outline"
                        }
                        size="icon-sm"
                        className="rounded-full"
                        aria-label={`${content.addDish} ${name}`}
                        onClick={() =>
                          cart.add({
                            key: itemKey,
                            kind: "dish",
                            section: group.section ?? "",
                            name: item.name,
                          })
                        }
                      >
                        <Plus />
                      </Button>
                    </ItemActions>
                  )}
                </Item>
              </div>
            );
          })}
        </ItemGroup>
      </CardContent>
      {packaged ? (
        <CardFooter className="justify-between border-t py-4">
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            {content.fullPackage}
          </span>
          {quantity > 0 ? (
            <QuantityStepper
              quantity={quantity}
              decreaseLabel={content.decrease}
              increaseLabel={content.increase}
              onChange={(next) => cart.setQuantity(key, next)}
            />
          ) : (
            <Button
              type="button"
              className="rounded-full"
              onClick={() =>
                cart.add({
                  key,
                  kind: "package",
                  section: group.section ?? "",
                  name: { ...group.category.name, en: title },
                })
              }
            >
              <Plus data-icon="inline-start" />
              {content.addDraft}
            </Button>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}
