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

const THEMES = [
  { id: 'green',  label: 'Forest',  primary: '#16a34a', light: '#dcfce7', dark: '#14532d' },
  { id: 'blue',   label: 'Ocean',   primary: '#2563eb', light: '#dbeafe', dark: '#1e3a8a' },
  { id: 'purple', label: 'Dusk',    primary: '#7c3aed', light: '#ede9fe', dark: '#4c1d95' },
  { id: 'slate',  label: 'Minimal', primary: '#334155', light: '#f1f5f9', dark: '#0f172a' },
]

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
  return [
    sel(new fabric.Rect({ left: 0, top: y, width: CW, height: 40, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
    sel(new fabric.Circle({ left: CW - 55, top: y - 40, radius: 100, fill: 'rgba(255,255,255,0.06)', strokeWidth: 0 })),
    sel(new fabric.Rect({ left: ML, top: y + 10, width: 28, height: 18, fill: 'rgba(255,255,255,0.2)', rx: 4, ry: 4, strokeWidth: 0 })),
    tb(badge, { left: ML, top: y + 10, width: 28, textAlign: 'center', fontSize: 9, fontWeight: 'bold', fill: '#fff' }),
    sel(new fabric.Textbox(title, {
      left: ML + 36, top: y + 10, width: CW - ML - 50,
      fontSize: 14, fontWeight: 'bold', fill: '#fff', fontFamily: 'Arial',
      editable: true, data: { type: 'section-title' },
    })),
  ]
}

function makeKpiBox(x, y, w, h, metric, theme) {
  const valStr = String(metric.value ?? '—')
  return [
    sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: theme.light, rx: 5, ry: 5, strokeWidth: 0, data: { tr: 'l', type: 'kpi-bg' } })),
    sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: 'transparent', rx: 5, ry: 5, stroke: theme.primary, strokeWidth: 0.8, data: { tr: 'ps', type: 'kpi-border' } })),
    sel(new fabric.Rect({ left: x, top: y, width: 3, height: h, fill: theme.primary, strokeWidth: 0, data: { tr: 'p', type: 'kpi-accent' } })),
    tb(valStr, { left: x + 4, top: y + 6, width: w - 8, textAlign: 'center', fontSize: Math.min(16, Math.max(10, 18 - valStr.length)), fontWeight: 'bold', fill: '#0f172a', data: { type: 'kpi-value' } }),
    tb(String(metric.unit || ''), { left: x + 4, top: y + 24, width: w - 8, textAlign: 'center', fontSize: 7, fill: theme.primary, data: { tr: 'pt', type: 'kpi-unit' } }),
    tb(metric.label, { left: x + 4, top: y + 33, width: w - 8, textAlign: 'center', fontSize: 7.5, fill: '#64748b', data: { type: 'kpi-label' } }),
  ]
}

function makeDataRow(x, y, w, label, value, shade) {
  const objs = []
  if (shade) objs.push(sel(new fabric.Rect({ left: x, top: y, width: w, height: 15, fill: '#f8fafc', strokeWidth: 0 })))
  objs.push(tb(label,               { left: x + 4,      top: y + 2, width: w * 0.55,      fontSize: 8, fill: '#64748b',  data: { type: 'row-label' } }))
  objs.push(tb(String(value || '—'),{ left: x + w*0.55, top: y + 2, width: w * 0.45 - 4, fontSize: 8, fontWeight: 'bold', fill: '#1e293b', textAlign: 'right', data: { type: 'row-value' } }))
  return objs
}

function makeSubtitle(x, y, text, theme) {
  return [tb(text.toUpperCase(), { left: x, top: y, width: CONTENT_W, fontSize: 8, fontWeight: 'bold', fill: theme.primary, charSpacing: 80, data: { tr: 'pt', type: 'subtitle' } })]
}

