import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

const SEGMENT_COUNT = 36
const SEGMENT_SPACING = 14
const SPEED = 95
const TURN_RATE = 2.4
const FOOD_JUMP_DIST = 110
const GRID = 50 // matches the hero grid background-size

type Palette = { stroke: string; glow: string; food: string; eye: string }

function palette(): Palette {
  const isDark = document.documentElement.classList.contains('dark')
  if (isDark) {
    return {
      stroke: 'rgba(255, 255, 255, 0.18)',
      glow: 'rgba(255, 255, 255, 0.28)',
      food: 'rgba(255, 180, 80, 0.9)',
      eye: 'rgba(10, 10, 10, 0.9)',
    }
  }
  return {
    stroke: 'rgba(0, 0, 0, 0.16)',
    glow: 'rgba(0, 0, 0, 0.2)',
    food: 'rgba(230, 140, 30, 0.9)',
    eye: 'rgba(255, 255, 255, 0.95)',
  }
}

function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

function drawSmoothPath(
  c: CanvasRenderingContext2D,
  pts: Point[],
  maxWidth: number,
  minWidth: number,
) {
  if (pts.length < 2) return
  const n = pts.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n - 1, i + 2)]
    const t = i / (n - 1)
    c.lineWidth = maxWidth + (minWidth - maxWidth) * t
    c.globalAlpha = 1 - t * 0.85
    c.beginPath()
    c.moveTo(p1.x, p1.y)
    for (let s = 1; s <= 6; s++) {
      const { x, y } = catmullRom(p0, p1, p2, p3, s / 6)
      c.lineTo(x, y)
    }
    c.stroke()
  }
  c.globalAlpha = 1
}

export function SnakeBackdrop({ className, grid = false }: { className?: string; grid?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrapEl = wrapRef.current
    const canvas = canvasRef.current
    if (!wrapEl || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let rafId = 0
    let lastT = 0
    let paused = false
    let segments: Point[] = []
    let heading = 0
    let food: Point = { x: 0, y: 0 }
    let foodPulse = 0

    function placeFood() {
      const cols = Math.max(4, Math.floor((width - GRID * 2) / GRID))
      const rows = Math.max(4, Math.floor((height - GRID * 2) / GRID))
      food = {
        x: GRID + GRID * (1 + Math.floor(Math.random() * cols)),
        y: GRID + GRID * (1 + Math.floor(Math.random() * rows)),
      }
    }

    function seed() {
      const cx = width / 2
      const cy = height / 2
      heading = Math.random() * Math.PI * 2
      segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
        x: cx - Math.cos(heading) * i * SEGMENT_SPACING,
        y: cy - Math.sin(heading) * i * SEGMENT_SPACING,
      }))
      placeFood()
    }

    function resize() {
      const rect = wrapEl!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (width === 0 || height === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.max(1, Math.floor(width * dpr))
      canvas!.height = Math.max(1, Math.floor(height * dpr))
      canvas!.style.width = width + 'px'
      canvas!.style.height = height + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (segments.length === 0) seed()
      food.x = Math.min(food.x, width - GRID)
      food.y = Math.min(food.y, height - GRID)
    }

    function update(dt: number) {
      const head = segments[0]
      const desired = Math.atan2(food.y - head.y, food.x - head.x)
      let delta = desired - heading
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      const maxTurn = TURN_RATE * dt
      heading += Math.max(-maxTurn, Math.min(maxTurn, delta))

      let nx = head.x + Math.cos(heading) * SPEED * dt
      let ny = head.y + Math.sin(heading) * SPEED * dt

      const pad = 60
      if (nx < -pad) nx = width + pad
      if (nx > width + pad) nx = -pad
      if (ny < -pad) ny = height + pad
      if (ny > height + pad) ny = -pad
      segments[0] = { x: nx, y: ny }

      for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1]
        const cur = segments[i]
        const dx = cur.x - prev.x
        const dy = cur.y - prev.y
        const dist = Math.hypot(dx, dy) || 1
        const f = SEGMENT_SPACING / dist
        segments[i] = { x: prev.x + dx * f, y: prev.y + dy * f }
      }

      if (Math.hypot(nx - food.x, ny - food.y) < FOOD_JUMP_DIST / 2) placeFood()
      foodPulse += dt * 3.2
    }

    function draw() {
      const c = ctx!
      const P = palette()
      c.clearRect(0, 0, width, height)

      const pulse = 1 + Math.sin(foodPulse) * 0.15
      c.save()
      c.shadowColor = P.food
      c.shadowBlur = 18
      c.fillStyle = P.food
      c.beginPath()
      c.arc(food.x, food.y, 3.6 * pulse, 0, Math.PI * 2)
      c.fill()
      c.restore()

      c.save()
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.shadowColor = P.glow
      c.shadowBlur = 22
      c.strokeStyle = P.stroke
      drawSmoothPath(c, segments, 12, 2.2)
      c.restore()

      const head = segments[0]
      c.save()
      c.shadowColor = P.glow
      c.shadowBlur = 18
      c.fillStyle = P.stroke.replace(/[\d.]+\)/, '0.85)')
      c.beginPath()
      c.arc(head.x, head.y, 7, 0, Math.PI * 2)
      c.fill()
      c.restore()

      c.fillStyle = P.eye
      c.beginPath()
      c.arc(
        head.x + Math.cos(heading) * 3.5,
        head.y + Math.sin(heading) * 3.5,
        1.6,
        0,
        Math.PI * 2,
      )
      c.fill()
    }

    function frame(t: number) {
      if (paused) {
        rafId = requestAnimationFrame(frame)
        return
      }
      if (!lastT) lastT = t
      const dt = Math.min(0.05, (t - lastT) / 1000)
      lastT = t
      if (width > 0 && height > 0) {
        update(dt)
        draw()
      }
      rafId = requestAnimationFrame(frame)
    }

    function onVisibility() {
      paused = document.visibilityState !== 'visible'
      if (!paused) lastT = 0
    }

    resize()
    rafId = requestAnimationFrame(frame)
    const ro = new ResizeObserver(resize)
    ro.observe(wrapEl)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {grid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground) / 0.09) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.09) 1px, transparent 1px)',
            backgroundSize: `${GRID}px ${GRID}px`,
          }}
        />
      )}
      <canvas ref={canvasRef} className="block h-full w-full motion-reduce:hidden" />
    </div>
  )
}
