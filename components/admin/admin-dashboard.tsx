"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { GalleryEditor } from "@/components/admin/gallery-editor"
import { MenuEditor } from "@/components/admin/menu-editor"
import { TestimonialsEditor } from "@/components/admin/testimonials-editor"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MenuCategory, MenuItem } from "@/lib/menu-store"
import type { GalleryCategory } from "@/lib/gallery-store"
import type { Testimonial } from "@/lib/testimonials-store"

export function AdminDashboard({
  categories,
  items,
  testimonials,
  gallery,
}: {
  categories: MenuCategory[]
  items: MenuItem[]
  testimonials: Testimonial[]
  gallery: GalleryCategory[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState("menu")

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.refresh()
  }

  return (
    <main className="text-foreground mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-primary-foreground text-3xl font-normal">Site admin</h1>
          <p className="text-muted-foreground text-sm">
            Manage menu, testimonials, and gallery content. CSV metadata lives in{" "}
            <code className="text-xs">public/data/</code>; gallery images in{" "}
            <code className="text-xs">public/gallery/</code>.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
        <TabsContent value="menu" className="mt-8">
          <MenuEditor categories={categories} items={items} embedded />
        </TabsContent>
        <TabsContent value="testimonials" className="mt-8">
          <TestimonialsEditor testimonials={testimonials} />
        </TabsContent>
        <TabsContent value="gallery" className="mt-8">
          <GalleryEditor categories={gallery} />
        </TabsContent>
      </Tabs>
    </main>
  )
}