function makeFooter(pageNum, company, theme) {
  return [
    sel(new fabric.Line([ML, CH - 16, CW - ML, CH - 16], { stroke: '#e2e8f0', strokeWidth: 0.5 })),
    tb(company || 'VSME ESG Report', { left: ML, top: CH - 13, width: 200, fontSize: 7, fill: '#94a3b8' }),
    tb(`Page ${pageNum}`, { left: CW - ML - 50, top: CH - 13, width: 50, textAlign: 'right', fontSize: 7, fill: theme.primary, data: { tr: 'pt' } }),
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
      return y + 48
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
  const headerH = CH * 0.40
  const cy = headerH + 18

  // Header band
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: headerH, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(sel(new fabric.Circle({ left: CW - 55, top: -45, radius: 110, fill: 'rgba(255,255,255,0.06)', strokeWidth: 0 })))

  // VSME tag
  canvas.add(sel(new fabric.Rect({ left: ML, top: 22, width: 112, height: 15, fill: 'rgba(255,255,255,0.15)', rx: 7, ry: 7, strokeWidth: 0 })))
  canvas.add(tb('VSME ESG — BASIC MODULE', { left: ML, top: 24, width: 112, textAlign: 'center', fontSize: 7, fontWeight: 'bold', fill: '#fff', charSpacing: 80 }))

  // Company name, sector, year
  canvas.add(tb(data?.companyName || 'Company Name', { left: ML, top: 50, width: CW - 120, fontSize: 28, fontWeight: 'bold', fill: '#fff', data: { type: 'cover-title' } }))
  canvas.add(tb(`${data?.sector || ''}${data?.sector && data?.country ? '  ·  ' : ''}${data?.country || ''}`, { left: ML, top: 92, width: CW - 120, fontSize: 11, fill: 'rgba(255,255,255,0.85)', data: { type: 'cover-sub' } }))
  canvas.add(tb(`Reporting Year ${data?.reportingYear || new Date().getFullYear()}`, { left: ML, top: 110, width: 200, fontSize: 9.5, fill: 'rgba(255,255,255,0.7)' }))

  // Logo
  if (data?.images?.logoImage) {
    const img = new Image()
    img.onload = () => {
      const fimg = new fabric.Image(img)
      const s = Math.min(72 / fimg.width, 72 / fimg.height, 1)
      fimg.set({ left: CW - 100, top: 18, scaleX: s, scaleY: s, data: { type: 'image-block' } })
      sel(fimg); canvas.add(fimg); canvas.renderAll()
    }
    img.src = data.images.logoImage
  }

  // About section
  canvas.add(tb('About This Report', { left: ML, top: cy, width: 220, fontSize: 13, fontWeight: 'bold', fill: '#0f172a' }))
  canvas.add(sel(new fabric.Line([ML, cy + 17, CW - ML, cy + 17], { stroke: theme.primary, strokeWidth: 0.8, data: { tr: 'ps' } })))
  const aboutText = `This report has been prepared in accordance with the VSME Basic Module (B1–B11), covering environmental, social and governance disclosures for ${data?.companyName || 'the company'} for reporting year ${data?.reportingYear || ''}.`
  canvas.add(tb(aboutText, { left: ML, top: cy + 24, width: CONTENT_W, fontSize: 9, fill: '#64748b', lineHeight: 1.5, data: { type: 'about-text' } }))

  // Info grid
  const gridY = CH - 84
  canvas.add(sel(new fabric.Rect({ left: ML, top: gridY, width: CONTENT_W, height: 52, fill: theme.light, rx: 5, ry: 5, strokeWidth: 0, data: { tr: 'l' } })))
  const infoItems = [['Company', data?.companyName], ['Employees', data?.employeeCount], ['Country', data?.country], ['Currency', data?.currency]].filter(([, v]) => v)
  infoItems.forEach(([lbl, val], i) => {
    const cx = ML + 8 + i * (CONTENT_W / 4)
    canvas.add(tb(lbl, { left: cx, top: gridY + 10, width: CONTENT_W / 4 - 6, fontSize: 7, fontWeight: 'bold', fill: theme.primary, data: { tr: 'pt' } }))
    canvas.add(tb(String(val || '—'), { left: cx, top: gridY + 20, width: CONTENT_W / 4 - 6, fontSize: 8.5, fill: '#0f172a', data: { type: 'info-val' } }))
  })
  if (data?.contactName) {
    canvas.add(tb(`Contact: ${data.contactName}${data.contactEmail ? '  ·  ' + data.contactEmail : ''}`, { left: ML + 8, top: gridY + 38, width: CONTENT_W - 8, fontSize: 7.5, fill: '#64748b' }))
  }

  // Footer bar
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH - 18, width: CW, height: 18, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('Generated with VSME ESG Report Builder', { left: ML, top: CH - 14, width: 220, fontSize: 7, fill: '#fff' }))
  canvas.add(tb(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), { left: CW - ML - 180, top: CH - 14, width: 180, textAlign: 'right', fontSize: 7, fill: '#fff' }))

  return CH
}

