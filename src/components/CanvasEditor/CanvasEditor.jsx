import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { fabric } from 'fabric'
import jsPDF from 'jspdf'
import { buildAllPages } from './pageBuilder'
import './CanvasEditor.css'

// ─── Constants ─────────────────────────────────────────────────────────────────
const CW = 595
const CH = 842
const ML = 22
const CONTENT_W = CW - ML * 2

const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Trebuchet MS', 'Verdana']
const FONT_SIZES = [7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48]

const THEMES = [
  { id: 'navy',   label: 'Navy',    primary: '#112a57', light: '#e8eef7', dark: '#07111e' },
  { id: 'green',  label: 'Forest',  primary: '#16a34a', light: '#dcfce7', dark: '#14532d' },
  { id: 'blue',   label: 'Ocean',   primary: '#2563eb', light: '#dbeafe', dark: '#1e3a8a' },
  { id: 'purple', label: 'Dusk',    primary: '#7c3aed', light: '#ede9fe', dark: '#4c1d95' },
  { id: 'slate',  label: 'Minimal', primary: '#334155', light: '#f1f5f9', dark: '#0f172a' },
]

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:22, g:163, b:74 }
}

function makeThemeFromColor(primary) {
  const { r, g, b } = hexToRgb(primary)
  const light = '#' + [r,g,b].map(v => Math.min(255, Math.round(v + (255-v)*0.85)).toString(16).padStart(2,'0')).join('')
  const dark  = '#' + [r,g,b].map(v => Math.round(v * 0.35).toString(16).padStart(2,'0')).join('')
  return { id: 'custom', label: 'Custom', primary, light, dark }
}

// ─── Theme-aware recoloring ───────────────────────────────────────────────────
// Objects tagged data.tr get recolored on theme change.
// Once a user manually recolors an object, we delete data.tr so it's excluded.

function recolorObj(obj, theme) {
  const role = obj.data?.tr
  if (role) {
    if (role === 'p')  obj.set('fill',   theme.primary)
    if (role === 'l')  obj.set('fill',   theme.light)
    if (role === 'pt') obj.set('fill',   theme.primary)
    if (role === 'ps') obj.set('stroke', theme.primary)
    obj.dirty = true
  }
  if (obj._objects) obj._objects.forEach(c => recolorObj(c, theme))
}

function recolorCanvas(canvas, theme) {
  canvas.getObjects().forEach(o => recolorObj(o, theme))
  canvas.requestRenderAll()
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function fabricColorToHex(c) {
  if (!c || c === 'transparent' || typeof c !== 'string') return '#000000'
  if (c.startsWith('#')) return c.length === 4
    ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3]
    : c.slice(0, 7)
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return '#' + [m[1],m[2],m[3]].map(v => (+v).toString(16).padStart(2,'0')).join('')
  return '#000000'
}

// Apply a user-chosen color to a canvas object and detach it from the theme.
function applyColorToObj(obj, color) {
  if (obj.data) delete obj.data.tr  // detach from theme so recolorCanvas ignores this object
  if (obj.type === 'line') {
    obj.set('stroke', color)
  } else if (obj.fill === 'transparent' && obj.stroke) {
    obj.set('stroke', color)  // border-only rects
  } else {
    obj.set('fill', color)
  }
  obj.dirty = true
}

// ─── Fabric helpers ───────────────────────────────────────────────────────────

function sel(obj) {
  obj.set({ borderColor: '#2563eb', cornerColor: '#2563eb', cornerStyle: 'circle', cornerSize: 9, transparentCorners: false, padding: 2 })
  return obj
}

function tb(text, opts = {}) {
  return sel(new fabric.Textbox(String(text ?? ''), {
    fontFamily: 'Arial', editable: true,
    lockScalingY: false, lockScalingX: false,
    ...opts,
  }))
}

// ─── Object factories (all elements selectable) ───────────────────────────────

