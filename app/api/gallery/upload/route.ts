import { NextResponse } from "next/server"

import { isAdmin } from "@/lib/admin-session"
import { galleryMediaUrlPrefix } from "@/lib/gallery-media"
import { GalleryError, galleryUrlPrefix, saveGalleryUpload } from "@/lib/gallery-store"

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, errors: ["Sign in required."] }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) throw new GalleryError("Choose an image file.")
    const bytes = Buffer.from(await file.arrayBuffer())
    const relative = await saveGalleryUpload(file.name, bytes)
    const previewUrl = relative.startsWith(`${galleryMediaUrlPrefix}/`)
      ? `/${relative}`
      : `${galleryUrlPrefix}/${relative.replace(/^gallery\//, "")}`
    return NextResponse.json({
      ok: true,
      file: relative,
      url: previewUrl,
    })
  } catch (error) {
    const message = error instanceof GalleryError ? error.message : "Could not upload the image."
    return NextResponse.json({ ok: false, errors: [message] }, { status: 400 })
  }
}