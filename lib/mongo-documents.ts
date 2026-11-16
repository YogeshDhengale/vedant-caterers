import type { Binary } from "mongodb"

import type { GalleryCategory } from "@/lib/gallery-store"
import type { MenuCategory, MenuItem } from "@/lib/menu-store"
import type { Testimonial } from "@/lib/testimonials-store"

export type MenuContentDoc = {
  _id: "menu"
  categories: MenuCategory[]
  items: MenuItem[]
  updatedAt?: Date
}

export type TestimonialsContentDoc = {
  _id: "testimonials"
  items: Testimonial[]
  updatedAt?: Date
}

export type GalleryContentDoc = {
  _id: "gallery"
  categories: GalleryCategory[]
  updatedAt?: Date
}

export type GalleryMediaDoc = {
  _id: string
  contentType: string
  data: Binary
  filename?: string
  updatedAt?: Date
}