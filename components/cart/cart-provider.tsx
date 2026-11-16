"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { isCartLine, type CartLine } from "@/lib/cart"

type CartContextValue = {
  ready: boolean
  lines: CartLine[]
  total: number
  quantityOf: (key: string) => number
  add: (line: Omit<CartLine, "quantity">) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const storageKey = "vedant-menu-selection"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setLines(parsed.filter(isCartLine))
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(storageKey, JSON.stringify(lines))
  }, [hydrated, lines])

  const value = useMemo<CartContextValue>(() => {
    return {
      ready: hydrated,
      lines,
      total: lines.reduce((sum, line) => sum + line.quantity, 0),
      quantityOf: (key) => lines.find((line) => line.key === key)?.quantity ?? 0,
      add: (line) => {
        setLines((current) => {
          const existing = current.find((item) => item.key === line.key)
          if (!existing) return [...current, { ...line, quantity: 1 }]
          return current.map((item) =>
            item.key === line.key ? { ...item, ...line, quantity: item.quantity + 1 } : item
          )
        })
      },
      setQuantity: (key, quantity) => {
        setLines((current) => {
          if (quantity <= 0) return current.filter((item) => item.key !== key)
          return current.map((item) => (item.key === key ? { ...item, quantity } : item))
        })
      },
      remove: (key) => setLines((current) => current.filter((item) => item.key !== key)),
      clear: () => setLines([]),
    }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error("useCart must be used within CartProvider")
  return cart
}
