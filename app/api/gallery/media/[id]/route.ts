import { readGalleryMedia } from "@/lib/gallery-media"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  if (!id || id.includes("..") || id.includes("/")) {
    return new Response("Not found", { status: 404 })
  }

  const media = await readGalleryMedia(id)
  if (!media) return new Response("Not found", { status: 404 })

  return new Response(media.bytes, {
    headers: {
      "content-type": media.contentType,
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}