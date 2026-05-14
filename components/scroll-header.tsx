"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ScrollHeaderProps {
  children: React.ReactNode
  className?: string
}

export function ScrollHeader({ children, className }: ScrollHeaderProps) {
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const threshold = 10

    function onScroll() {
      const currentY = window.scrollY
      if (Math.abs(currentY - lastScrollY.current) < threshold) return

      setHidden(currentY > lastScrollY.current && currentY > 56)
      lastScrollY.current = currentY
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full transition-transform duration-300",
        hidden && "-translate-y-full",
        className
      )}
    >
      {children}
    </div>
  )
}
