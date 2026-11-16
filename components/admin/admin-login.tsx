"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError("")
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const result = (await response.json()) as { ok: boolean; errors?: string[] }
    setPending(false)
    if (!result.ok) {
      setError(result.errors?.[0] ?? "Could not sign in.")
      return
    }
    router.refresh()
  }

  return (
    <main className="  text-foreground flex min-h-full items-center justify-center px-4 py-16">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <FieldGroup>
          <h1 className="font-heading text-primary-foreground text-3xl font-normal">Menu admin</h1>
          <FieldDescription>
            {configured
              ? "Sign in to add and edit menu categories and dishes."
              : "Set ADMIN_PASSWORD in .env.local, then restart the dev server."}
          </FieldDescription>
          <Field data-invalid={error ? true : undefined} data-disabled={!configured || undefined}>
            <FieldLabel htmlFor="admin-password">Password</FieldLabel>
            <Input
              id="admin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={!configured || pending}
              aria-invalid={error ? true : undefined}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <Button type="submit" disabled={pending || !configured}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>
    </main>
  )
}
