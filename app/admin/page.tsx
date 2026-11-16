import { Suspense } from "react"

import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminLogin } from "@/components/admin/admin-login"
import { adminConfigured, isAdmin } from "@/lib/admin-session"
import { readMenu } from "@/lib/menu-store"
import { readGallery } from "@/lib/gallery-store"
import { readTestimonials } from "@/lib/testimonials-store"

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground px-4 py-10 text-sm">Loading admin…</p>}>
      <AdminGate />
    </Suspense>
  )
}

async function AdminGate() {
  if (!(await isAdmin())) {
    return <AdminLogin configured={adminConfigured()} />
  }

  const [menu, testimonials, gallery] = await Promise.all([
    readMenu(),
    readTestimonials(),
    readGallery(),
  ])
  return (
    <AdminDashboard
      categories={menu.categories}
      items={menu.items}
      testimonials={testimonials}
      gallery={gallery.categories}
    />
  )
}
