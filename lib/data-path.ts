import path from "node:path"

/** CSV and other admin-editable data live under public/data for deploy-friendly paths. */
export const dataDirectory = path.join(process.cwd(), "public", "data")

export function dataCsvPath(filename: string) {
  return path.join(dataDirectory, filename)
}