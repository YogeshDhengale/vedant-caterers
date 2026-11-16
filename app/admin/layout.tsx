import type { Metadata } from "next"

import "../globals.css"

export const metadata: Metadata = {
  title: "Site admin | Vedant Caterers",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-background text-foreground min-h-full">
        
        {children}
      </body>
    </html>
  )
}
