import { readMenu } from "@/lib/menu-store"

export async function GET() {
  const menu = await readMenu()
  return Response.json(
    { ok: true, categories: menu.categories, items: menu.items },
    { headers: { "cache-control": "no-store" } }
  )
}
