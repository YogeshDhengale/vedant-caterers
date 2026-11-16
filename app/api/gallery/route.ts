import { readGallery } from "@/lib/gallery-store"

export async function GET() {
  const gallery = await readGallery()
  return Response.json(
    { ok: true, categories: gallery.categories },
    { headers: { "cache-control": "no-store" } }
  )
}