// ─── Table of contents ────────────────────────────────────────────────────────

function renderTOCBlock(canvas, theme, pageMap) {
  const SECTIONS = [
    ['B1','General Information'],['B2','Policies & Commitments'],
    ['B3','Energy'],['B4','GHG Emissions'],
    ['B5','Water'],['B6','Waste'],
    ['B7','Own Workforce'],['B8','Health & Safety'],
    ['B9','Pay & Benefits'],['B10','Social Matters'],
    ['B11','Governance'],
  ]

  canvas.add(tb('Contents', { left: ML, top: 22, width: 200, fontSize: 20, fontWeight: 'bold', fill: '#0f172a', data: { type: 'toc-title' } }))
  canvas.add(sel(new fabric.Line([ML, 47, CW - ML, 47], { stroke: theme.primary, strokeWidth: 1.5, data: { tr: 'ps' } })))

  let y = 58
  SECTIONS.forEach(([badge, title], i) => {
    if (i % 2 === 0) canvas.add(sel(new fabric.Rect({ left: ML, top: y - 3, width: CONTENT_W, height: 18, fill: '#f8fafc', strokeWidth: 0 })))
    canvas.add(sel(new fabric.Rect({ left: ML, top: y, width: 26, height: 12, fill: theme.primary, rx: 3, ry: 3, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(tb(badge, { left: ML, top: y + 1, width: 26, textAlign: 'center', fontSize: 7, fontWeight: 'bold', fill: '#fff' }))
    canvas.add(tb(title, { left: ML + 34, top: y - 1, width: CONTENT_W - 60, fontSize: 9.5, fill: '#334155', data: { type: 'toc-entry' } }))
    canvas.add(tb(pageMap[badge] ? String(pageMap[badge]) : '—', { left: CW - ML - 30, top: y - 1, width: 30, textAlign: 'right', fontSize: 9, fontWeight: 'bold', fill: theme.primary, data: { tr: 'pt' } }))
    y += 20
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
  const [themeId, setThemeId]              = useState('green')
  const [hasSelection, setHasSelection]    = useState(false)
  const [selectionColor, setSelectionColor]= useState('#16a34a')
  const [isExporting, setIsExporting]      = useState(false)
  const [canUndo, setCanUndo]              = useState(false)
  const [canRedo, setCanRedo]              = useState(false)
  const [, forceUpdate]                    = useState(0)

  const setActiveIdx = useCallback((i) => {
    activeIdxRef.current = i
    _setActiveIdx(i)
    const h = historyRef.current[i]
    setCanUndo(h ? h.idx > 0 : false)
    setCanRedo(h ? h.idx < h.stack.length - 1 : false)
  }, [])

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId])
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

  // Read the current fill/stroke of the selection to show in the color picker
  const updateSelectionColor = useCallback((obj) => {
    if (!obj) return
    const c = (obj.type === 'line' || (obj.fill === 'transparent' && obj.stroke))
      ? obj.stroke : obj.fill
    setSelectionColor(fabricColorToHex(c))
  }, [])
  updateSelColorRef.current = updateSelectionColor

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
      canvas.on('selection:cleared', () => { if (activeIdxRef.current === i) setHasSelection(false) })
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
          </div>
          <button className="ce-btn-export" style={{ background: theme.primary }}
            onClick={handleExport} disabled={isExporting}>
            {isExporting ? '⏳ Generating…' : '📄 Export PDF'}
          </button>
        </div>
      </header>

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
