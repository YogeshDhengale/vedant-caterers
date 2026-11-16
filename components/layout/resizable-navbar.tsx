"use client"

import Link from "next/link"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react"
import { Menu, X } from "lucide-react"
import { type ReactNode, Children, cloneElement, isValidElement, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface NavbarProps {
  children: ReactNode
  className?: string
}

interface NavBodyProps {
  children: ReactNode
  className?: string
  visible?: boolean
}

interface NavItemsProps {
  items: { name: string; link: string }[]
  className?: string
  currentPath?: string
  onItemClick?: () => void
}

interface MobileNavProps {
  children: ReactNode
  className?: string
  visible?: boolean
}

interface MobileNavHeaderProps {
  children: ReactNode
  className?: string
}

interface MobileNavMenuProps {
  children: ReactNode
  className?: string
  isOpen: boolean
}

const floatedShadow =
  "shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05)]"

export function Navbar({ children, className }: NavbarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const [visible, setVisible] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100)
  })

  const scrolled = reduceMotion ? false : visible

  return (
    <motion.div ref={ref} className={cn("sticky inset-x-0 top-2 z-40 w-full min-w-0", className)}>
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible: scrolled })
          : child
      )}
    </motion.div>
  )
}

export function NavBody({ children, className, visible }: NavBodyProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "relative z-60 mx-auto hidden w-full max-w-7xl min-w-0 flex-row items-center justify-between self-start rounded-full px-6 py-4 lg:flex",
          visible && "bg-background/80 ring-1 ring-border",
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "min(100%, 55rem)" : "min(100%, 80rem)",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-60 mx-auto hidden w-full max-w-7xl min-w-0 flex-row items-center justify-between self-start rounded-full bg-transparent px-6 py-4 lg:flex",
        visible ? "bg-background/80" : "bg-background",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function NavItems({ items, className, currentPath, onItemClick }: NavItemsProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-2 text-sm font-medium lg:flex",
        className
      )}
    >
      {items.map((item, idx) => (
        <Link
          key={item.link}
          href={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className={cn(
            "text-muted-foreground hover:text-foreground relative px-4 py-2 transition-colors",
            currentPath === item.link && "text-foreground font-medium"
          )}
          aria-current={currentPath === item.link ? "page" : undefined}
        >
          {hovered === idx ? (
            <motion.div
              layoutId="site-nav-hovered"
              className="bg-primary absolute shadow shadow-primary/20 ring-offset-primary ring-2 ring-white/20 ring-inset ring-offset-2 inset-0 h-full w-full rounded-full"
            />
          ) : null}
          <span className="relative z-20">{item.name}</span>
        </Link>
      ))}
    </motion.div>
  )
}

export function MobileNav({ children, className, visible }: MobileNavProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] min-w-0 flex-col items-center justify-between rounded-full bg-transparent px-2 py-2 lg:hidden",
          visible && cn("bg-background/80 ring-1 ring-border", floatedShadow),
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "min(100%, calc(100vw - 2rem))" : "min(100%, calc(100vw - 2rem))",
        paddingRight: visible ? "1rem" : "0.5rem",
        paddingLeft: visible ? "1rem" : "0.5rem",
        borderRadius: visible ? "9999px" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] min-w-0 flex-col items-center justify-between rounded-full bg-transparent px-0 py-2 lg:hidden",
        visible && "bg-background/80",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function MobileNavHeader({ children, className }: MobileNavHeaderProps) {
  return (
    <div className={cn("flex w-full flex-row items-center justify-between gap-2 px-2", className)}>{children}</div>
  )
}

export function MobileNavMenu({ children, className, isOpen }: MobileNavMenuProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "bg-popover text-popover-foreground absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start gap-3 rounded-lg border px-4 py-6",
            floatedShadow,
            className
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function MobileNavToggle({
  isOpen,
  onClick,
  label,
}: {
  isOpen: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className="text-foreground inline-flex size-10 items-center justify-center rounded-full"
      aria-expanded={isOpen}
      aria-label={label}
      onClick={onClick}
    >
      {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
    </button>
  )
}