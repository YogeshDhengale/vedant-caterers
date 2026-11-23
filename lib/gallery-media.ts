import { Binary } from "mongodb"

import type { GalleryMediaDoc } from "@/lib/mongo-documents"
import { upsertWithServerTimestamp } from "@/lib/mongo-timestamps"
import { galleryMediaCollection, getDb, mongoConfigured } from "@/lib/mongodb"

export const galleryMediaUrlPrefix = "api/gallery/media";

export function galleryMediaUrl(id: string) {
  return `/${galleryMediaUrlPrefix}/${id}`;
}

export function mediaIdFromFile(file: string) {
  const normalized = file.replace(/^\/+/, "");
  if (!normalized.startsWith(`${galleryMediaUrlPrefix}/`)) return null;
  const id = normalized.slice(galleryMediaUrlPrefix.length + 1);
  return id && !id.includes("/") && !id.includes("..") ? id : null;
}

export function isGalleryMediaFile(file: string) {
  return mediaIdFromFile(file) !== null;
}

export async function readGalleryMedia(id: string) {
  if (!mongoConfigured()) return null;
  const db = await getDb();
  const doc = await db
    .collection<GalleryMediaDoc>(galleryMediaCollection)
    .findOne({ _id: id });
  if (!doc?.data) return null;
  const bytes =
    doc.data instanceof Binary
      ? Buffer.from(doc.data.buffer)
      : Buffer.from(doc.data);
  const contentType =
    typeof doc.contentType === "string"
      ? doc.contentType
      : "application/octet-stream";
  return { bytes, contentType };
}

export async function writeGalleryMedia(
  id: string,
  bytes: Buffer,
  contentType: string,
  filename?: string,
) {
  if (!mongoConfigured()) throw new Error("MongoDB is not configured.");
  const db = await getDb();
  await upsertWithServerTimestamp(db.collection<GalleryMediaDoc>(galleryMediaCollection), {
    _id: id,
    contentType,
    filename: filename ?? "",
    data: new Binary(bytes),
  })
}

export async function deleteGalleryMedia(id: string) {
  if (!mongoConfigured()) return;
  const db = await getDb();
  await db
    .collection<GalleryMediaDoc>(galleryMediaCollection)
    .deleteOne({ _id: id });
}

export function contentTypeFromExtension(extension: string) {
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