function makeSectionBand(badge, title, theme, y) {
  const badgeW = badge.length > 2 ? 30 : 24
  return [
    sel(new fabric.Rect({ left: 0, top: y, width: CW, height: 46, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
    sel(new fabric.Rect({ left: 0, top: y + 43, width: CW, height: 3, fill: 'rgba(255,255,255,0.12)', strokeWidth: 0 })),
    sel(new fabric.Circle({ left: CW - 80, top: y - 60, radius: 130, fill: 'rgba(255,255,255,0.04)', strokeWidth: 0 })),
    sel(new fabric.Rect({ left: ML, top: y + 14, width: badgeW, height: 16, fill: 'rgba(255,255,255,0.18)', rx: 3, ry: 3, strokeWidth: 0 })),
    tb(badge, { left: ML, top: y + 15, width: badgeW, textAlign: 'center', fontSize: 8, fontWeight: 'bold', fill: '#fff' }),
    sel(new fabric.Textbox(title, {
      left: ML + badgeW + 8, top: y + 12, width: CW - ML - badgeW - 18,
      fontSize: 15, fontWeight: 'bold', fill: '#fff', fontFamily: 'Georgia',
      editable: true, data: { type: 'section-title' },
    })),
  ]
}

function makeKpiBox(x, y, w, h, metric, theme) {
  const valStr = String(metric.value ?? '—')
  return [
    sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: '#ffffff', rx: 4, ry: 4, strokeWidth: 0 })),
    sel(new fabric.Rect({ left: x, top: y, width: w, height: 3, fill: theme.primary, rx: 0, ry: 0, strokeWidth: 0, data: { tr: 'p', type: 'kpi-top' } })),
    sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: 'transparent', rx: 4, ry: 4, stroke: '#e2e8f0', strokeWidth: 0.8 })),
    tb(valStr, { left: x + 4, top: y + 9, width: w - 8, textAlign: 'center', fontSize: Math.min(15, Math.max(9, 18 - valStr.length)), fontWeight: 'bold', fill: theme.primary, data: { tr: 'pt', type: 'kpi-value' } }),
    tb(String(metric.unit || ''), { left: x + 4, top: y + 27, width: w - 8, textAlign: 'center', fontSize: 7, fill: '#94a3b8', data: { type: 'kpi-unit' } }),
    tb(metric.label, { left: x + 4, top: y + 36, width: w - 8, textAlign: 'center', fontSize: 7, fontWeight: '600', fill: '#64748b', data: { type: 'kpi-label' } }),
  ]
}

function makeDataRow(x, y, w, label, value, shade) {
  const objs = []
  if (shade) objs.push(sel(new fabric.Rect({ left: x, top: y, width: w, height: 16, fill: '#f8fafc', strokeWidth: 0 })))
  objs.push(tb(label,                { left: x + 6,       top: y + 2, width: w * 0.56,      fontSize: 8.5, fill: '#64748b', data: { type: 'row-label' } }))
  objs.push(tb(String(value || '—'), { left: x + w * 0.56, top: y + 2, width: w * 0.44 - 6, fontSize: 8.5, fontWeight: '600', fill: '#1e293b', textAlign: 'right', data: { type: 'row-value' } }))
  return objs
}

