// Generates demo placeholder images via Canvas API.
// Returns { logoImage, energyImage, workforceImage } as base64 PNG data URLs.

const NAVY  = '#112a57'
const GREEN = '#16a34a'
const SLATE = '#475569'
const WHITE = '#ffffff'

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x,     y,     x + r, y,         r)
  ctx.closePath()
}

function makeLogo() {
  const W = 320, H = 320
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Background
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, W, H)

  // Decorative circle
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath(); ctx.arc(260, 70, 150, 0, Math.PI * 2); ctx.fill()

  // Green accent bar (left edge)
  ctx.fillStyle = GREEN
  ctx.fillRect(36, 96, 6, 110)

  // Monogram "NG"
  ctx.fillStyle = WHITE
  ctx.font = 'bold 96px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('NG', 52, 200)

  // Green accent dot next to second letter
  ctx.fillStyle = GREEN
  ctx.beginPath(); ctx.arc(228, 114, 9, 0, Math.PI * 2); ctx.fill()

  // Company full name
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '14px Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('NordGreen Manufacturing A/S', 52, 232)

  // Tagline
  ctx.fillStyle = GREEN
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText('Sustainability Report  ·  2024', 52, 254)

  // Bottom shimmer line
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(0, H - 6, W, 6)

  return c.toDataURL('image/png')
}

function makeEnergyChart() {
  const W = 540, H = 370
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Background + border
  ctx.fillStyle = WHITE
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

  // Header band
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, W, 52)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.beginPath(); ctx.arc(W - 40, 0, 90, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle = WHITE
  ctx.font = 'bold 14px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Energy & GHG Emissions — 2024', 18, 22)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '10px Arial'
  ctx.fillText('NordGreen Manufacturing A/S', 18, 40)

  // ── Energy consumption bars ──────────────────────────────────
  const energy = [
    { label: 'Total Energy',  value: 4820, color: NAVY,      unit: 'MWh' },
    { label: 'Renewable',     value: 1930, color: GREEN,     unit: 'MWh' },
    { label: 'Non-Renewable', value: 2890, color: '#94a3b8', unit: 'MWh' },
  ]
  const barMaxW = W - 220, barH = 22, barY0 = 70

  energy.forEach((d, i) => {
    const y = barY0 + i * 52
    const bw = (d.value / 5000) * barMaxW

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(d.label, 16, y + barH / 2)

    // Track
    ctx.fillStyle = '#f1f5f9'
    rrect(ctx, 140, y, barMaxW, barH, 4); ctx.fill()

    // Bar
    ctx.fillStyle = d.color
    rrect(ctx, 140, y, Math.max(bw, 8), barH, 4); ctx.fill()

    // Value label
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`${d.value.toLocaleString()} ${d.unit}`, 140 + barMaxW + 10, y + barH / 2)
  })

  // Renewable share pill
  const pillX = 16, pillY = barY0 + 3 * 52 - 14
  ctx.fillStyle = '#dcfce7'
  rrect(ctx, pillX, pillY, 120, 18, 9); ctx.fill()
  ctx.fillStyle = GREEN
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('40.0% Renewable Share', pillX + 60, pillY + 9)

  // ── Divider ──────────────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(16, 230); ctx.lineTo(W - 16, 230); ctx.stroke()

  // ── GHG Emissions bars ───────────────────────────────────────
  ctx.fillStyle = NAVY
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('GHG EMISSIONS  (tCO₂e)', 16, 248)

  const ghg = [
    { label: 'Scope 1', value: 312,  color: '#dc2626' },
    { label: 'Scope 2', value: 487,  color: '#ea580c' },
    { label: 'Scope 3', value: 2140, color: '#d97706' },
  ]
  const ghgMax = 2200, ghgMaxW = W - 180, ghgH = 18

  ghg.forEach((d, i) => {
    const y = 262 + i * 32
    const bw = (d.value / ghgMax) * ghgMaxW

    ctx.fillStyle = SLATE
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(d.label, 16, y + ghgH / 2)

    ctx.fillStyle = '#f1f5f9'
    rrect(ctx, 68, y, ghgMaxW, ghgH, 3); ctx.fill()

    ctx.fillStyle = d.color
    rrect(ctx, 68, y, Math.max(bw, 6), ghgH, 3); ctx.fill()

    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`${d.value.toLocaleString()} tCO₂e`, 68 + ghgMaxW + 8, y + ghgH / 2)
  })

  // Total GHG badge
  ctx.fillStyle = '#fef3c7'
  rrect(ctx, W - 140, 356, 124, 20, 4); ctx.fill()
  ctx.fillStyle = '#92400e'
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Total GHG: 2,939 tCO₂e', W - 140 + 62, 366)

  return c.toDataURL('image/png')
}

