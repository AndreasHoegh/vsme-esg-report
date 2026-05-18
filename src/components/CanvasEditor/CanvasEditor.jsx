import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { fabric } from 'fabric'
import jsPDF from 'jspdf'
import { buildAllPages } from './pageBuilder'
import './CanvasEditor.css'

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

const REPORT_STYLES = [
  { id: 'modern',  label: 'Modern'  },
  { id: 'bold',    label: 'Bold'    },
  { id: 'minimal', label: 'Minimal' },
  { id: 'dark',    label: 'Dark'    },
]

const FONT_PAIRS = [
  { id: 'editorial', label: 'Editorial', heading: 'Georgia',         body: 'Arial'   },
  { id: 'corporate', label: 'Corporate', heading: 'Arial',           body: 'Arial'   },
  { id: 'humanist',  label: 'Humanist',  heading: 'Trebuchet MS',    body: 'Verdana' },
  { id: 'classic',   label: 'Classic',   heading: 'Times New Roman', body: 'Georgia' },
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

function recolorObj(obj, theme) {
  const role = obj.data?.tr
  if (role) {
    if (role === 'p')  obj.set('fill',   theme.primary)
    if (role === 'l')  obj.set('fill',   theme.light)
    if (role === 'd')  obj.set('fill',   theme.dark)
    if (role === 'pt') obj.set('fill',   theme.primary)
    if (role === 'dt') obj.set('fill',   theme.dark)
    if (role === 'ps') obj.set('stroke', theme.primary)
    obj.dirty = true
  }
  if (obj._objects) obj._objects.forEach(c => recolorObj(c, theme))
}
function recolorCanvas(canvas, theme) {
  canvas.getObjects().forEach(o => recolorObj(o, theme))
  canvas.requestRenderAll()
}

function fabricColorToHex(c) {
  if (!c || c === 'transparent' || typeof c !== 'string') return '#000000'
  if (c.startsWith('#')) return c.length === 4 ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c.slice(0, 7)
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return '#' + [m[1],m[2],m[3]].map(v => (+v).toString(16).padStart(2,'0')).join('')
  return '#000000'
}
function applyColorToObj(obj, color) {
  if (obj.data) delete obj.data.tr
  if (obj.type === 'line') obj.set('stroke', color)
  else if (obj.fill === 'transparent' && obj.stroke) obj.set('stroke', color)
  else obj.set('fill', color)
  obj.dirty = true
}

function sel(obj) {
  obj.set({ borderColor: '#2563eb', cornerColor: '#2563eb', cornerStyle: 'circle', cornerSize: 9, transparentCorners: false, padding: 2 })
  return obj
}
function tb(text, opts = {}) {
  return sel(new fabric.Textbox(String(text ?? ''), { fontFamily: 'Arial', editable: true, lockScalingY: false, lockScalingX: false, ...opts }))
}

// ─── Style-aware section band ────────────────────────────────────────────────

function makeSectionBand(badge, title, config, y) {
  const { theme, fontPair, reportStyle } = config
  const H = 50
  const bw = badge.length > 2 ? 30 : 24

  if (reportStyle === 'bold') {
    return [
      sel(new fabric.Rect({ left: 0, top: y, width: CW, height: H, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
      sel(new fabric.Circle({ left: CW - 55, top: y - 70, radius: 140, fill: 'rgba(255,255,255,0.055)', strokeWidth: 0 })),
      sel(new fabric.Circle({ left: -10, top: y + H - 18, radius: 36, fill: 'rgba(255,255,255,0.045)', strokeWidth: 0 })),
      sel(new fabric.Rect({ left: 0, top: y + H - 3, width: CW, height: 3, fill: 'rgba(255,255,255,0.13)', strokeWidth: 0 })),
      sel(new fabric.Rect({ left: ML, top: y + 16, width: bw, height: 18, fill: 'rgba(255,255,255,0.22)', rx: 4, ry: 4, strokeWidth: 0 })),
      tb(badge, { left: ML, top: y + 17.5, width: bw, textAlign: 'center', fontSize: 8.5, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.body }),
      tb(title, { left: ML + bw + 10, top: y + 13, width: CW - ML - bw - 20, fontSize: 16, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.heading, editable: true, data: { type: 'section-title' } }),
    ]
  }

  if (reportStyle === 'minimal') {
    return [
      sel(new fabric.Rect({ left: 0, top: y, width: CW, height: H, fill: '#ffffff', strokeWidth: 0 })),
      sel(new fabric.Rect({ left: 0, top: y, width: 4, height: H, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
      sel(new fabric.Rect({ left: ML, top: y + 15, width: bw, height: 16, fill: theme.primary, rx: 4, ry: 4, strokeWidth: 0, data: { tr: 'p' } })),
      tb(badge, { left: ML, top: y + 17, width: bw, textAlign: 'center', fontSize: 8, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.body }),
      tb(title, { left: ML + bw + 10, top: y + 15, width: CW - ML - bw - 24, fontSize: 15, fontWeight: '600', fill: '#1e293b', fontFamily: fontPair.heading, editable: true, data: { type: 'section-title' } }),
      sel(new fabric.Line([0, y + H, CW, y + H], { stroke: '#e2e8f0', strokeWidth: 0.6 })),
    ]
  }

  if (reportStyle === 'dark') {
    return [
      sel(new fabric.Rect({ left: 0, top: y, width: CW, height: H, fill: theme.dark, strokeWidth: 0, data: { tr: 'd' } })),
      sel(new fabric.Circle({ left: CW - 30, top: y - 30, radius: 80, fill: 'rgba(255,255,255,0.04)', strokeWidth: 0 })),
      sel(new fabric.Rect({ left: 0, top: y + H - 3, width: CW, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
      sel(new fabric.Rect({ left: ML, top: y + 15, width: bw, height: 18, fill: theme.primary, rx: 3, ry: 3, strokeWidth: 0, data: { tr: 'p' } })),
      tb(badge, { left: ML, top: y + 16.5, width: bw, textAlign: 'center', fontSize: 9, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.body }),
      tb(title, { left: ML + bw + 10, top: y + 13, width: CW - ML - bw - 20, fontSize: 15, fontWeight: '600', fill: '#ffffff', fontFamily: fontPair.heading, editable: true, data: { type: 'section-title' } }),
    ]
  }

  // modern (default) — split panel
  const leftW = 72
  return [
    sel(new fabric.Rect({ left: 0, top: y, width: leftW, height: H, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
    sel(new fabric.Rect({ left: leftW, top: y, width: CW - leftW, height: H, fill: theme.light, strokeWidth: 0, data: { tr: 'l' } })),
    sel(new fabric.Circle({ left: leftW - 18, top: y + H / 2 - 18, radius: 30, fill: 'rgba(255,255,255,0.07)', strokeWidth: 0 })),
    tb(badge, { left: 0, top: y + (badge.length > 2 ? 18 : 16), width: leftW, textAlign: 'center', fontSize: badge.length > 2 ? 11 : 13, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.heading }),
    tb(title, { left: leftW + 14, top: y + 15, width: CW - leftW - 24, fontSize: 15, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, editable: true, data: { tr: 'pt', type: 'section-title' } }),
    sel(new fabric.Line([0, y + H, CW, y + H], { stroke: theme.primary, strokeWidth: 0.4, opacity: 0.25, data: { tr: 'ps' } })),
  ]
}

// ─── Style-aware KPI box ─────────────────────────────────────────────────────

function makeKpiBox(x, y, w, h, metric, config) {
  const { theme, fontPair, reportStyle } = config
  const valStr = String(metric.value ?? '—')
  const vfs = Math.min(20, Math.max(10, Math.round(22 - valStr.length * 1.2)))

  if (reportStyle === 'bold') {
    return [
      sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: theme.primary, rx: 6, ry: 6, strokeWidth: 0, data: { tr: 'p' } })),
      tb(valStr, { left: x+4, top: y+10, width: w-8, textAlign: 'center', fontSize: vfs, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }),
      tb(String(metric.unit||''), { left: x+4, top: y+38, width: w-8, textAlign: 'center', fontSize: 7, fill: 'rgba(255,255,255,0.65)' }),
      tb(metric.label, { left: x+4, top: y+48, width: w-8, textAlign: 'center', fontSize: 7, fontWeight: '600', fill: 'rgba(255,255,255,0.82)' }),
    ]
  }

  if (reportStyle === 'minimal') {
    return [
      sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: '#ffffff', rx: 6, ry: 6, stroke: theme.primary, strokeWidth: 1, data: { tr: 'ps' } })),
      tb(valStr, { left: x+4, top: y+10, width: w-8, textAlign: 'center', fontSize: vfs, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, data: { tr: 'pt' } }),
      tb(String(metric.unit||''), { left: x+4, top: y+38, width: w-8, textAlign: 'center', fontSize: 7, fill: '#94a3b8' }),
      tb(metric.label, { left: x+4, top: y+48, width: w-8, textAlign: 'center', fontSize: 7, fontWeight: '600', fill: '#64748b' }),
    ]
  }

  if (reportStyle === 'dark') {
    return [
      sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: theme.dark, rx: 6, ry: 6, strokeWidth: 0, data: { tr: 'd' } })),
      sel(new fabric.Rect({ left: x, top: y+h-3, width: w, height: 3, fill: theme.primary, rx: 0, strokeWidth: 0, data: { tr: 'p' } })),
      tb(valStr, { left: x+4, top: y+10, width: w-8, textAlign: 'center', fontSize: vfs, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }),
      tb(String(metric.unit||''), { left: x+4, top: y+38, width: w-8, textAlign: 'center', fontSize: 7, fill: 'rgba(255,255,255,0.5)' }),
      tb(metric.label, { left: x+4, top: y+48, width: w-8, textAlign: 'center', fontSize: 7, fontWeight: '600', fill: 'rgba(255,255,255,0.7)' }),
    ]
  }

  // modern (default) — light bg, top accent
  return [
    sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: theme.light, rx: 6, ry: 6, strokeWidth: 0, data: { tr: 'l' } })),
    sel(new fabric.Rect({ left: x, top: y, width: w, height: 3, fill: theme.primary, rx: 0, strokeWidth: 0, data: { tr: 'p' } })),
    sel(new fabric.Rect({ left: x, top: y, width: w, height: h, fill: 'transparent', rx: 6, ry: 6, stroke: theme.primary, strokeWidth: 0.5, opacity: 0.2, data: { tr: 'ps' } })),
    tb(valStr, { left: x+4, top: y+10, width: w-8, textAlign: 'center', fontSize: vfs, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, data: { tr: 'pt' } }),
    tb(String(metric.unit||''), { left: x+4, top: y+38, width: w-8, textAlign: 'center', fontSize: 7, fill: '#94a3b8' }),
    tb(metric.label, { left: x+4, top: y+48, width: w-8, textAlign: 'center', fontSize: 7, fontWeight: '600', fill: '#64748b' }),
  ]
}

function makeDataRow(x, y, w, label, value, shade) {
  const H = 18, objs = []
  if (shade) objs.push(sel(new fabric.Rect({ left: x, top: y, width: w, height: H, fill: '#f8fafc', strokeWidth: 0 })))
  objs.push(sel(new fabric.Line([x, y+H, x+w, y+H], { stroke: '#edf0f4', strokeWidth: 0.6 })))
  objs.push(tb(label,                { left: x+8,       top: y+4, width: w*0.55,      fontSize: 8.5, fill: '#64748b' }))
  objs.push(tb(String(value || '—'), { left: x+w*0.55,  top: y+4, width: w*0.45-8,   fontSize: 8.5, fontWeight: '600', fill: '#1e293b', textAlign: 'right' }))
  return objs
}

// ─── Style-aware subtitle ────────────────────────────────────────────────────

function makeSubtitle(x, y, text, config) {
  const { theme, fontPair, reportStyle } = config

  if (reportStyle === 'bold') {
    return [
      sel(new fabric.Rect({ left: 0, top: y, width: CW, height: 22, fill: theme.light, strokeWidth: 0, data: { tr: 'l' } })),
      sel(new fabric.Rect({ left: 0, top: y, width: 5, height: 22, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
      tb(text.toUpperCase(), { left: x+10, top: y+4, width: CONTENT_W-10, fontSize: 8.5, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, charSpacing: 80, data: { tr: 'pt' } }),
    ]
  }

  if (reportStyle === 'minimal') {
    return [
      tb(text.toUpperCase(), { left: x, top: y+2, width: CONTENT_W, fontSize: 8, fontWeight: 'bold', fill: '#94a3b8', fontFamily: fontPair.body, charSpacing: 100 }),
      sel(new fabric.Line([x, y+17, x+CONTENT_W, y+17], { stroke: '#e2e8f0', strokeWidth: 0.6 })),
    ]
  }

  if (reportStyle === 'dark') {
    return [
      sel(new fabric.Rect({ left: x, top: y, width: 4, height: 14, fill: theme.dark, rx: 2, ry: 2, strokeWidth: 0, data: { tr: 'd' } })),
      tb(text.toUpperCase(), { left: x+10, top: y+1, width: CONTENT_W-10, fontSize: 8.5, fontWeight: 'bold', fill: theme.dark, fontFamily: fontPair.heading, charSpacing: 80, data: { tr: 'dt' } }),
      sel(new fabric.Line([x+10, y+17, x+CONTENT_W, y+17], { stroke: '#e2e8f0', strokeWidth: 0.5 })),
    ]
  }

  // modern
  return [
    sel(new fabric.Rect({ left: x, top: y, width: 4, height: 14, fill: theme.primary, rx: 2, ry: 2, strokeWidth: 0, data: { tr: 'p' } })),
    tb(text.toUpperCase(), { left: x+10, top: y+1, width: CONTENT_W-10, fontSize: 8.5, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, charSpacing: 80, data: { tr: 'pt' } }),
    sel(new fabric.Line([x+10, y+17, x+CONTENT_W, y+17], { stroke: theme.primary, strokeWidth: 0.4, opacity: 0.22, data: { tr: 'ps' } })),
  ]
}

// ─── Style-aware footer ──────────────────────────────────────────────────────

function makeFooter(pageNum, company, config) {
  const { theme, fontPair, reportStyle } = config

  if (reportStyle === 'minimal') {
    return [
      sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 22, fill: theme.light, strokeWidth: 0, data: { tr: 'l' } })),
      sel(new fabric.Line([0, CH-22, CW, CH-22], { stroke: theme.primary, strokeWidth: 0.5, data: { tr: 'ps' } })),
      tb(company || 'VSME ESG Report', { left: ML, top: CH-17, width: 260, fontSize: 7, fill: theme.primary, fontFamily: fontPair.body, data: { tr: 'pt' } }),
      tb(String(pageNum), { left: CW-ML-30, top: CH-17, width: 30, textAlign: 'right', fontSize: 7, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.body, data: { tr: 'pt' } }),
    ]
  }

  if (reportStyle === 'dark') {
    return [
      sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 22, fill: theme.dark, strokeWidth: 0, data: { tr: 'd' } })),
      sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 2, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
      tb(company || 'VSME ESG Report', { left: ML, top: CH-17, width: 260, fontSize: 7, fill: 'rgba(255,255,255,0.6)', fontFamily: fontPair.body }),
      tb(String(pageNum), { left: CW-ML-30, top: CH-17, width: 30, textAlign: 'right', fontSize: 7, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.body }),
    ]
  }

  // modern & bold
  return [
    sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 22, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })),
    sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 1.5, fill: 'rgba(255,255,255,0.15)', strokeWidth: 0 })),
    tb(company || 'VSME ESG Report', { left: ML, top: CH-17, width: 260, fontSize: 7, fill: 'rgba(255,255,255,0.72)', fontFamily: fontPair.body }),
    tb(String(pageNum), { left: CW-ML-30, top: CH-17, width: 30, textAlign: 'right', fontSize: 7, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.body }),
  ]
}