function makeSubtitle(x, y, text, theme) {
  return [
    sel(new fabric.Rect({ left: x, top: y + 1, width: 3, height: 10, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
    tb(text.toUpperCase(), { left: x + 8, top: y, width: CONTENT_W - 8, fontSize: 8, fontWeight: 'bold', fill: theme.primary, charSpacing: 80, data: { tr: 'pt', type: 'subtitle' } }),
  ]
}

function makeFooter(pageNum, company, theme) {
  return [
    sel(new fabric.Rect({ left: 0, top: CH - 22, width: CW, height: 22, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
    tb(company || 'VSME ESG Report', { left: ML, top: CH - 17, width: 220, fontSize: 7, fill: 'rgba(255,255,255,0.7)' }),
    tb(String(pageNum), { left: CW - ML - 30, top: CH - 17, width: 30, textAlign: 'right', fontSize: 7, fontWeight: 'bold', fill: '#fff' }),
  ]
}

// ─── Async page renderer ──────────────────────────────────────────────────────

async function renderPage(canvas, pageSpec, theme, pageNum, companyName) {
  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  let y = 0
  for (const block of pageSpec.blocks) {
    y = await applyBlock(canvas, block, theme, y)
  }
  if (pageSpec.badge) makeFooter(pageNum, companyName, theme).forEach(o => canvas.add(o))
  canvas.renderAll()
}

async function applyBlock(canvas, block, theme, y) {
  switch (block.type) {

    case 'section-band': {
      makeSectionBand(block.badge, block.title, theme, y).forEach(o => canvas.add(o))
      return y + 54
    }

    case 'kpi-row': {
      const metrics = (block.metrics || []).slice(0, 4)
      if (!metrics.length) return y
      const gap = 6, bh = 52
      const bw = (CONTENT_W - gap * (metrics.length - 1)) / metrics.length
      metrics.forEach((m, i) => makeKpiBox(ML + i * (bw + gap), y, bw, bh, m, theme).forEach(o => canvas.add(o)))
      return y + bh + 10
    }

    case 'data-table': {
      const tableRows = block.rows || []
      if (!tableRows.length) return y
      tableRows.forEach((r, i) => { makeDataRow(ML, y, CONTENT_W, r.label, r.value, i % 2 === 0).forEach(o => canvas.add(o)); y += 16 })
      return y + 6
    }

    case 'subtitle': {
      makeSubtitle(ML, y, block.text, theme).forEach(o => canvas.add(o))
      return y + 15
    }

    case 'text-block': {
      const content = (block.content || '').trim()
      if (!content) return y
      const t = tb(content, { left: ML, top: y, width: CONTENT_W, fontSize: 9.5, fill: '#475569', lineHeight: 1.55, data: { type: 'narrative' } })
      canvas.add(t)
      return y + t.getScaledHeight() + 10
    }

    case 'image': {
      if (!block.src) return y
      return new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          const fimg = new fabric.Image(img)
          const scale = Math.min(260 / fimg.width, 180 / fimg.height, 1)
          fimg.set({ left: ML, top: y, scaleX: scale, scaleY: scale, data: { type: 'image-block' } })
          sel(fimg); canvas.add(fimg); canvas.renderAll()
          resolve(y + fimg.getScaledHeight() + 12)
        }
        img.onerror = () => resolve(y)
        img.crossOrigin = 'anonymous'
        img.src = block.src
      })
    }

    case 'spacer': return y + (block.height || 16)
    case 'cover':  return renderCoverBlock(canvas, block.data, theme)
    case 'toc':    return renderTOCBlock(canvas, theme, block.pageMap || {})
    default:       return y
  }
}

// ─── Cover page ───────────────────────────────────────────────────────────────

function renderCoverBlock(canvas, data, theme) {
  const headerH = Math.round(CH * 0.40)
  const cy = headerH + 28

  // ─ Header band
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: headerH, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  // Decorative circles
  canvas.add(sel(new fabric.Circle({ left: CW - 90, top: -70, radius: 170, fill: 'rgba(255,255,255,0.05)', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Circle({ left: -40, top: headerH - 90, radius: 110, fill: 'rgba(255,255,255,0.04)', strokeWidth: 0 })))
  // Subtle shimmer stripe along the bottom of the header
  canvas.add(sel(new fabric.Rect({ left: 0, top: headerH - 4, width: CW, height: 4, fill: 'rgba(255,255,255,0.12)', strokeWidth: 0 })))

  // VSME module tag (pill)
  canvas.add(sel(new fabric.Rect({ left: ML, top: 26, width: 122, height: 16, fill: 'rgba(255,255,255,0.15)', rx: 8, ry: 8, strokeWidth: 0 })))
  canvas.add(tb('VSME  ·  BASIC MODULE', { left: ML, top: 28, width: 122, textAlign: 'center', fontSize: 7, fontWeight: 'bold', fill: '#fff', charSpacing: 100 }))

  // Left accent mark for company name
  canvas.add(sel(new fabric.Rect({ left: ML, top: 56, width: 3, height: 56, fill: 'rgba(255,255,255,0.45)', strokeWidth: 0 })))

  // Company name (large serif)
  canvas.add(tb(data?.companyName || 'Company Name', {
    left: ML + 10, top: 56, width: CW - 140,
    fontSize: 30, fontWeight: 'bold', fill: '#fff', fontFamily: 'Georgia',
    data: { type: 'cover-title' },
  }))

  // Sector · Country
  const coverSub = [data?.sector, data?.country].filter(Boolean).join('  ·  ')
  if (coverSub) canvas.add(tb(coverSub, { left: ML + 10, top: 104, width: CW - 120, fontSize: 11, fill: 'rgba(255,255,255,0.82)', data: { type: 'cover-sub' } }))
  canvas.add(tb(`Sustainability Report  ${data?.reportingYear || new Date().getFullYear()}`, {
    left: ML + 10, top: 122, width: 260, fontSize: 9, fill: 'rgba(255,255,255,0.60)', fontStyle: 'italic',
  }))

  // Logo (top-right)
  if (data?.images?.logoImage) {
    const img = new Image()
    img.onload = () => {
      const fimg = new fabric.Image(img)
      const s = Math.min(76 / fimg.width, 76 / fimg.height, 1)
      fimg.set({ left: CW - 100, top: 20, scaleX: s, scaleY: s, data: { type: 'image-block' } })
      sel(fimg); canvas.add(fimg); canvas.renderAll()
    }
    img.src = data.images.logoImage
  }

  // ─ About section
  canvas.add(sel(new fabric.Rect({ left: ML, top: cy, width: 36, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('About This Report', { left: ML, top: cy + 8, width: 280, fontSize: 14, fontWeight: 'bold', fill: '#0f172a', fontFamily: 'Georgia' }))
  canvas.add(sel(new fabric.Line([ML, cy + 28, CW - ML, cy + 28], { stroke: '#e2e8f0', strokeWidth: 0.6 })))

  const aboutText = `This report has been prepared in accordance with the VSME Basic Module (B1–B11), covering environmental, social and governance disclosures for ${data?.companyName || 'the company'} for reporting year ${data?.reportingYear || ''}.`
  canvas.add(tb(aboutText, { left: ML, top: cy + 36, width: CONTENT_W, fontSize: 9, fill: '#64748b', lineHeight: 1.6, data: { type: 'about-text' } }))

  // ─ Info cards
  const gridY = CH - 104
  const infoItems = [
    ['Company',   data?.companyName],
    ['Employees', data?.employeeCount],
    ['Country',   data?.country],
    ['Currency',  data?.currency],
  ].filter(([, v]) => v)

  const cardW = (CONTENT_W - 3 * 6) / 4
  infoItems.forEach(([lbl, val], i) => {
    const cx = ML + i * (cardW + 6)
    canvas.add(sel(new fabric.Rect({ left: cx, top: gridY, width: cardW, height: 54, fill: '#f8fafc', rx: 4, ry: 4, strokeWidth: 0 })))
    canvas.add(sel(new fabric.Rect({ left: cx, top: gridY, width: cardW, height: 3, fill: theme.primary, rx: 0, ry: 0, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(sel(new fabric.Rect({ left: cx, top: gridY, width: cardW, height: 54, fill: 'transparent', rx: 4, ry: 4, stroke: '#e2e8f0', strokeWidth: 0.6 })))
    canvas.add(tb(lbl.toUpperCase(), { left: cx + 8, top: gridY + 9, width: cardW - 12, fontSize: 6.5, fontWeight: 'bold', fill: '#94a3b8', charSpacing: 60 }))
    canvas.add(tb(String(val || '—'), { left: cx + 8, top: gridY + 19, width: cardW - 12, fontSize: 11, fontWeight: 'bold', fill: '#0f172a', data: { type: 'info-val' } }))
  })

  if (data?.contactName) {
    canvas.add(tb(`Contact: ${data.contactName}${data.contactEmail ? '  ·  ' + data.contactEmail : ''}`, {
      left: ML, top: gridY + 62, width: CONTENT_W, fontSize: 7.5, fill: '#94a3b8',
    }))
  }

  // ─ Footer bar
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH - 22, width: CW, height: 22, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('VSME ESG Report Builder', { left: ML, top: CH - 17, width: 200, fontSize: 7, fill: 'rgba(255,255,255,0.65)' }))
  canvas.add(tb(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }), {
    left: CW - ML - 160, top: CH - 17, width: 160, textAlign: 'right', fontSize: 7, fill: 'rgba(255,255,255,0.65)',
  }))

  return CH
}

// ─── Table of contents ────────────────────────────────────────────────────────

function renderTOCBlock(canvas, theme, pageMap) {
  const SECTIONS = [
    ['B1',  'General Information'],
    ['B2',  'Policies & Commitments'],
    ['B3',  'Energy & GHG Emissions'],
    ['B4',  'Pollution'],
    ['B5',  'Biodiversity'],
    ['B6',  'Water'],
    ['B7',  'Resources & Circular Economy'],
    ['B8',  'Own Workforce'],
    ['B9',  'Health & Safety'],
    ['B10', 'Pay & Training'],
    ['B11', 'Corporate Conduct'],
  ]

  // Accent bar + serif title
  canvas.add(sel(new fabric.Rect({ left: ML, top: 26, width: 4, height: 24, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('Contents', { left: ML + 12, top: 26, width: 200, fontSize: 22, fontWeight: 'bold', fill: '#0f172a', fontFamily: 'Georgia', data: { type: 'toc-title' } }))
  canvas.add(tb('VSME Basic Module  ·  B1 – B11', { left: ML + 12, top: 52, width: 300, fontSize: 9, fill: '#94a3b8' }))
  canvas.add(sel(new fabric.Line([ML, 68, CW - ML, 68], { stroke: '#e2e8f0', strokeWidth: 0.8 })))

  let y = 80
  SECTIONS.forEach(([badge, title], i) => {
    const isEven = i % 2 === 0
    if (isEven) canvas.add(sel(new fabric.Rect({ left: ML, top: y - 2, width: CONTENT_W, height: 22, fill: '#f8fafc', rx: 2, ry: 2, strokeWidth: 0 })))
    const badgeW = badge.length > 2 ? 28 : 22
    canvas.add(sel(new fabric.Rect({ left: ML + 4, top: y + 2, width: badgeW, height: 14, fill: theme.primary, rx: 3, ry: 3, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(tb(badge, { left: ML + 4, top: y + 3, width: badgeW, textAlign: 'center', fontSize: 7.5, fontWeight: 'bold', fill: '#fff' }))
    canvas.add(tb(title, { left: ML + badgeW + 10, top: y + 1, width: CONTENT_W - badgeW - 50, fontSize: 10, fill: '#334155', data: { type: 'toc-entry' } }))
    canvas.add(tb(pageMap[badge] ? String(pageMap[badge]) : '—', { left: CW - ML - 30, top: y + 1, width: 30, textAlign: 'right', fontSize: 10, fontWeight: 'bold', fill: theme.primary, data: { tr: 'pt' } }))
    y += 22
  })
  return CH
}

// ─── Export all pages to PDF ──────────────────────────────────────────────────

async function exportAllPagesToPDF(pages, allStates, theme, companyName, reportingYear) {
  const exportEl = document.createElement('canvas')
  exportEl.width = CW * 2; exportEl.height = CH * 2
  document.body.appendChild(exportEl)
  const offscreen = new fabric.Canvas(exportEl, { width: CW * 2, height: CH * 2, backgroundColor: '#ffffff' })
  offscreen.setZoom(2)
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' })

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()
    await new Promise(resolve => {
      offscreen.clear(); offscreen.backgroundColor = '#ffffff'
      const saved = allStates[i]
      if (saved) {
        offscreen.loadFromJSON(saved, () => { offscreen.setZoom(2); recolorCanvas(offscreen, theme); offscreen.renderAll(); resolve() })
      } else {
        renderPage(offscreen, pages[i], theme, i + 1, companyName).then(resolve)
      }
    })
    await new Promise(r => setTimeout(r, 80))
    doc.addImage(exportEl.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297)
  }

  offscreen.dispose(); document.body.removeChild(exportEl)
  doc.save(`VSME_ESG_${(companyName || 'Report').replace(/\s+/g, '_')}_${reportingYear || ''}.pdf`)
}

// ─── Main Editor Component ────────────────────────────────────────────────────

export default function CanvasEditor({ data, onClose }) {
  const canvasElRefs      = useRef([])
  const fabricInstances   = useRef([])
  const pageContainerRefs = useRef([])
  const historyRef        = useRef({})
  const fileInputRef      = useRef(null)
  const activeIdxRef      = useRef(0)
  const pushHistoryRef    = useRef(null)
  const lastPointerRef    = useRef({})
  const updateSelColorRef = useRef(null)

  const [activeIdx, _setActiveIdx]         = useState(0)
  const [themeId, setThemeId]              = useState('navy')
  const [customColor, setCustomColor]      = useState('#112a57')
  const [hasSelection, setHasSelection]    = useState(false)
  const [selectionColor, setSelectionColor]= useState('#112a57')
  const [selType, setSelType]              = useState(null)   // 'text' | 'image' | 'other' | null
  const [selFont, setSelFont]              = useState('Arial')
  const [selFontSize, setSelFontSize]      = useState(11)
  const [selOpacity, setSelOpacity]        = useState(100)
  const [bgTolerance, setBgTolerance]      = useState(25)
  const [isExporting, setIsExporting]      = useState(false)
  const [canUndo, setCanUndo]              = useState(false)
  const [canRedo, setCanRedo]              = useState(false)
  const [, forceUpdate]                    = useState(0)

  const customTheme = useMemo(() => makeThemeFromColor(customColor), [customColor])
  const THEMES_ALL  = useMemo(() => [...THEMES, customTheme], [customTheme])

  const setActiveIdx = useCallback((i) => {
    activeIdxRef.current = i
    _setActiveIdx(i)
    const h = historyRef.current[i]
    setCanUndo(h ? h.idx > 0 : false)
    setCanRedo(h ? h.idx < h.stack.length - 1 : false)
  }, [])

  const theme = useMemo(() => THEMES_ALL.find(t => t.id === themeId) || THEMES[0], [themeId, THEMES_ALL])
  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

  const pages = useMemo(() => buildAllPages(data), [data])

  const pushHistoryForCanvas = useCallback((idx, canvas) => {
    const h = historyRef.current
    if (!h[idx]) h[idx] = { stack: [], idx: -1 }
    const hist = h[idx]
    const json = canvas.toJSON(['data'])
    hist.stack = hist.stack.slice(0, hist.idx + 1)
    hist.stack.push(json)
    if (hist.stack.length > 40) hist.stack.shift()
    hist.idx = hist.stack.length - 1
    if (activeIdxRef.current === idx) { setCanUndo(hist.idx > 0); setCanRedo(false) }
  }, [])
  pushHistoryRef.current = pushHistoryForCanvas

  // Read all relevant properties of the newly selected object
  const updateSelectionProps = useCallback((obj) => {
    if (!obj) { setSelType(null); return }
    const t = obj.type
    if (t === 'textbox' || t === 'text' || t === 'i-text') {
      setSelType('text')
      setSelFont(obj.fontFamily || 'Arial')
      setSelFontSize(obj.fontSize || 11)
    } else if (t === 'image') {
      setSelType('image')
      setSelOpacity(Math.round((obj.opacity ?? 1) * 100))
    } else {
      setSelType('other')
    }
    const c = (t === 'line' || (obj.fill === 'transparent' && obj.stroke))
      ? obj.stroke : obj.fill
    setSelectionColor(fabricColorToHex(c))
  }, [])
  updateSelColorRef.current = updateSelectionProps

  // ── Initialize all Fabric canvases once ──
  useEffect(() => {
    const instances = new Array(pages.length).fill(null)

    pages.forEach((page, i) => {
      const el = canvasElRefs.current[i]
      if (!el) return

      const canvas = new fabric.Canvas(el, {
        width: CW, height: CH, backgroundColor: '#ffffff',
        preserveObjectStacking: true, stopContextMenu: true,
      })
      instances[i] = canvas

      canvas.on('mouse:down', (e) => {
        const p = canvas.getPointer(e.e)
        lastPointerRef.current[i] = { x: p.x, y: p.y }
        if (activeIdxRef.current !== i) {
          const prev = instances[activeIdxRef.current]
          if (prev) { prev.discardActiveObject(); prev.renderAll() }
          setActiveIdx(i); setHasSelection(false)
        }
      })
      canvas.on('selection:created', (e) => {
        if (activeIdxRef.current === i) { setHasSelection(true); updateSelColorRef.current?.(e.selected?.[0]) }
      })
      canvas.on('selection:updated', (e) => {
        if (activeIdxRef.current === i) updateSelColorRef.current?.(e.selected?.[0] ?? canvas.getActiveObject())
      })
      canvas.on('selection:cleared', () => { if (activeIdxRef.current === i) { setHasSelection(false); setSelType(null) } })
      canvas.on('object:modified', () => { pushHistoryRef.current(i, canvas); forceUpdate(n => n + 1) })
      canvas.on('text:changed',    () => pushHistoryRef.current(i, canvas))
      canvas.on('mouse:dblclick',  (e) => {
        const obj = e.target
        if (obj?.type === 'textbox' && obj.editable !== false) {
          canvas.setActiveObject(obj); obj.enterEditing(); canvas.renderAll()
        }
      })

      renderPage(canvas, page, themeRef.current, i + 1, data.companyName)
        .then(() => {
          if (!historyRef.current[i]) historyRef.current[i] = { stack: [canvas.toJSON(['data'])], idx: 0 }
        })
    })

    fabricInstances.current = instances
    return () => { instances.forEach(c => c?.dispose()); fabricInstances.current = [] }
  }, []) // eslint-disable-line

  // ── Theme change: recolor all canvases in place ──
  useEffect(() => {
    fabricInstances.current.forEach(c => { if (c) recolorCanvas(c, theme) })
  }, [theme]) // eslint-disable-line

  // ── Undo / Redo ──
  const handleUndo = useCallback(() => {
    const idx = activeIdxRef.current; const canvas = fabricInstances.current[idx]; const h = historyRef.current[idx]
    if (!canvas || !h || h.idx <= 0) return
    h.idx--
    canvas.loadFromJSON(h.stack[h.idx], () => { recolorCanvas(canvas, themeRef.current); canvas.renderAll() })
    setCanUndo(h.idx > 0); setCanRedo(true)
  }, [])

  const handleRedo = useCallback(() => {
    const idx = activeIdxRef.current; const canvas = fabricInstances.current[idx]; const h = historyRef.current[idx]
    if (!canvas || !h || h.idx >= h.stack.length - 1) return
    h.idx++
    canvas.loadFromJSON(h.stack[h.idx], () => { recolorCanvas(canvas, themeRef.current); canvas.renderAll() })
    setCanUndo(true); setCanRedo(h.idx < h.stack.length - 1)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); handleUndo() }
        if (e.key === 'y') { e.preventDefault(); handleRedo() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

  // ── Per-element color picker ──
  const applySelectionColor = useCallback((color, pushHist = false) => {
    const idx = activeIdxRef.current
    const canvas = fabricInstances.current[idx]
    if (!canvas) return
    canvas.getActiveObjects().forEach(obj => applyColorToObj(obj, color))
    canvas.renderAll()
    setSelectionColor(color)
    if (pushHist) pushHistoryRef.current(idx, canvas)
  }, [])

  // ── Font family ──
  const applyFontFamily = useCallback((family) => {
    const idx = activeIdxRef.current
    const canvas = fabricInstances.current[idx]
    if (!canvas) return
    canvas.getActiveObjects().forEach(obj => { if ('fontFamily' in obj) obj.set('fontFamily', family) })
    canvas.renderAll()
    setSelFont(family)
    pushHistoryRef.current(idx, canvas)
  }, [])

  // ── Font size ──
  const applyFontSize = useCallback((size) => {
    const idx = activeIdxRef.current
    const canvas = fabricInstances.current[idx]
    if (!canvas) return
    canvas.getActiveObjects().forEach(obj => { if ('fontSize' in obj) obj.set('fontSize', Number(size)) })
    canvas.renderAll()
    setSelFontSize(size)
    pushHistoryRef.current(idx, canvas)
  }, [])

  // ── Image opacity ──
  const applyOpacity = useCallback((pct, pushHist = false) => {
    const idx = activeIdxRef.current
    const canvas = fabricInstances.current[idx]
    if (!canvas) return
    canvas.getActiveObjects().forEach(obj => obj.set('opacity', pct / 100))
    canvas.renderAll()
    setSelOpacity(pct)
    if (pushHist) pushHistoryRef.current(idx, canvas)
  }, [])

  // ── Remove image background (white/near-white → transparent) ──
  const handleRemoveBg = useCallback(() => {
    const idx = activeIdxRef.current
    const canvas = fabricInstances.current[idx]
    if (!canvas) return
    const obj = canvas.getActiveObject()
    if (!obj || obj.type !== 'image') return

    const imgEl = obj.getElement()
    const w = imgEl.naturalWidth || imgEl.width
    const h = imgEl.naturalHeight || imgEl.height
    if (!w || !h) return

    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const ctx = offscreen.getContext('2d')
    ctx.drawImage(imgEl, 0, 0)

    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    // Maximum possible distance from white in RGB space
    const maxDist = Math.sqrt(255 * 255 * 3)
    const threshold = (bgTolerance / 100) * maxDist

    for (let i = 0; i < d.length; i += 4) {
      const dr = 255 - d[i]
      const dg = 255 - d[i + 1]
      const db = 255 - d[i + 2]
      const dist = Math.sqrt(dr * dr + dg * dg + db * db)
      if (dist < threshold) {
        // Smooth the edge: pixels close to threshold get partial transparency
        const fade = dist / threshold
        d[i + 3] = Math.round(d[i + 3] * Math.min(1, fade * 1.5))
      }
    }

    ctx.putImageData(imageData, 0, 0)
    const dataUrl = offscreen.toDataURL('image/png')

    obj.setSrc(dataUrl, () => {
      canvas.renderAll()
      pushHistoryRef.current(idx, canvas)
    })
  }, [bgTolerance])

  // ── Custom brand color ──
  const handleCustomColor = useCallback((color) => {
    setCustomColor(color)
    setThemeId('custom')
  }, [])

  // ── Toolbar: Add Text ──
  const handleAddText = useCallback(() => {
    const idx = activeIdxRef.current; const canvas = fabricInstances.current[idx]
    if (!canvas) return
    const ptr = lastPointerRef.current[idx]
    const x = ptr ? Math.max(0, Math.min(ptr.x, CW - 100)) : ML
    const y = ptr ? Math.max(0, Math.min(ptr.y, CH - 40))  : 200
    const t = tb('Your text here', { left: x, top: y, width: Math.min(CONTENT_W, CW - x), fontSize: 11, fill: '#334155', data: { type: 'user-text' } })
    canvas.add(t); canvas.setActiveObject(t); t.enterEditing(); canvas.renderAll()
    pushHistoryRef.current(idx, canvas)
  }, [])

  // ── Toolbar: Add Image ──
  const handleAddImage = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return
    const idx = activeIdxRef.current; const ptr = lastPointerRef.current[idx]
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const fimg = new fabric.Image(img)
        const scale = Math.min(240 / fimg.width, 180 / fimg.height, 1)
        const x = ptr ? Math.max(0, Math.min(ptr.x, CW - fimg.width  * scale)) : ML
        const y = ptr ? Math.max(0, Math.min(ptr.y, CH - fimg.height * scale)) : 140
        fimg.set({ left: x, top: y, scaleX: scale, scaleY: scale, data: { type: 'image-block' } })
        sel(fimg)
        const canvas = fabricInstances.current[idx]; if (!canvas) return
        canvas.add(fimg); canvas.setActiveObject(fimg); canvas.renderAll()
        pushHistoryRef.current(idx, canvas)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file); e.target.value = ''
  }, [])

  // ── Toolbar: Delete / Z-order ──
  const handleDelete = useCallback(() => {
    const idx = activeIdxRef.current; const canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().filter(o => o.selectable !== false).forEach(o => canvas.remove(o))
    canvas.discardActiveObject(); canvas.renderAll()
    pushHistoryRef.current(idx, canvas)
  }, [])

  const handleBringForward = useCallback(() => {
    const canvas = fabricInstances.current[activeIdxRef.current]; const obj = canvas?.getActiveObject()
    if (obj) { canvas.bringForward(obj); canvas.renderAll(); pushHistoryRef.current(activeIdxRef.current, canvas) }
  }, [])

  const handleSendBackward = useCallback(() => {
    const canvas = fabricInstances.current[activeIdxRef.current]; const obj = canvas?.getActiveObject()
    if (obj) { canvas.sendBackwards(obj); canvas.renderAll(); pushHistoryRef.current(activeIdxRef.current, canvas) }
  }, [])

  // ── Page jump ──
  const handlePageJump = useCallback((idx) => {
    setActiveIdx(idx)
    pageContainerRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [setActiveIdx])

  // ── Export ──
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      await exportAllPagesToPDF(pages, fabricInstances.current.map(c => c?.toJSON(['data'])), themeRef.current, data.companyName, data.reportingYear)
    } finally { setIsExporting(false) }
  }, [pages, data])

  return (
    <div className="canvas-editor">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      {/* ── Toolbar ── */}
      <header className="ce-toolbar">
        <div className="ce-toolbar-left">
          <button className="ce-btn-back" onClick={onClose}>← Back</button>
          <span className="ce-divider" />
          <span className="ce-title">{data.companyName || 'Report'}</span>
        </div>

        <div className="ce-toolbar-center">
          <button className="ce-tool" title="Add text block" onClick={handleAddText}>
            <span className="ce-tool-icon">T</span>
            <span className="ce-tool-label">Text</span>
          </button>
          <button className="ce-tool" title="Add image" onClick={handleAddImage}>
            <span className="ce-tool-icon">🖼</span>
            <span className="ce-tool-label">Image</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool ce-tool--danger" title="Delete selected" onClick={handleDelete} disabled={!hasSelection}>
            <span className="ce-tool-icon">✕</span>
            <span className="ce-tool-label">Delete</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={!canUndo}>
            <span className="ce-tool-icon">↩</span><span className="ce-tool-label">Undo</span>
          </button>
          <button className="ce-tool" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={!canRedo}>
            <span className="ce-tool-icon">↪</span><span className="ce-tool-label">Redo</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool" title="Bring forward" onClick={handleBringForward} disabled={!hasSelection}>
            <span className="ce-tool-icon">↑</span><span className="ce-tool-label">Forward</span>
          </button>
          <button className="ce-tool" title="Send backward" onClick={handleSendBackward} disabled={!hasSelection}>
            <span className="ce-tool-icon">↓</span><span className="ce-tool-label">Back</span>
          </button>
          {hasSelection && (
            <>
              <span className="ce-divider" />
              <label className="ce-tool ce-color-tool" title="Change element colour">
                <span className="ce-tool-icon">
                  <span className="ce-color-swatch" style={{ background: selectionColor }} />
                </span>
                <span className="ce-tool-label">Colour</span>
                <input
                  type="color"
                  value={selectionColor}
                  onInput={e  => applySelectionColor(e.target.value, false)}
                  onChange={e => applySelectionColor(e.target.value, true)}
                  className="ce-color-input-overlay"
                />
              </label>
            </>
          )}
        </div>

        <div className="ce-toolbar-right">
          <div className="ce-themes">
            {THEMES.map(t => (
              <button key={t.id} className={`ce-theme-dot${themeId === t.id ? ' active' : ''}`}
                style={{ '--c': t.primary }} title={t.label} onClick={() => setThemeId(t.id)} />
            ))}
            <label
              className={`ce-theme-dot ce-theme-dot--custom${themeId === 'custom' ? ' active' : ''}`}
              style={{ '--c': customColor }}
              title="Custom brand colour — click to pick"
            >
              <input
                type="color"
                value={customColor}
                onInput={e  => handleCustomColor(e.target.value)}
                onChange={e => handleCustomColor(e.target.value)}
                className="ce-color-input-overlay"
              />
            </label>
          </div>
          <button className="ce-btn-export" style={{ background: theme.primary }}
            onClick={handleExport} disabled={isExporting}>
            {isExporting ? '⏳ Generating…' : '📄 Export PDF'}
          </button>
        </div>
      </header>

      {/* ── Properties bar (text or image selected) ── */}
      {hasSelection && (selType === 'text' || selType === 'image') && (
        <div className="ce-props">
          {selType === 'text' && (
            <>
              <span className="ce-props-label">Font</span>
              <select value={selFont} onChange={e => applyFontFamily(e.target.value)} className="ce-select">
                {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
              <span className="ce-props-label">Size</span>
              <select value={selFontSize} onChange={e => applyFontSize(Number(e.target.value))} className="ce-select ce-select--narrow">
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          )}
          {selType === 'image' && (
            <>
              <span className="ce-props-label">Remove BG tolerance</span>
              <input
                type="range" min="5" max="75" value={bgTolerance}
                onChange={e => setBgTolerance(Number(e.target.value))}
                className="ce-range"
                title="Higher = removes more of the background colour"
              />
              <span className="ce-props-val">{bgTolerance}%</span>
              <button className="ce-props-btn" onClick={handleRemoveBg} title="Make white/light background transparent">
                Remove BG
              </button>
              <span className="ce-divider-v" />
              <span className="ce-props-label">Opacity</span>
              <input
                type="range" min="0" max="100" value={selOpacity}
                onInput={e => applyOpacity(Number(e.target.value))}
                onChange={e => applyOpacity(Number(e.target.value), true)}
                className="ce-range"
              />
              <span className="ce-props-val">{selOpacity}%</span>
            </>
          )}
        </div>
      )}

      <div className="ce-body">
        {/* ── Page jump sidebar ── */}
        <aside className="ce-pages">
          <p className="ce-pages-label">Pages</p>
          <div className="ce-page-list">
            {pages.map((p, i) => (
              <button key={i} className={`ce-page-btn${i === activeIdx ? ' active' : ''}`}
                style={{ '--pc': theme.primary }} onClick={() => handlePageJump(i)}>
                <span className="ce-page-num">{i + 1}</span>
                <span className="ce-page-title">{p.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── All pages scroll area ── */}
        <main className="ce-canvas-area">
          {pages.map((page, i) => (
            <div key={i} ref={el => { pageContainerRefs.current[i] = el }} className="ce-page-block">
              <div className="ce-page-block-label">Page {i + 1} — {page.title}</div>
              <div className={`ce-canvas-wrap${i === activeIdx ? ' active' : ''}`}>
                <canvas ref={el => { canvasElRefs.current[i] = el }} />
              </div>
            </div>
          ))}
          <p className="ce-canvas-hint">
            Click to select · Drag to move · Double-click text to edit · Drag corner handles to resize
          </p>
        </main>
      </div>
    </div>
  )
}