function makeWorkforceChart() {
  const W = 460, H = 270
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  ctx.fillStyle = WHITE
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

  // Header
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, W, 44)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath(); ctx.arc(W - 30, 0, 70, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle = WHITE
  ctx.font = 'bold 13px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Workforce Composition — 2024', 16, 22)

  // ── Gender donut (left) ──────────────────────────────────────
  const cx = 110, cy = 156, r = 66, ri = 38
  const male = 163, female = 84, total = 247
  const mAngle = (male / total) * Math.PI * 2
  const start = -Math.PI / 2

  ctx.fillStyle = NAVY
  ctx.beginPath(); ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, r, start, start + mAngle); ctx.closePath(); ctx.fill()

  ctx.fillStyle = '#7c3aed'
  ctx.beginPath(); ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, r, start + mAngle, start + Math.PI * 2); ctx.closePath(); ctx.fill()

  ctx.fillStyle = WHITE
  ctx.beginPath(); ctx.arc(cx, cy, ri, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle = NAVY
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('247', cx, cy - 6)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '9px Arial'
  ctx.fillText('employees', cx, cy + 11)

  // Legend
  const legendY = 234
  ;[
    { color: NAVY,    label: `Male  ${male} (66%)` },
    { color: '#7c3aed', label: `Female  ${female} (34%)` },
  ].forEach((l, i) => {
    const lx = 18 + i * 110
    ctx.fillStyle = l.color
    ctx.fillRect(lx, legendY, 10, 10)
    ctx.fillStyle = SLATE
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(l.label, lx + 14, legendY + 5)
  })

  // ── Right column ─────────────────────────────────────────────
  const bx = 250, bMaxW = 160, bH = 18, bGap = 10

  // Age groups
  ctx.fillStyle = NAVY
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('AGE GROUPS', bx, 62)

  const ageData = [
    { label: '<30',   value: 42,  color: '#22d3ee' },
    { label: '30–50', value: 138, color: NAVY },
    { label: '>50',   value: 67,  color: '#94a3b8' },
  ]
  ageData.forEach((d, i) => {
    const y = 74 + i * (bH + bGap)
    const bw = (d.value / 138) * bMaxW
    ctx.fillStyle = SLATE
    ctx.font = '10px Arial'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(d.label, bx, y + bH / 2)
    ctx.fillStyle = '#f1f5f9'
    rrect(ctx, bx + 40, y, bMaxW, bH, 3); ctx.fill()
    ctx.fillStyle = d.color
    rrect(ctx, bx + 40, y, Math.max(bw, 6), bH, 3); ctx.fill()
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(d.value, bx + 40 + bMaxW + 7, y + bH / 2)
  })

  // Contract type
  ctx.fillStyle = NAVY
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('CONTRACT TYPE', bx, 174)

  const contractData = [
    { label: 'Permanent', value: 218, color: GREEN },
    { label: 'Temporary', value: 29,  color: '#94a3b8' },
  ]
  contractData.forEach((d, i) => {
    const y = 186 + i * (bH + bGap)
    const bw = (d.value / total) * bMaxW
    ctx.fillStyle = SLATE
    ctx.font = '10px Arial'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(d.label, bx, y + bH / 2)
    ctx.fillStyle = '#f1f5f9'
    rrect(ctx, bx + 60, y, bMaxW, bH, 3); ctx.fill()
    ctx.fillStyle = d.color
    rrect(ctx, bx + 60, y, Math.max(bw, 6), bH, 3); ctx.fill()
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(d.value, bx + 60 + bMaxW + 7, y + bH / 2)
  })

  return c.toDataURL('image/png')
}

export function createDemoImages() {
  return {
    logoImage:      makeLogo(),
    energyImage:    makeEnergyChart(),
    workforceImage: makeWorkforceChart(),
  }
}