// ─── Page renderer ───────────────────────────────────────────────────────────

async function renderPage(canvas, pageSpec, config, pageNum, companyName) {
  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  let y = 0
  for (const block of pageSpec.blocks) y = await applyBlock(canvas, block, config, y)
  if (pageSpec.badge) makeFooter(pageNum, companyName, config).forEach(o => canvas.add(o))
  canvas.renderAll()
}

async function applyBlock(canvas, block, config, y) {
  const { theme } = config
  switch (block.type) {
    case 'section-band':
      makeSectionBand(block.badge, block.title, config, y).forEach(o => canvas.add(o))
      return y + 58

    case 'kpi-row': {
      const metrics = (block.metrics || []).slice(0, 4)
      if (!metrics.length) return y
      const gap = 6, bh = 64
      const bw = (CONTENT_W - gap * (metrics.length - 1)) / metrics.length
      metrics.forEach((m, i) => makeKpiBox(ML + i*(bw+gap), y, bw, bh, m, config).forEach(o => canvas.add(o)))
      return y + bh + 12
    }

    case 'data-table': {
      const rows = block.rows || []
      if (!rows.length) return y
      rows.forEach((r, i) => { makeDataRow(ML, y, CONTENT_W, r.label, r.value, i%2===0).forEach(o => canvas.add(o)); y += 18 })
      return y + 6
    }

    case 'policy-matrix': {
      const rows = block.rows || []
      if (!rows.length) return y
      rows.forEach(row => {
        const isYes = row.status === 'yes'
        const isIP  = row.status === 'in_progress' || row.status === 'in-progress'
        const bg  = isYes ? '#f0fdf4' : isIP ? '#fffbeb' : '#f8fafc'
        const ac  = isYes ? '#16a34a' : isIP ? '#d97706' : '#94a3b8'
        canvas.add(sel(new fabric.Rect({ left: ML, top: y, width: CONTENT_W, height: 22, fill: bg, strokeWidth: 0 })))
        canvas.add(sel(new fabric.Rect({ left: ML, top: y, width: 3, height: 22, fill: ac, strokeWidth: 0 })))
        canvas.add(sel(new fabric.Line([ML, y+22, ML+CONTENT_W, y+22], { stroke: '#e8ecf0', strokeWidth: 0.5 })))
        canvas.add(tb(row.label, { left: ML+9, top: y+6, width: CONTENT_W*0.42, fontSize: 8.5, fill: '#334155' }))
        const st  = isYes ? 'YES' : isIP ? 'IN PROGRESS' : row.status ? row.status.toUpperCase() : 'NO'
        const sw  = st === 'IN PROGRESS' ? 58 : 30
        const sx  = ML + CONTENT_W*0.42 + 4
        canvas.add(sel(new fabric.Rect({ left: sx, top: y+5, width: sw, height: 12, fill: ac, rx: 6, ry: 6, strokeWidth: 0 })))
        canvas.add(tb(st, { left: sx, top: y+5.5, width: sw, textAlign: 'center', fontSize: 6, fontWeight: 'bold', fill: '#fff' }))
        let bx = sx + sw + 5
        if (row.isPublic) {
          canvas.add(sel(new fabric.Rect({ left: bx, top: y+5, width: 38, height: 12, fill: '#2563eb', rx: 6, ry: 6, strokeWidth: 0 })))
          canvas.add(tb('PUBLIC', { left: bx, top: y+5.5, width: 38, textAlign: 'center', fontSize: 6, fontWeight: 'bold', fill: '#fff' }))
          bx += 43
        }
        if (row.hasTargets) {
          canvas.add(sel(new fabric.Rect({ left: bx, top: y+5, width: 42, height: 12, fill: '#7c3aed', rx: 6, ry: 6, strokeWidth: 0 })))
          canvas.add(tb('TARGETS', { left: bx, top: y+5.5, width: 42, textAlign: 'center', fontSize: 6, fontWeight: 'bold', fill: '#fff' }))
        }
        y += 22
      })
      return y + 6
    }

    case 'subtitle':
      makeSubtitle(ML, y, block.text, config).forEach(o => canvas.add(o))
      return y + 22

    case 'text-block': {
      const content = (block.content || '').trim()
      if (!content) return y
      const t = tb(content, { left: ML+12, top: y+2, width: CONTENT_W-12, fontSize: 9.5, fill: '#334155', lineHeight: 1.65 })
      const h = t.getScaledHeight()
      canvas.add(sel(new fabric.Rect({ left: ML, top: y+2, width: 3, height: h, fill: theme.light, rx: 1, ry: 1, strokeWidth: 0, data: { tr: 'l' } })))
      canvas.add(t)
      return y + h + 14
    }

    case 'image':
      if (!block.src) return y
      return new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          const fimg = new fabric.Image(img)
          const scale = Math.min(260/fimg.width, 180/fimg.height, 1)
          fimg.set({ left: ML, top: y, scaleX: scale, scaleY: scale, data: { type: 'image-block' } })
          sel(fimg); canvas.add(fimg); canvas.renderAll()
          resolve(y + fimg.getScaledHeight() + 12)
        }
        img.onerror = () => resolve(y)
        img.crossOrigin = 'anonymous'
        img.src = block.src
      })

    case 'spacer': return y + (block.height || 16)
    case 'cover':  return renderCoverBlock(canvas, block.data, config)
    case 'toc':    return renderTOCBlock(canvas, config, block.pageMap || {})
    default:       return y
  }
}

