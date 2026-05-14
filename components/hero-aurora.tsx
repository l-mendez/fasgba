"use client"

import { useEffect, useRef } from "react"

export function HeroAurora() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<HTMLCanvasElement>(null)

  // Aurora orbs layer (blurred)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let start = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas!.width = canvas!.offsetWidth * dpr
      canvas!.height = canvas!.offsetHeight * dpr
      ctx!.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    function isDark() {
      return document.documentElement.classList.contains("dark")
    }

    function draw(timestamp: number) {
      if (!start) start = timestamp
      const t = timestamp - start

      const w = canvas!.offsetWidth
      const h = canvas!.offsetHeight
      const dark = isDark()
      ctx!.clearRect(0, 0, w, h)

      const orbs = [
        {
          x: w * 0.25 + Math.sin(t * 0.0003) * w * 0.18,
          y: h * 0.35 + Math.cos(t * 0.0004) * h * 0.2,
          r: Math.min(w, h) * 0.6,
          color: dark ? "rgba(218, 160, 86, 0.3)" : "rgba(218, 160, 86, 0.35)",
        },
        {
          x: w * 0.75 + Math.cos(t * 0.00035) * w * 0.15,
          y: h * 0.3 + Math.sin(t * 0.00045) * h * 0.2,
          r: Math.min(w, h) * 0.55,
          color: dark ? "rgba(143, 63, 18, 0.35)" : "rgba(143, 63, 18, 0.2)",
        },
        {
          x: w * 0.5 + Math.sin(t * 0.00025 + 2) * w * 0.22,
          y: h * 0.75 + Math.cos(t * 0.0003 + 1) * h * 0.15,
          r: Math.min(w, h) * 0.5,
          color: dark ? "rgba(218, 160, 86, 0.2)" : "rgba(218, 160, 86, 0.25)",
        },
      ]

      for (const orb of orbs) {
        const gradient = ctx!.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, "transparent")
        ctx!.fillStyle = gradient
        ctx!.fillRect(0, 0, w, h)
      }

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  // Chessboard grid layer — moving & granulating
  useEffect(() => {
    const canvas = gridRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let start = 0
    const cellSize = 24
    // speed: pixels per second of diagonal drift
    const speed = 6

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas!.width = canvas!.offsetWidth * dpr
      canvas!.height = canvas!.offsetHeight * dpr
      ctx!.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    function isDark() {
      return document.documentElement.classList.contains("dark")
    }

    function draw(timestamp: number) {
      if (!start) start = timestamp
      const elapsed = (timestamp - start) / 1000 // seconds

      const w = canvas!.offsetWidth
      const h = canvas!.offsetHeight
      const dark = isDark()
      ctx!.clearRect(0, 0, w, h)

      // Continuous offset — use modulo over 2*cellSize so the
      // checkerboard pattern tiles seamlessly (period = 2 cells)
      const period = cellSize * 2
      const rawOffset = elapsed * speed
      const offsetX = rawOffset % period
      const offsetY = rawOffset % period

      const cols = Math.ceil(w / cellSize) + 3
      const rows = Math.ceil(h / cellSize) + 3

      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < cols; col++) {
          const isLight = (row + col) % 2 === 0
          if (!isLight) continue

          const x = col * cellSize + offsetX
          const y = row * cellSize + offsetY

          // Smooth per-cell shimmer using multiple sine waves
          const phase = col * 3.7 + row * 5.3
          const shimmer =
            (Math.sin(phase + elapsed * 1.2) +
              Math.sin(phase * 0.7 + elapsed * 0.8)) * 0.25 + 0.5
          const alpha = dark
            ? 0.03 + shimmer * 0.04
            : 0.04 + shimmer * 0.05

          ctx!.fillStyle = dark
            ? `rgba(218, 160, 86, ${alpha})`
            : `rgba(143, 63, 18, ${alpha})`
          ctx!.fillRect(x, y, cellSize, cellSize)
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: "blur(80px)" }}
      />
      <canvas
        ref={gridRef}
        className="absolute inset-0 w-full h-full"
      />
    </>
  )
}
