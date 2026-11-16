"use client"

import Script from "next/script"

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}

export function InstagramReels({
  permalinks,
  label,
}: {
  permalinks: readonly string[]
  label: string
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {permalinks.map((permalink) => (
        <div key={permalink} className="flex justify-center">
          <blockquote
            className="instagram-media w-full max-w-135 min-w-0!"
            data-instgrm-permalink={permalink}
            data-instgrm-version="14"
          >
            <a href={permalink} target="_blank" rel="noreferrer">
              {label}
            </a>
          </blockquote>
        </div>
      ))}
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        onReady={() => {
          window.instgrm?.Embeds.process()
        }}
      />
    </div>
  )
}