// ─── Cover pages ─────────────────────────────────────────────────────────────

function loadLogoAsync(canvas, src, x, y, maxW, maxH) {
  const img = new Image()
  img.onload = () => {
    const fimg = new fabric.Image(img)
    const s = Math.min(maxW/fimg.width, maxH/fimg.height, 1)
    fimg.set({ left: x, top: y, scaleX: s, scaleY: s, data: { type: 'image-block' } })
    sel(fimg); canvas.add(fimg); canvas.renderAll()
  }
  img.src = src
}

function renderCoverBlock(canvas, data, config) {
  const { reportStyle } = config
  if (reportStyle === 'bold')    return renderCoverBold(canvas, data, config)
  if (reportStyle === 'minimal') return renderCoverMinimal(canvas, data, config)
  if (reportStyle === 'dark')    return renderCoverDark(canvas, data, config)
  return renderCoverModern(canvas, data, config)
}

function _coverInfoCards(canvas, data, config, gridY) {
  const { theme, fontPair } = config
  const items = [['Company', data?.companyName],['Employees', data?.employeeCount],['Country', data?.country],['Currency', data?.currency]].filter(([,v])=>v)
  const cardW = (CONTENT_W - 3*6) / 4
  items.forEach(([lbl, val], i) => {
    const cx = ML + i*(cardW+6)
    canvas.add(sel(new fabric.Rect({ left: cx, top: gridY, width: cardW, height: 54, fill: theme.light, rx: 4, ry: 4, strokeWidth: 0, data: { tr: 'l' } })))
    canvas.add(sel(new fabric.Rect({ left: cx, top: gridY, width: cardW, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(tb(lbl.toUpperCase(), { left: cx+8, top: gridY+9, width: cardW-12, fontSize: 6.5, fontWeight: 'bold', fill: '#94a3b8', charSpacing: 60, fontFamily: fontPair.body }))
    canvas.add(tb(String(val||'—'), { left: cx+8, top: gridY+19, width: cardW-12, fontSize: 11, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, data: { tr: 'pt' } }))
  })
  if (data?.contactName) canvas.add(tb(`Contact: ${data.contactName}${data.contactEmail ? '  ·  '+data.contactEmail : ''}`, { left: ML, top: gridY+62, width: CONTENT_W, fontSize: 7.5, fill: '#94a3b8', fontFamily: fontPair.body }))
}

function renderCoverModern(canvas, data, config) {
  const { theme, fontPair } = config
  const hH = Math.round(CH*0.40), cy = hH + 28
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: hH, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(sel(new fabric.Circle({ left: CW-90, top: -70, radius: 170, fill: 'rgba(255,255,255,0.05)', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Circle({ left: -40, top: hH-90, radius: 110, fill: 'rgba(255,255,255,0.04)', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Rect({ left: 0, top: hH-4, width: CW, height: 4, fill: 'rgba(255,255,255,0.12)', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Rect({ left: ML, top: 26, width: 122, height: 16, fill: 'rgba(255,255,255,0.15)', rx: 8, ry: 8, strokeWidth: 0 })))
  canvas.add(tb('VSME  ·  BASIC MODULE', { left: ML, top: 28, width: 122, textAlign: 'center', fontSize: 7, fontWeight: 'bold', fill: '#fff', charSpacing: 100 }))
  canvas.add(sel(new fabric.Rect({ left: ML, top: 56, width: 3, height: 56, fill: 'rgba(255,255,255,0.45)', strokeWidth: 0 })))
  canvas.add(tb(data?.companyName||'Company Name', { left: ML+10, top: 56, width: CW-140, fontSize: 30, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.heading }))
  const sub = [data?.sector, data?.country].filter(Boolean).join('  ·  ')
  if (sub) canvas.add(tb(sub, { left: ML+10, top: 104, width: CW-120, fontSize: 11, fill: 'rgba(255,255,255,0.82)', fontFamily: fontPair.body }))
  canvas.add(tb(`Sustainability Report  ${data?.reportingYear||new Date().getFullYear()}`, { left: ML+10, top: 122, width: 260, fontSize: 9, fill: 'rgba(255,255,255,0.60)', fontStyle: 'italic', fontFamily: fontPair.body }))
  if (data?.images?.logoImage) loadLogoAsync(canvas, data.images.logoImage, CW-100, 20, 76, 76)
  canvas.add(sel(new fabric.Rect({ left: ML, top: cy, width: 36, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('About This Report', { left: ML, top: cy+8, width: 280, fontSize: 14, fontWeight: 'bold', fill: '#0f172a', fontFamily: fontPair.heading }))
  canvas.add(sel(new fabric.Line([ML, cy+28, CW-ML, cy+28], { stroke: '#e2e8f0', strokeWidth: 0.6 })))
  canvas.add(tb(`This report has been prepared in accordance with the VSME Basic Module (B1–B11), covering environmental, social and governance disclosures for ${data?.companyName||'the company'} for reporting year ${data?.reportingYear||''}.`, { left: ML, top: cy+36, width: CONTENT_W, fontSize: 9, fill: '#64748b', lineHeight: 1.6, fontFamily: fontPair.body }))
  _coverInfoCards(canvas, data, config, CH-104)
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 22, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('VSME ESG Report Builder', { left: ML, top: CH-17, width: 200, fontSize: 7, fill: 'rgba(255,255,255,0.65)', fontFamily: fontPair.body }))
  canvas.add(tb(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }), { left: CW-ML-160, top: CH-17, width: 160, textAlign: 'right', fontSize: 7, fill: 'rgba(255,255,255,0.65)', fontFamily: fontPair.body }))
  return CH
}

function renderCoverBold(canvas, data, config) {
  const { theme, fontPair } = config
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: CH, fill: theme.dark, strokeWidth: 0, data: { tr: 'd' } })))
  canvas.add(sel(new fabric.Circle({ left: CW-120, top: -80, radius: 220, fill: theme.primary, opacity: 0.15, strokeWidth: 0 })))
  canvas.add(sel(new fabric.Circle({ left: -80, top: CH-200, radius: 160, fill: theme.primary, opacity: 0.1, strokeWidth: 0 })))
  if (data?.reportingYear) canvas.add(tb(String(data.reportingYear), { left: 60, top: 260, width: 480, textAlign: 'center', fontSize: 200, fontWeight: 'bold', fill: 'rgba(255,255,255,0.04)', fontFamily: fontPair.heading }))
  canvas.add(sel(new fabric.Rect({ left: ML, top: 32, width: 110, height: 16, fill: 'rgba(255,255,255,0.12)', rx: 8, ry: 8, strokeWidth: 0 })))
  canvas.add(tb('VSME BASIC MODULE', { left: ML, top: 34, width: 110, textAlign: 'center', fontSize: 7, fontWeight: 'bold', fill: 'rgba(255,255,255,0.7)', charSpacing: 80, fontFamily: fontPair.body }))
  canvas.add(tb(data?.companyName||'Company Name', { left: ML, top: 200, width: CW-ML*2, fontSize: 38, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }))
  canvas.add(sel(new fabric.Rect({ left: ML, top: 310, width: 52, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  const sub = [data?.sector, data?.country].filter(Boolean).join('  ·  ')
  if (sub) canvas.add(tb(sub, { left: ML, top: 322, width: CW-ML*2, fontSize: 12, fill: 'rgba(255,255,255,0.55)', fontFamily: fontPair.body }))
  canvas.add(tb(`Sustainability Report  ${data?.reportingYear||new Date().getFullYear()}`, { left: ML, top: 342, width: CW-ML*2, fontSize: 10, fill: 'rgba(255,255,255,0.40)', fontStyle: 'italic', fontFamily: fontPair.body }))
  if (data?.images?.logoImage) loadLogoAsync(canvas, data.images.logoImage, CW-110, 24, 88, 88)
  const pY = CH-170
  canvas.add(sel(new fabric.Rect({ left: 0, top: pY, width: CW, height: 170, fill: '#ffffff', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Rect({ left: 0, top: pY, width: CW, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  const items = [['Company',data?.companyName],['Employees',data?.employeeCount],['Country',data?.country],['Currency',data?.currency]].filter(([,v])=>v)
  const cardW = (CONTENT_W-3*6)/4
  items.forEach(([lbl,val],i) => {
    const cx = ML+i*(cardW+6)
    canvas.add(tb(lbl.toUpperCase(), { left: cx+4, top: pY+16, width: cardW-8, fontSize: 6.5, fontWeight: 'bold', fill: '#94a3b8', charSpacing: 60, fontFamily: fontPair.body }))
    canvas.add(tb(String(val||'—'), { left: cx+4, top: pY+28, width: cardW-8, fontSize: 13, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, data: { tr: 'pt' } }))
  })
  canvas.add(sel(new fabric.Line([ML, pY+56, CW-ML, pY+56], { stroke: '#e2e8f0', strokeWidth: 0.5 })))
  if (data?.contactName) canvas.add(tb(`Contact: ${data.contactName}${data.contactEmail ? '  ·  '+data.contactEmail : ''}`, { left: ML, top: pY+66, width: CONTENT_W, fontSize: 8, fill: '#94a3b8', fontFamily: fontPair.body }))
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH-28, width: CW, height: 28, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('VSME ESG Report Builder', { left: ML, top: CH-20, width: 200, fontSize: 7.5, fill: 'rgba(255,255,255,0.7)', fontFamily: fontPair.body }))
  canvas.add(tb(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }), { left: CW-ML-160, top: CH-20, width: 160, textAlign: 'right', fontSize: 7.5, fill: 'rgba(255,255,255,0.7)', fontFamily: fontPair.body }))
  return CH
}

function renderCoverMinimal(canvas, data, config) {
  const { theme, fontPair } = config
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: CH, fill: '#ffffff', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: 6, height: CH, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(sel(new fabric.Rect({ left: 6, top: 0, width: CW-6, height: 80, fill: theme.light, strokeWidth: 0, data: { tr: 'l' } })))
  canvas.add(sel(new fabric.Line([6, 80, CW, 80], { stroke: theme.primary, strokeWidth: 0.5, opacity: 0.3, data: { tr: 'ps' } })))
  canvas.add(sel(new fabric.Rect({ left: 22, top: 22, width: 110, height: 16, fill: theme.primary, rx: 4, ry: 4, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('VSME  ·  BASIC MODULE', { left: 22, top: 24, width: 110, textAlign: 'center', fontSize: 7, fontWeight: 'bold', fill: '#fff', charSpacing: 80, fontFamily: fontPair.body }))
  canvas.add(tb(String(data?.reportingYear||new Date().getFullYear()), { left: CW-80, top: 22, width: 64, textAlign: 'right', fontSize: 20, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, data: { tr: 'pt' } }))
  canvas.add(tb(data?.companyName||'Company Name', { left: 22, top: 108, width: CW-130, fontSize: 32, fontWeight: 'bold', fill: '#0f172a', fontFamily: fontPair.heading }))
  canvas.add(sel(new fabric.Line([22, 162, CW-22, 162], { stroke: theme.primary, strokeWidth: 1.2, data: { tr: 'ps' } })))
  const sub = [data?.sector, data?.country].filter(Boolean).join('  ·  ')
  if (sub) canvas.add(tb(sub, { left: 22, top: 172, width: CW-44, fontSize: 11, fill: '#64748b', fontFamily: fontPair.body }))
  canvas.add(tb('Annual Sustainability Report', { left: 22, top: 192, width: 300, fontSize: 9, fill: '#94a3b8', fontStyle: 'italic', fontFamily: fontPair.body }))
  if (data?.images?.logoImage) loadLogoAsync(canvas, data.images.logoImage, CW-112, 106, 90, 56)
  canvas.add(sel(new fabric.Line([22, 232, CW-22, 232], { stroke: '#e2e8f0', strokeWidth: 0.5 })))
  canvas.add(tb(`This report has been prepared in accordance with the VSME Basic Module (B1–B11) for ${data?.companyName||'the company'}, reporting year ${data?.reportingYear||''}.`, { left: 22, top: 242, width: CW-44, fontSize: 9, fill: '#64748b', lineHeight: 1.65, fontFamily: fontPair.body }))
  const mItems = [['Legal Form',data?.legalForm],['Reporting Basis',data?.reportingBasis==='individual'?'Individual':data?.reportingBasis==='consolidated'?'Consolidated':''],['Balance Sheet',data?.balanceSum?`${Number(data.balanceSum).toLocaleString()} ${data?.currency||''}`:''],['Revenue',data?.revenue?`${Number(data.revenue).toLocaleString()} ${data?.currency||''}`:'']].filter(([,v])=>v)
  let infoY = 328
  mItems.forEach(([lbl,val])=>{ canvas.add(sel(new fabric.Line([22,infoY,CW-22,infoY],{stroke:'#f1f5f9',strokeWidth:0.5}))); canvas.add(tb(lbl,{left:22,top:infoY+5,width:160,fontSize:8.5,fill:'#94a3b8',fontFamily:fontPair.body})); canvas.add(tb(String(val),{left:200,top:infoY+5,width:CW-222,fontSize:8.5,fontWeight:'600',fill:'#1e293b',fontFamily:fontPair.body})); infoY+=22 })
  const keyItems = [['Company',data?.companyName],['Employees',data?.employeeCount],['Country',data?.country],['Currency',data?.currency]].filter(([,v])=>v)
  const cW2 = (CONTENT_W-3*8)/4, gY = CH-100
  keyItems.forEach(([lbl,val],i)=>{ const cx=22+i*(cW2+8); canvas.add(sel(new fabric.Rect({left:cx,top:gY,width:cW2,height:44,fill:theme.light,rx:3,ry:3,strokeWidth:0,data:{tr:'l'}}))); canvas.add(tb(lbl.toUpperCase(),{left:cx+6,top:gY+7,width:cW2-8,fontSize:6,fontWeight:'bold',fill:'#94a3b8',charSpacing:50,fontFamily:fontPair.body})); canvas.add(tb(String(val||'—'),{left:cx+6,top:gY+17,width:cW2-8,fontSize:10,fontWeight:'bold',fill:theme.primary,fontFamily:fontPair.heading,data:{tr:'pt'}})) })
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 22, fill: theme.light, strokeWidth: 0, data: { tr: 'l' } })))
  canvas.add(sel(new fabric.Line([0, CH-22, CW, CH-22], { stroke: theme.primary, strokeWidth: 0.5, data: { tr: 'ps' } })))
  canvas.add(tb('VSME ESG Report Builder', { left: 22, top: CH-16, width: 200, fontSize: 7, fill: theme.primary, fontFamily: fontPair.body, data: { tr: 'pt' } }))
  canvas.add(tb(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }), { left: CW-ML-160, top: CH-16, width: 160, textAlign: 'right', fontSize: 7, fill: theme.primary, fontFamily: fontPair.body, data: { tr: 'pt' } }))
  return CH
}

function renderCoverDark(canvas, data, config) {
  const { theme, fontPair } = config
  const splitX = 240
  canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: splitX, height: CH, fill: theme.dark, strokeWidth: 0, data: { tr: 'd' } })))
  canvas.add(sel(new fabric.Rect({ left: splitX, top: 0, width: CW-splitX, height: CH, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(sel(new fabric.Circle({ left: splitX-80, top: CH-180, radius: 140, fill: 'rgba(255,255,255,0.06)', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Circle({ left: splitX+60, top: -60, radius: 110, fill: 'rgba(255,255,255,0.08)', strokeWidth: 0 })))
  canvas.add(sel(new fabric.Line([splitX, 0, splitX, CH], { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 })))
  // Left panel
  canvas.add(sel(new fabric.Rect({ left: 18, top: 28, width: 90, height: 14, fill: 'rgba(255,255,255,0.15)', rx: 7, ry: 7, strokeWidth: 0 })))
  canvas.add(tb('VSME BASIC', { left: 18, top: 30, width: 90, textAlign: 'center', fontSize: 6.5, fontWeight: 'bold', fill: '#fff', charSpacing: 80, fontFamily: fontPair.body }))
  canvas.add(tb(data?.companyName||'Company Name', { left: 18, top: 230, width: splitX-30, fontSize: 22, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }))
  canvas.add(sel(new fabric.Rect({ left: 18, top: 298, width: 40, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb(String(data?.reportingYear||new Date().getFullYear()), { left: 18, top: 310, width: splitX-30, fontSize: 15, fill: 'rgba(255,255,255,0.7)', fontFamily: fontPair.body }))
  if (data?.images?.logoImage) loadLogoAsync(canvas, data.images.logoImage, 18, 360, 70, 70)
  if (data?.contactName) { canvas.add(tb(data.contactName, { left: 18, top: CH-80, width: splitX-28, fontSize: 8, fill: 'rgba(255,255,255,0.65)', fontFamily: fontPair.body })); if (data.contactEmail) canvas.add(tb(data.contactEmail, { left: 18, top: CH-68, width: splitX-28, fontSize: 7.5, fill: 'rgba(255,255,255,0.45)', fontFamily: fontPair.body })) }
  // Right panel
  const rx = splitX+22, rw = CW-splitX-28
  canvas.add(tb('Sustainability Report', { left: rx, top: 50, width: rw, fontSize: 22, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }))
  canvas.add(sel(new fabric.Line([rx, 86, CW-16, 86], { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 0.6 })))
  canvas.add(tb(`Prepared in accordance with VSME Basic Module (B1–B11) for reporting year ${data?.reportingYear||''}.`, { left: rx, top: 96, width: rw, fontSize: 8.5, fill: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontFamily: fontPair.body }))
  const infoItems = [['Sector',data?.sector],['Country',data?.country],['Employees',data?.employeeCount],['Legal Form',data?.legalForm],['Currency',data?.currency],['Revenue',data?.revenue?`${Number(data.revenue).toLocaleString()} ${data?.currency||''}`:'']].filter(([,v])=>v)
  let iY = 150
  infoItems.forEach(([lbl,val])=>{ canvas.add(sel(new fabric.Line([rx,iY,CW-16,iY],{stroke:'rgba(255,255,255,0.12)',strokeWidth:0.5}))); canvas.add(tb(lbl,{left:rx,top:iY+5,width:70,fontSize:8,fill:'rgba(255,255,255,0.5)',fontFamily:fontPair.body})); canvas.add(tb(String(val),{left:rx+75,top:iY+5,width:rw-75,fontSize:8,fontWeight:'600',fill:'#ffffff',fontFamily:fontPair.body})); iY+=22 })
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 22, fill: theme.dark, strokeWidth: 0, data: { tr: 'd' } })))
  canvas.add(sel(new fabric.Rect({ left: 0, top: CH-22, width: CW, height: 2, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
  canvas.add(tb('VSME ESG Report Builder', { left: 18, top: CH-17, width: 200, fontSize: 7, fill: 'rgba(255,255,255,0.5)', fontFamily: fontPair.body }))
  canvas.add(tb(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }), { left: CW-ML-160, top: CH-17, width: 160, textAlign: 'right', fontSize: 7, fill: 'rgba(255,255,255,0.5)', fontFamily: fontPair.body }))
  return CH
}

// ─── Table of contents ────────────────────────────────────────────────────────

function renderTOCBlock(canvas, config, pageMap) {
  const { theme, fontPair, reportStyle } = config
  const SECTIONS = [
    ['B1','General Information'],['B2','Policies & Commitments'],['B3','Energy & GHG Emissions'],
    ['B4','Pollution'],['B5','Biodiversity'],['B6','Water'],['B7','Resources & Circular Economy'],
    ['B8','Own Workforce'],['B9','Health & Safety'],['B10','Pay & Training'],['B11','Corporate Conduct'],
  ]
  // TOC header matches section band style
  if (reportStyle === 'modern') {
    canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: 72, height: 80, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(sel(new fabric.Rect({ left: 72, top: 0, width: CW-72, height: 80, fill: theme.light, strokeWidth: 0, data: { tr: 'l' } })))
    canvas.add(tb('TOC', { left: 0, top: 28, width: 72, textAlign: 'center', fontSize: 14, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.heading }))
    canvas.add(tb('Contents', { left: 86, top: 20, width: 280, fontSize: 24, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.heading, data: { tr: 'pt' } }))
    canvas.add(tb('VSME Basic Module  ·  B1 – B11', { left: 86, top: 52, width: 300, fontSize: 9, fill: '#94a3b8', fontFamily: fontPair.body }))
  } else if (reportStyle === 'bold') {
    canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: 80, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(sel(new fabric.Circle({ left: CW-40, top: -50, radius: 110, fill: 'rgba(255,255,255,0.05)', strokeWidth: 0 })))
    canvas.add(tb('Contents', { left: ML, top: 18, width: 300, fontSize: 28, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }))
    canvas.add(tb('VSME Basic Module  ·  B1 – B11', { left: ML, top: 54, width: 300, fontSize: 9, fill: 'rgba(255,255,255,0.65)', fontFamily: fontPair.body }))
  } else if (reportStyle === 'minimal') {
    canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: 4, height: 80, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(tb('Contents', { left: ML, top: 16, width: 300, fontSize: 28, fontWeight: 'bold', fill: '#0f172a', fontFamily: fontPair.heading }))
    canvas.add(tb('VSME Basic Module  ·  B1 – B11', { left: ML, top: 52, width: 300, fontSize: 9, fill: '#94a3b8', fontFamily: fontPair.body }))
    canvas.add(sel(new fabric.Line([0, 80, CW, 80], { stroke: '#e2e8f0', strokeWidth: 0.6 })))
  } else { // dark
    canvas.add(sel(new fabric.Rect({ left: 0, top: 0, width: CW, height: 80, fill: theme.dark, strokeWidth: 0, data: { tr: 'd' } })))
    canvas.add(sel(new fabric.Rect({ left: 0, top: 77, width: CW, height: 3, fill: theme.primary, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(tb('Contents', { left: ML, top: 18, width: 300, fontSize: 28, fontWeight: 'bold', fill: '#ffffff', fontFamily: fontPair.heading }))
    canvas.add(tb('VSME Basic Module  ·  B1 – B11', { left: ML, top: 54, width: 300, fontSize: 9, fill: 'rgba(255,255,255,0.5)', fontFamily: fontPair.body }))
  }
  let y = 96
  SECTIONS.forEach(([badge, title], i) => {
    const isEven = i%2===0
    if (isEven) canvas.add(sel(new fabric.Rect({ left: ML, top: y-2, width: CONTENT_W, height: 22, fill: '#f8fafc', rx: 2, ry: 2, strokeWidth: 0 })))
    const bW = badge.length > 2 ? 28 : 22
    canvas.add(sel(new fabric.Rect({ left: ML+4, top: y+2, width: bW, height: 14, fill: theme.primary, rx: 3, ry: 3, strokeWidth: 0, data: { tr: 'p' } })))
    canvas.add(tb(badge, { left: ML+4, top: y+3, width: bW, textAlign: 'center', fontSize: 7.5, fontWeight: 'bold', fill: '#fff', fontFamily: fontPair.body }))
    canvas.add(tb(title, { left: ML+bW+10, top: y+1, width: CONTENT_W-bW-50, fontSize: 10, fill: '#334155', fontFamily: fontPair.body }))
    canvas.add(tb(pageMap[badge] ? String(pageMap[badge]) : '—', { left: CW-ML-30, top: y+1, width: 30, textAlign: 'right', fontSize: 10, fontWeight: 'bold', fill: theme.primary, fontFamily: fontPair.body, data: { tr: 'pt' } }))
    y += 22
  })
  return CH
}

// ─── PDF export ───────────────────────────────────────────────────────────────

async function exportAllPagesToPDF(pages, allStates, config, companyName, reportingYear) {
  const { theme } = config
  const exportEl = document.createElement('canvas')
  exportEl.width = CW*2; exportEl.height = CH*2
  document.body.appendChild(exportEl)
  const offscreen = new fabric.Canvas(exportEl, { width: CW*2, height: CH*2, backgroundColor: '#ffffff' })
  offscreen.setZoom(2)
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' })
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()
    await new Promise(resolve => {
      offscreen.clear(); offscreen.backgroundColor = '#ffffff'
      const saved = allStates[i]
      if (saved) offscreen.loadFromJSON(saved, () => { offscreen.setZoom(2); recolorCanvas(offscreen, theme); offscreen.renderAll(); resolve() })
      else renderPage(offscreen, pages[i], config, i+1, companyName).then(resolve)
    })
    await new Promise(r => setTimeout(r, 80))
    doc.addImage(exportEl.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297)
  }
  offscreen.dispose(); document.body.removeChild(exportEl)
  doc.save(`VSME_ESG_${(companyName||'Report').replace(/\s+/g,'_')}_${reportingYear||''}.pdf`)
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  const [activeIdx, _setActiveIdx]          = useState(0)
  const [themeId, setThemeId]               = useState('navy')
  const [customColor, setCustomColor]       = useState('#112a57')
  const [reportStyleId, setReportStyleId]   = useState('modern')
  const [fontPairId, setFontPairId]         = useState('editorial')
  const [hasSelection, setHasSelection]     = useState(false)
  const [selectionColor, setSelectionColor] = useState('#112a57')
  const [selType, setSelType]               = useState(null)   // 'text'|'image'|'rect'|'circle'|'other'|null
  const [selFont, setSelFont]               = useState('Arial')
  const [selFontSize, setSelFontSize]       = useState(11)
  const [selOpacity, setSelOpacity]         = useState(100)
  const [selRx, setSelRx]                   = useState(0)
  const [bgTolerance, setBgTolerance]       = useState(25)
  const [isExporting, setIsExporting]       = useState(false)
  const [canUndo, setCanUndo]               = useState(false)
  const [canRedo, setCanRedo]               = useState(false)
  const [, forceUpdate]                     = useState(0)

  const customTheme = useMemo(() => makeThemeFromColor(customColor), [customColor])
  const THEMES_ALL  = useMemo(() => [...THEMES, customTheme], [customTheme])
  const theme    = useMemo(() => THEMES_ALL.find(t => t.id === themeId) || THEMES[0], [themeId, THEMES_ALL])
  const fontPair = useMemo(() => FONT_PAIRS.find(f => f.id === fontPairId) || FONT_PAIRS[0], [fontPairId])
  const config   = useMemo(() => ({ theme, fontPair, reportStyle: reportStyleId }), [theme, fontPair, reportStyleId])

  const themeRef  = useRef(theme)
  const configRef = useRef(config)
  useEffect(() => { themeRef.current = theme }, [theme])
  useEffect(() => { configRef.current = config }, [config])

  const pages = useMemo(() => buildAllPages(data), [data])

  const setActiveIdx = useCallback((i) => {
    activeIdxRef.current = i; _setActiveIdx(i)
    const h = historyRef.current[i]
    setCanUndo(h ? h.idx > 0 : false); setCanRedo(h ? h.idx < h.stack.length-1 : false)
  }, [])

  const pushHistoryForCanvas = useCallback((idx, canvas) => {
    const h = historyRef.current
    if (!h[idx]) h[idx] = { stack: [], idx: -1 }
    const hist = h[idx], json = canvas.toJSON(['data'])
    hist.stack = hist.stack.slice(0, hist.idx+1); hist.stack.push(json)
    if (hist.stack.length > 40) hist.stack.shift()
    hist.idx = hist.stack.length-1
    if (activeIdxRef.current === idx) { setCanUndo(hist.idx > 0); setCanRedo(false) }
  }, [])
  pushHistoryRef.current = pushHistoryForCanvas

  const updateSelectionProps = useCallback((obj) => {
    if (!obj) { setSelType(null); return }
    const t = obj.type
    if (t === 'textbox' || t === 'text' || t === 'i-text') {
      setSelType('text'); setSelFont(obj.fontFamily||'Arial'); setSelFontSize(obj.fontSize||11)
    } else if (t === 'image') {
      setSelType('image'); setSelOpacity(Math.round((obj.opacity??1)*100))
    } else if (t === 'rect') {
      setSelType('rect'); setSelRx(Math.round(obj.rx||0)); setSelOpacity(Math.round((obj.opacity??1)*100))
    } else if (t === 'circle') {
      setSelType('circle'); setSelOpacity(Math.round((obj.opacity??1)*100))
    } else {
      setSelType('other')
    }
    const c = (t === 'line' || (obj.fill === 'transparent' && obj.stroke)) ? obj.stroke : obj.fill
    setSelectionColor(fabricColorToHex(c))
  }, [])
  updateSelColorRef.current = updateSelectionProps

  // ── Init canvases ──
  useEffect(() => {
    const instances = new Array(pages.length).fill(null)
    pages.forEach((page, i) => {
      const el = canvasElRefs.current[i]; if (!el) return
      const canvas = new fabric.Canvas(el, { width: CW, height: CH, backgroundColor: '#ffffff', preserveObjectStacking: true, stopContextMenu: true })
      instances[i] = canvas
      canvas.on('mouse:down', (e) => {
        const p = canvas.getPointer(e.e); lastPointerRef.current[i] = { x: p.x, y: p.y }
        if (activeIdxRef.current !== i) { const prev = instances[activeIdxRef.current]; if (prev) { prev.discardActiveObject(); prev.renderAll() }; setActiveIdx(i); setHasSelection(false) }
      })
      canvas.on('selection:created', (e) => { if (activeIdxRef.current === i) { setHasSelection(true); updateSelColorRef.current?.(e.selected?.[0]) } })
      canvas.on('selection:updated', (e) => { if (activeIdxRef.current === i) updateSelColorRef.current?.(e.selected?.[0] ?? canvas.getActiveObject()) })
      canvas.on('selection:cleared', () => { if (activeIdxRef.current === i) { setHasSelection(false); setSelType(null) } })
      canvas.on('object:modified', () => { pushHistoryRef.current(i, canvas); forceUpdate(n => n+1) })
      canvas.on('text:changed', () => pushHistoryRef.current(i, canvas))
      canvas.on('mouse:dblclick', (e) => { const obj = e.target; if (obj?.type === 'textbox' && obj.editable !== false) { canvas.setActiveObject(obj); obj.enterEditing(); canvas.renderAll() } })
      renderPage(canvas, page, configRef.current, i+1, data.companyName).then(() => { if (!historyRef.current[i]) historyRef.current[i] = { stack: [canvas.toJSON(['data'])], idx: 0 } })
    })
    fabricInstances.current = instances
    return () => { instances.forEach(c => c?.dispose()); fabricInstances.current = [] }
  }, []) // eslint-disable-line

  // Theme change — recolor only
  useEffect(() => { fabricInstances.current.forEach(c => { if (c) recolorCanvas(c, theme) }) }, [theme]) // eslint-disable-line

  // Helper: re-render all pages
  const rerenderAll = useCallback(() => {
    fabricInstances.current.forEach((canvas, i) => {
      if (!canvas || !pages[i]) return
      renderPage(canvas, pages[i], configRef.current, i+1, data.companyName).then(() => {
        historyRef.current[i] = { stack: [canvas.toJSON(['data'])], idx: 0 }
        if (activeIdxRef.current === i) { setCanUndo(false); setCanRedo(false) }
      })
    })
  }, [pages, data]) // eslint-disable-line

  // Report style change — re-render ALL pages
  const reportStyleMountedRef = useRef(false)
  useEffect(() => { if (!reportStyleMountedRef.current) { reportStyleMountedRef.current = true; return }; rerenderAll() }, [reportStyleId]) // eslint-disable-line

  // Font pair change — re-render ALL pages
  const fontPairMountedRef = useRef(false)
  useEffect(() => { if (!fontPairMountedRef.current) { fontPairMountedRef.current = true; return }; rerenderAll() }, [fontPairId]) // eslint-disable-line

  const handleUndo = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx], h = historyRef.current[idx]
    if (!canvas || !h || h.idx <= 0) return
    h.idx--; canvas.loadFromJSON(h.stack[h.idx], () => { recolorCanvas(canvas, themeRef.current); canvas.renderAll() })
    setCanUndo(h.idx > 0); setCanRedo(true)
  }, [])
  const handleRedo = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx], h = historyRef.current[idx]
    if (!canvas || !h || h.idx >= h.stack.length-1) return
    h.idx++; canvas.loadFromJSON(h.stack[h.idx], () => { recolorCanvas(canvas, themeRef.current); canvas.renderAll() })
    setCanUndo(true); setCanRedo(h.idx < h.stack.length-1)
  }, [])

  const applySelectionColor = useCallback((color, pushHist=false) => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().forEach(obj => applyColorToObj(obj, color)); canvas.renderAll(); setSelectionColor(color)
    if (pushHist) pushHistoryRef.current(idx, canvas)
  }, [])
  const applyFontFamily = useCallback((family) => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().forEach(obj => { if ('fontFamily' in obj) obj.set('fontFamily', family) }); canvas.renderAll(); setSelFont(family); pushHistoryRef.current(idx, canvas)
  }, [])
  const applyFontSize = useCallback((size) => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().forEach(obj => { if ('fontSize' in obj) obj.set('fontSize', Number(size)) }); canvas.renderAll(); setSelFontSize(size); pushHistoryRef.current(idx, canvas)
  }, [])
  const applyOpacity = useCallback((pct, pushHist=false) => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().forEach(obj => obj.set('opacity', pct/100)); canvas.renderAll(); setSelOpacity(pct)
    if (pushHist) pushHistoryRef.current(idx, canvas)
  }, [])
  const applyCornerRadius = useCallback((r) => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().forEach(obj => { if (obj.type === 'rect') { obj.set({ rx: r, ry: r }); obj.dirty = true } }); canvas.renderAll(); setSelRx(r)
    pushHistoryRef.current(idx, canvas)
  }, [])

  const handleRemoveBg = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const obj = canvas.getActiveObject(); if (!obj || obj.type !== 'image') return
    const imgEl = obj.getElement(), w = imgEl.naturalWidth||imgEl.width, h = imgEl.naturalHeight||imgEl.height; if (!w||!h) return
    const off = document.createElement('canvas'); off.width = w; off.height = h
    const ctx = off.getContext('2d'); ctx.drawImage(imgEl, 0, 0)
    const id = ctx.getImageData(0,0,w,h), d = id.data, thr = (bgTolerance/100)*Math.sqrt(255*255*3)
    for (let i=0;i<d.length;i+=4) { const dist=Math.sqrt((255-d[i])**2+(255-d[i+1])**2+(255-d[i+2])**2); if (dist<thr) d[i+3]=Math.round(d[i+3]*Math.min(1,(dist/thr)*1.5)) }
    ctx.putImageData(id,0,0); obj.setSrc(off.toDataURL('image/png'), () => { canvas.renderAll(); pushHistoryRef.current(idx, canvas) })
  }, [bgTolerance])

  const handleCustomColor = useCallback((color) => { setCustomColor(color); setThemeId('custom') }, [])

  // ── Shape tools ──
  const handleAddShape = useCallback((shapeType) => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const ptr = lastPointerRef.current[idx]
    const cx = ptr ? Math.max(ML, Math.min(ptr.x, CW-80)) : ML+80
    const cy = ptr ? Math.max(30, Math.min(ptr.y, CH-80)) : 200
    const t = themeRef.current
    let obj
    if (shapeType === 'circle') {
      obj = sel(new fabric.Circle({ left: cx, top: cy, radius: 40, fill: t.light, stroke: t.primary, strokeWidth: 1.5, data: { tr: 'l' } }))
    } else if (shapeType === 'rect') {
      obj = sel(new fabric.Rect({ left: cx, top: cy, width: 120, height: 70, fill: t.light, stroke: t.primary, strokeWidth: 1.5, rx: 0, ry: 0, data: { tr: 'l' } }))
    } else if (shapeType === 'rounded') {
      obj = sel(new fabric.Rect({ left: cx, top: cy, width: 120, height: 70, fill: t.light, stroke: t.primary, strokeWidth: 1.5, rx: 14, ry: 14, data: { tr: 'l' } }))
    } else if (shapeType === 'line') {
      obj = sel(new fabric.Line([cx, cy, cx+160, cy], { stroke: t.primary, strokeWidth: 2, data: { tr: 'ps' } }))
    } else if (shapeType === 'triangle') {
      obj = sel(new fabric.Triangle({ left: cx, top: cy, width: 80, height: 70, fill: t.light, stroke: t.primary, strokeWidth: 1.5, data: { tr: 'l' } }))
    }
    if (obj) { canvas.add(obj); canvas.setActiveObject(obj); canvas.renderAll(); pushHistoryRef.current(idx, canvas) }
  }, [])

  const handleDuplicate = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const objs = canvas.getActiveObjects(); if (!objs.length) return
    const clones = []; let pending = objs.length
    objs.forEach(obj => {
      obj.clone(clone => {
        clone.set({ left: (clone.left||0)+14, top: (clone.top||0)+14 }); sel(clone); canvas.add(clone); clones.push(clone)
        if (--pending === 0) {
          canvas.discardActiveObject()
          if (clones.length === 1) canvas.setActiveObject(clones[0])
          else canvas.setActiveObject(new fabric.ActiveSelection(clones, { canvas }))
          canvas.renderAll(); pushHistoryRef.current(idx, canvas)
        }
      })
    })
  }, [])

  const handleAddText = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const ptr = lastPointerRef.current[idx]
    const x = ptr ? Math.max(0, Math.min(ptr.x, CW-100)) : ML
    const y = ptr ? Math.max(0, Math.min(ptr.y, CH-40)) : 200
    const t = tb('Your text here', { left: x, top: y, width: Math.min(CONTENT_W, CW-x), fontSize: 11, fill: '#334155', data: { type: 'user-text' } })
    canvas.add(t); canvas.setActiveObject(t); t.enterEditing(); canvas.renderAll(); pushHistoryRef.current(idx, canvas)
  }, [])
  const handleAddImage = useCallback(() => fileInputRef.current?.click(), [])
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return
    const idx = activeIdxRef.current, ptr = lastPointerRef.current[idx]
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const fimg = new fabric.Image(img)
        const scale = Math.min(240/fimg.width, 180/fimg.height, 1)
        const x = ptr ? Math.max(0, Math.min(ptr.x, CW-fimg.width*scale)) : ML
        const y = ptr ? Math.max(0, Math.min(ptr.y, CH-fimg.height*scale)) : 140
        fimg.set({ left: x, top: y, scaleX: scale, scaleY: scale, data: { type: 'image-block' } }); sel(fimg)
        const canvas = fabricInstances.current[idx]; if (!canvas) return
        canvas.add(fimg); canvas.setActiveObject(fimg); canvas.renderAll(); pushHistoryRef.current(idx, canvas)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file); e.target.value = ''
  }, [])

  const handleDelete = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    canvas.getActiveObjects().filter(o => o.selectable !== false).forEach(o => canvas.remove(o))
    canvas.discardActiveObject(); canvas.renderAll(); pushHistoryRef.current(idx, canvas)
  }, [])
  const handleBringForward = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const active = canvas.getActiveObject(); if (!active) return
    const objs = active.type === 'activeSelection' ? [...active.getObjects()].sort((a, b) => canvas.getObjects().indexOf(b) - canvas.getObjects().indexOf(a)) : [active]
    objs.forEach(o => canvas.bringForward(o))
    canvas.renderAll(); pushHistoryRef.current(idx, canvas)
  }, [])
  const handleSendBackward = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const active = canvas.getActiveObject(); if (!active) return
    const objs = active.type === 'activeSelection' ? [...active.getObjects()].sort((a, b) => canvas.getObjects().indexOf(a) - canvas.getObjects().indexOf(b)) : [active]
    objs.forEach(o => canvas.sendBackwards(o))
    canvas.renderAll(); pushHistoryRef.current(idx, canvas)
  }, [])
  const handleBringToFront = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const active = canvas.getActiveObject(); if (!active) return
    const objs = active.type === 'activeSelection' ? [...active.getObjects()] : [active]
    objs.forEach(o => canvas.bringToFront(o))
    canvas.renderAll(); pushHistoryRef.current(idx, canvas)
  }, [])
  const handleSendToBack = useCallback(() => {
    const idx = activeIdxRef.current, canvas = fabricInstances.current[idx]; if (!canvas) return
    const active = canvas.getActiveObject(); if (!active) return
    const objs = active.type === 'activeSelection' ? [...active.getObjects()].reverse() : [active]
    objs.forEach(o => canvas.sendToBack(o))
    canvas.renderAll(); pushHistoryRef.current(idx, canvas)
  }, [])
  const handlePageJump = useCallback((idx) => { setActiveIdx(idx); pageContainerRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [setActiveIdx])
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try { await exportAllPagesToPDF(pages, fabricInstances.current.map(c => c?.toJSON(['data'])), configRef.current, data.companyName, data.reportingYear) }
    finally { setIsExporting(false) }
  }, [pages, data])

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); handleUndo() }
        if (e.key === 'y') { e.preventDefault(); handleRedo() }
        if (e.key === 'd') { e.preventDefault(); handleDuplicate() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo, handleDuplicate])

  return (
    <div className="canvas-editor">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      <header className="ce-toolbar">
        <div className="ce-toolbar-left">
          <button className="ce-btn-back" onClick={onClose}>← Back</button>
          <span className="ce-divider" />
          <span className="ce-title">{data.companyName || 'Report'}</span>
        </div>

        <div className="ce-toolbar-center">
          <button className="ce-tool" title="Add text" onClick={handleAddText}>
            <span className="ce-tool-icon">T</span><span className="ce-tool-label">Text</span>
          </button>
          <button className="ce-tool" title="Add image" onClick={handleAddImage}>
            <span className="ce-tool-icon">🖼</span><span className="ce-tool-label">Image</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool" title="Circle" onClick={() => handleAddShape('circle')}>
            <span className="ce-tool-icon">○</span><span className="ce-tool-label">Circle</span>
          </button>
          <button className="ce-tool" title="Rectangle" onClick={() => handleAddShape('rect')}>
            <span className="ce-tool-icon">▭</span><span className="ce-tool-label">Rect</span>
          </button>
          <button className="ce-tool" title="Rounded rectangle" onClick={() => handleAddShape('rounded')}>
            <span className="ce-tool-icon">▢</span><span className="ce-tool-label">Rounded</span>
          </button>
          <button className="ce-tool" title="Line" onClick={() => handleAddShape('line')}>
            <span className="ce-tool-icon">─</span><span className="ce-tool-label">Line</span>
          </button>
          <button className="ce-tool" title="Triangle" onClick={() => handleAddShape('triangle')}>
            <span className="ce-tool-icon">△</span><span className="ce-tool-label">Triangle</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool" title="Duplicate (Ctrl+D)" onClick={handleDuplicate} disabled={!hasSelection}>
            <span className="ce-tool-icon">⧉</span><span className="ce-tool-label">Duplicate</span>
          </button>
          <button className="ce-tool ce-tool--danger" title="Delete" onClick={handleDelete} disabled={!hasSelection}>
            <span className="ce-tool-icon">✕</span><span className="ce-tool-label">Delete</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={!canUndo}>
            <span className="ce-tool-icon">↩</span><span className="ce-tool-label">Undo</span>
          </button>
          <button className="ce-tool" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={!canRedo}>
            <span className="ce-tool-icon">↪</span><span className="ce-tool-label">Redo</span>
          </button>
          <span className="ce-divider" />
          <button className="ce-tool" title="Bring to front" onClick={handleBringToFront} disabled={!hasSelection}>
            <span className="ce-tool-icon">⤒</span><span className="ce-tool-label">Front</span>
          </button>
          <button className="ce-tool" title="Bring forward one step" onClick={handleBringForward} disabled={!hasSelection}>
            <span className="ce-tool-icon">↑</span><span className="ce-tool-label">Fwd</span>
          </button>
          <button className="ce-tool" title="Send backward one step" onClick={handleSendBackward} disabled={!hasSelection}>
            <span className="ce-tool-icon">↓</span><span className="ce-tool-label">Bwd</span>
          </button>
          <button className="ce-tool" title="Send to back" onClick={handleSendToBack} disabled={!hasSelection}>
            <span className="ce-tool-icon">⤓</span><span className="ce-tool-label">Back</span>
          </button>
          {hasSelection && (
            <>
              <span className="ce-divider" />
              <label className="ce-tool ce-color-tool" title="Element colour">
                <span className="ce-tool-icon"><span className="ce-color-swatch" style={{ background: selectionColor }} /></span>
                <span className="ce-tool-label">Colour</span>
                <input type="color" value={selectionColor}
                  onInput={e => applySelectionColor(e.target.value, false)}
                  onChange={e => applySelectionColor(e.target.value, true)}
                  className="ce-color-input-overlay" />
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
            <label className={`ce-theme-dot ce-theme-dot--custom${themeId === 'custom' ? ' active' : ''}`} style={{ '--c': customColor }} title="Custom colour">
              <input type="color" value={customColor}
                onInput={e => handleCustomColor(e.target.value)}
                onChange={e => handleCustomColor(e.target.value)}
                className="ce-color-input-overlay" />
            </label>
          </div>
          <button className="ce-btn-export" style={{ background: theme.primary }} onClick={handleExport} disabled={isExporting}>
            {isExporting ? '⏳ Generating…' : '📄 Export PDF'}
          </button>
        </div>
      </header>

      {/* Design bar */}
      <div className="ce-design-bar">
        <span className="ce-design-label">Style:</span>
        {REPORT_STYLES.map(s => (
          <button key={s.id}
            className={`ce-design-btn${reportStyleId === s.id ? ' ce-design-btn--active' : ''}`}
            style={reportStyleId === s.id ? { borderColor: theme.primary, color: theme.primary, background: `${theme.primary}18` } : {}}
            onClick={() => setReportStyleId(s.id)}
          >{s.label}</button>
        ))}
        <span className="ce-design-sep" />
        <span className="ce-design-label">Font:</span>
        <select value={fontPairId} onChange={e => setFontPairId(e.target.value)} className="ce-select">
          {FONT_PAIRS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      {/* Properties bar */}
      {hasSelection && (selType === 'text' || selType === 'image' || selType === 'rect' || selType === 'circle') && (
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
          {selType === 'rect' && (
            <>
              <span className="ce-props-label">Corner radius</span>
              <input type="range" min="0" max="60" value={selRx}
                onInput={e => { setSelRx(Number(e.target.value)); applyCornerRadius(Number(e.target.value)) }}
                onChange={e => applyCornerRadius(Number(e.target.value))}
                className="ce-range" />
              <span className="ce-props-val">{selRx}px</span>
              <span className="ce-divider-v" />
            </>
          )}
          {(selType === 'rect' || selType === 'circle') && (
            <>
              <span className="ce-props-label">Opacity</span>
              <input type="range" min="0" max="100" value={selOpacity}
                onInput={e => applyOpacity(Number(e.target.value))}
                onChange={e => applyOpacity(Number(e.target.value), true)}
                className="ce-range" />
              <span className="ce-props-val">{selOpacity}%</span>
            </>
          )}
          {selType === 'image' && (
            <>
              <span className="ce-props-label">Remove BG tolerance</span>
              <input type="range" min="5" max="75" value={bgTolerance} onChange={e => setBgTolerance(Number(e.target.value))} className="ce-range" />
              <span className="ce-props-val">{bgTolerance}%</span>
              <button className="ce-props-btn" onClick={handleRemoveBg}>Remove BG</button>
              <span className="ce-divider-v" />
              <span className="ce-props-label">Opacity</span>
              <input type="range" min="0" max="100" value={selOpacity}
                onInput={e => applyOpacity(Number(e.target.value))}
                onChange={e => applyOpacity(Number(e.target.value), true)}
                className="ce-range" />
              <span className="ce-props-val">{selOpacity}%</span>
            </>
          )}
        </div>
      )}

      <div className="ce-body">
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

        <main className="ce-canvas-area">
          {pages.map((page, i) => (
            <div key={i} ref={el => { pageContainerRefs.current[i] = el }} className="ce-page-block">
              <div className="ce-page-block-label">Page {i + 1} — {page.title}</div>
              <div className={`ce-canvas-wrap${i === activeIdx ? ' active' : ''}`}>
                <canvas ref={el => { canvasElRefs.current[i] = el }} />
              </div>
            </div>
          ))}
          <p className="ce-canvas-hint">Click to select · Drag to move · Double-click text to edit · Ctrl+D to duplicate</p>
        </main>
      </div>
    </div>
  )
}
