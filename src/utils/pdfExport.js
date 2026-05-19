import jsPDF from 'jspdf'

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEME_MAP = {
  green:  { primary: [22,163,74],   light: [220,252,231], dark: [20,83,45],   name: 'Forest'  },
  blue:   { primary: [37,99,235],   light: [219,234,254], dark: [30,58,138],  name: 'Ocean'   },
  purple: { primary: [124,58,237],  light: [237,233,254], dark: [76,29,149],  name: 'Dusk'    },
  slate:  { primary: [51,65,85],    light: [241,245,249], dark: [15,23,42],   name: 'Minimal' },
}

const DARK   = [15, 23, 42]
const MID    = [71, 85, 105]
const LIGHT  = [241, 245, 249]
const WHITE  = [255, 255, 255]
const PAGE_W = 210
const PAGE_H = 297
const ML     = 14   // margin left
const MR     = 196  // margin right (ML + content width 182)
const CW     = 182  // content width

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v, fallback = '—') {
  if (v === undefined || v === null || v === '') return fallback
  return String(v)
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<br\s*\/?>/gi, '\n')
             .replace(/<\/p>/gi, '\n')
             .replace(/<\/li>/gi, '\n')
             .replace(/<[^>]+>/g, '')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&nbsp;/g, ' ')
             .replace(/\n{3,}/g, '\n\n')
             .trim()
}

function embedImage(doc, dataUrl, x, y, w, h) {
  if (!dataUrl) return false
  try {
    const fmt = dataUrl.startsWith('data:image/png') ? 'PNG'
               : dataUrl.startsWith('data:image/gif') ? 'GIF'
               : 'JPEG'
    const b64 = dataUrl.split(',')[1]
    if (!b64) return false
    doc.addImage(b64, fmt, x, y, w, h, undefined, 'FAST')
    return true
  } catch (e) {
    return false
  }
}

// Rounded rect (jsPDF doesn't have built-in, use lines)
function roundedRect(doc, x, y, w, h, r) {
  doc.moveTo(x + r, y)
  doc.lineTo(x + w - r, y)
  doc.curveTo(x + w, y, x + w, y, x + w, y + r)
  doc.lineTo(x + w, y + h - r)
  doc.curveTo(x + w, y + h, x + w, y + h, x + w - r, y + h)
  doc.lineTo(x + r, y + h)
  doc.curveTo(x, y + h, x, y + h, x, y + h - r)
  doc.lineTo(x, y + r)
  doc.curveTo(x, y, x, y, x + r, y)
  doc.close()
}

// ─── Page Furniture ───────────────────────────────────────────────────────────

function addPageHeader(doc, theme, companyName, pageNum) {
  doc.setFillColor(...theme.primary)
  doc.rect(0, 0, PAGE_W, 8, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...WHITE)
  doc.text(companyName || 'VSME ESG Report', ML, 5.5)
  doc.text(`Page ${pageNum}`, MR, 5.5, { align: 'right' })
  doc.setTextColor(...DARK)
}

function addPageFooter(doc, theme) {
  doc.setFillColor(...theme.light)
  doc.rect(0, 289, PAGE_W, 8, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MID)
  doc.text('VSME ESG Report — Basic Module B1–B11', ML, 294)
  doc.text(
    new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
    MR, 294, { align: 'right' }
  )
  doc.setTextColor(...DARK)
}

function newPage(doc, theme, companyName, pageCounter) {
  doc.addPage()
  const num = pageCounter.n++
  addPageHeader(doc, theme, companyName, num)
  addPageFooter(doc, theme)
  return 18  // y after page header
}

// ─── Section Header ───────────────────────────────────────────────────────────

function sectionHeader(doc, theme, badge, title, y) {
  if (y > 255) return null  // signal caller to add page

  // Badge pill
  doc.setFillColor(...theme.primary)
  doc.rect(ML, y - 1, 16, 9, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text(badge, ML + 8, y + 5, { align: 'center' })

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(title, ML + 20, y + 5)

  // Underline
  doc.setDrawColor(...theme.light)
  doc.setLineWidth(0.5)
  doc.line(ML, y + 11, MR, y + 11)
  doc.setLineWidth(0.2)

  return y + 18
}

// ─── Subsection title ─────────────────────────────────────────────────────────

function subTitle(doc, text, y) {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...MID)
  doc.text(text.toUpperCase(), ML, y)
  return y + 7
}

// ─── KPI Metric Boxes ─────────────────────────────────────────────────────────

function kpiRow(doc, theme, metrics, y) {
  // metrics: [{label, value, unit}]
  if (!metrics.length) return y
  const count = Math.min(metrics.length, 4)
  const gapX = 4
  const bw = (CW - (gapX * (count - 1))) / count
  const bh = 22

  metrics.slice(0, 4).forEach((m, i) => {
    const x = ML + i * (bw + gapX)
    doc.setFillColor(...theme.light)
    doc.rect(x, y, bw, bh, 'F')
    doc.setDrawColor(...theme.primary)
    doc.setLineWidth(0.4)
    doc.rect(x, y, bw, bh, 'S')
    doc.setLineWidth(0.2)

    // Left accent bar
    doc.setFillColor(...theme.primary)
    doc.rect(x, y, 2, bh, 'F')

    // Value
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    const valStr = m.value !== '' && m.value !== null && !isNaN(m.value)
      ? `${Number(m.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : fmt(m.value)
    doc.text(valStr, x + bw / 2 + 1, y + 9, { align: 'center' })

    // Unit
    if (m.unit) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...theme.primary)
      doc.text(m.unit, x + bw / 2 + 1, y + 14, { align: 'center' })
    }

    // Label
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    const labelLines = doc.splitTextToSize(m.label, bw - 8)
    doc.text(labelLines[0] || m.label, x + bw / 2 + 1, y + 19, { align: 'center' })
  })

  doc.setTextColor(...DARK)
  return y + bh + 8
}

// ─── Data Table Row ───────────────────────────────────────────────────────────

function tableRow(doc, label, value, y, shade) {
  const rh = 8
  if (shade) {
    doc.setFillColor(...LIGHT)
    doc.rect(ML, y - rh + 2, CW, rh, 'F')
  }
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MID)
  doc.text(label, ML + 2, y)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(value), ML + 90, y)
  doc.setFont('helvetica', 'normal')
  return y + rh
}

// ─── Narrative Text ───────────────────────────────────────────────────────────

function narrativeBlock(doc, html, y, maxW, rightBound) {
  const text = stripHtml(html)
  if (!text) return y
  const width = maxW || CW
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MID)
  const paragraphs = text.split('\n').filter(p => p.trim())
  paragraphs.forEach(para => {
    const lines = doc.splitTextToSize(para.trim(), width - 2)
    lines.forEach(line => {
      if (y > 278) return
      doc.text(line, ML, y)
      y += 5.5
    })
    y += 3
  })
  doc.setTextColor(...DARK)
  return y + 2
}

// ─── Section with optional image ─────────────────────────────────────────────

function contentSection(doc, theme, badge, title, tableData, narrative, imageUrl, layout, y, pc) {
  if (y > 220) y = newPage(doc, theme, doc.__companyName, pc)

  const h = sectionHeader(doc, theme, badge, title, y)
  if (!h) {
    y = newPage(doc, theme, doc.__companyName, pc)
    y = sectionHeader(doc, theme, badge, title, y)
  } else {
    y = h
  }

  const hasImage = !!imageUrl
  const hasNarrative = !!(narrative && stripHtml(narrative).trim())
  const hasTable = tableData && tableData.filter(r => r.type !== 'kpi').length > 0

  // KPI metrics from tableData
  const kpis = tableData ? tableData.filter(r => r.type === 'kpi' && r.value !== '') : []
  if (kpis.length) {
    y = kpiRow(doc, theme, kpis, y)
  }

  if (!hasImage) {
    // No image: full-width table + narrative
    if (hasTable) {
      const rows = tableData.filter(r => r.type !== 'kpi')
      rows.forEach((r, i) => {
        if (y > 275) y = newPage(doc, theme, doc.__companyName, pc) + 4
        y = tableRow(doc, r.label, r.value, y, i % 2 === 0)
      })
      y += 4
    }
    if (hasNarrative) {
      y = narrativeBlock(doc, narrative, y, CW, MR)
    }
    return y + 8
  }

  // ── Layout with image ──
  if (layout === 'image-top') {
    // Image full width, then content
    const imgH = 52
    embedImage(doc, imageUrl, ML, y, CW, imgH)
    y += imgH + 6
    if (hasTable) {
      const rows = tableData.filter(r => r.type !== 'kpi')
      rows.forEach((r, i) => {
        if (y > 275) y = newPage(doc, theme, doc.__companyName, pc) + 4
        y = tableRow(doc, r.label, r.value, y, i % 2 === 0)
      })
      y += 4
    }
    if (hasNarrative) y = narrativeBlock(doc, narrative, y, CW, MR)
    return y + 8
  }

  // side-right or side-left: 2 columns
  const imgW = 68
  const textW = CW - imgW - 6
  const imgX = layout === 'side-left' ? ML : ML + textW + 6
  const textX = layout === 'side-left' ? ML + imgW + 6 : ML

  // Estimate text height to size the image
  const rows = hasTable ? tableData.filter(r => r.type !== 'kpi') : []
  const tableH = rows.length * 8
  const narText = hasNarrative ? stripHtml(narrative) : ''
  const narLines = narText ? doc.splitTextToSize(narText, textW).length : 0
  const narH = narLines * 5.5 + (narText.split('\n').filter(p => p.trim()).length * 3)
  const contentH = Math.max(tableH + narH + 4, 40)
  const imgH = Math.min(contentH, 80)

  // Draw image
  embedImage(doc, imageUrl, imgX, y, imgW, imgH)

  // Draw content in text column
  let ty = y
  rows.forEach((r, i) => {
    if (ty > 275) return
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    doc.text(r.label, textX, ty)
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(r.value), textX + textW - 2, ty, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT)
      doc.rect(textX - 2, ty - 6, textW + 4, 8, 'F')
      // re-draw text over background
      doc.setTextColor(...MID)
      doc.text(r.label, textX, ty)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text(fmt(r.value), textX + textW - 2, ty, { align: 'right' })
      doc.setFont('helvetica', 'normal')
    }
    ty += 8
  })
  if (ty < y + 4) ty = y + 4

  if (hasNarrative) {
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    const stripped = stripHtml(narrative)
    const paras = stripped.split('\n').filter(p => p.trim())
    paras.forEach(para => {
      const lines = doc.splitTextToSize(para.trim(), textW - 2)
      lines.forEach(line => {
        if (ty > 278) return
        doc.text(line, textX, ty)
        ty += 5.5
      })
      ty += 3
    })
  }

  doc.setTextColor(...DARK)
  return Math.max(y + imgH, ty) + 10
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

function drawCover(doc, theme, design, data) {
  if (design.coverStyle === 'bold') {
    // Top band
    doc.setFillColor(...theme.primary)
    doc.rect(0, 0, PAGE_W, PAGE_H * 0.42, 'F')

    // Decorative circles
    doc.setFillColor(...theme.dark)
    doc.circle(PAGE_W - 20, 30, 40, 'F')
    doc.setFillColor(...theme.primary)
    doc.circle(PAGE_W - 20, 30, 34, 'F')

    // Logo / company image
    if (data.images?.logoImage) {
      embedImage(doc, data.images.logoImage, MR - 45, 14, 35, 35)
    }

    // Report type tag
    doc.setFillColor(...WHITE)
    doc.rect(ML, 18, 52, 8, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...theme.primary)
    doc.text('VSME ESG REPORT', ML + 26, 23.5, { align: 'center' })

    // Titles
    doc.setTextColor(...WHITE)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(data.companyName || 'Company Name', ML, 48)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${data.sector || 'Organisation'} · ${data.country || ''}`, ML, 57)

    doc.setFontSize(10)
    doc.text(`Reporting Year ${data.reportingYear || new Date().getFullYear()}`, ML, 65)
    if (data.reportingPeriodStart && data.reportingPeriodEnd) {
      doc.text(`${data.reportingPeriodStart} – ${data.reportingPeriodEnd}`, ML, 73)
    }

    // White content area
    doc.setTextColor(...DARK)
    const aboutY = PAGE_H * 0.42 + 16

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('About This Report', ML, aboutY)
    doc.setDrawColor(...theme.light)
    doc.setLineWidth(0.5)
    doc.line(ML, aboutY + 3, MR, aboutY + 3)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    const aboutText = `This report has been prepared in accordance with the VSME (Voluntary framework for SME ESG disclosure) `
      + `Basic Module (B1–B11). It covers environmental, social and governance information for the reporting period `
      + `${data.reportingPeriodStart || 'as stated'} to ${data.reportingPeriodEnd || data.reportingYear}.`
    const aLines = doc.splitTextToSize(aboutText, CW)
    let ay = aboutY + 12
    aLines.forEach(l => { doc.text(l, ML, ay); ay += 6 })

    if (data.companyDescription) {
      ay += 4
      const desc = stripHtml(data.companyDescription)
      const dLines = doc.splitTextToSize(desc, CW)
      dLines.slice(0, 6).forEach(l => { doc.text(l, ML, ay); ay += 6 })
    }

    // Info grid at bottom
    const gridY = PAGE_H - 52
    doc.setFillColor(...theme.light)
    doc.rect(ML, gridY, CW, 34, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...theme.primary)
    const cols = [
      ['Company', data.companyName],
      ['Registration', data.registrationNumber || '—'],
      ['Employees', data.employeeCount || '—'],
      ['Currency', data.currency],
    ]
    cols.forEach(([lbl, val], i) => {
      const cx = ML + 4 + i * (CW / 4)
      doc.setTextColor(...theme.primary)
      doc.setFont('helvetica', 'bold')
      doc.text(lbl, cx, gridY + 9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(String(val || '—'), cx, gridY + 17)
    })

    doc.setTextColor(...MID)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    if (data.contactName) doc.text(`Contact: ${data.contactName}${data.contactEmail ? '  ·  ' + data.contactEmail : ''}`, ML + 4, gridY + 28)

    // Footer
    doc.setFillColor(...theme.primary)
    doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(7.5)
    doc.text('Generated with VSME ESG Report Builder', ML, PAGE_H - 5)
    doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), MR, PAGE_H - 5, { align: 'right' })

  } else {
    // Elegant: white with left accent stripe
    doc.setFillColor(...theme.primary)
    doc.rect(0, 0, 10, PAGE_H, 'F')

    // Company image top right
    if (data.images?.logoImage) {
      embedImage(doc, data.images.logoImage, MR - 50, 20, 44, 44)
    }

    // Tag
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...theme.primary)
    doc.text('VSME ESG — BASIC MODULE', 20, 36)

    // Title
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    const nameLines = doc.splitTextToSize(data.companyName || 'Company Name', CW - 55)
    let ny = 52
    nameLines.forEach(l => { doc.text(l, 20, ny); ny += 12 })

    // Divider
    doc.setDrawColor(...theme.primary)
    doc.setLineWidth(1.5)
    doc.line(20, ny + 2, 80, ny + 2)
    doc.setLineWidth(0.2)
    ny += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    doc.text(`Sustainability Report ${data.reportingYear || ''}`, 20, ny)
    ny += 8
    if (data.sector) { doc.setFontSize(10); doc.text(data.sector, 20, ny); ny += 7 }
    if (data.country) { doc.text(data.country, 20, ny); ny += 12 }

    // Description
    if (data.companyDescription) {
      const desc = stripHtml(data.companyDescription)
      const dLines = doc.splitTextToSize(desc, CW - 20)
      doc.setFontSize(9.5)
      doc.setTextColor(...MID)
      dLines.slice(0, 5).forEach(l => { doc.text(l, 20, ny); ny += 6 })
    }

    // Details box
    const bx = 20, by = PAGE_H - 70
    doc.setFillColor(...theme.light)
    doc.rect(bx, by, CW - 10, 44, 'F')
    doc.setFillColor(...theme.primary)
    doc.rect(bx, by, 3, 44, 'F')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('Reporting Period', bx + 8, by + 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    doc.text(`${data.reportingPeriodStart || data.reportingYear || '—'} to ${data.reportingPeriodEnd || '—'}`, bx + 8, by + 18)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('Employees', bx + 8, by + 29)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    doc.text(`${data.employeeCount || '—'} · ${data.legalForm || ''} · ${data.currency || ''}`, bx + 8, by + 37)

    if (data.contactName) {
      doc.text(`Contact: ${data.contactName}${data.contactEmail ? '  ·  ' + data.contactEmail : ''}`, bx + 8, by + 43)
    }

    // Footer
    doc.setDrawColor(...theme.light)
    doc.setLineWidth(0.5)
    doc.line(20, PAGE_H - 18, MR, PAGE_H - 18)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    doc.text('Generated with VSME ESG Report Builder', 20, PAGE_H - 10)
    doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), MR, PAGE_H - 10, { align: 'right' })
  }
}

// ─── Table of Contents ─────────────────────────────────────────────────────────

function drawTOC(doc, theme, pc) {
  const sections = [
    'B1 — General Information', 'B2 — Policies & Commitments',
    'B3 — Energy', 'B4 — GHG Emissions',
    'B5 — Water', 'B6 — Waste',
    'B7 — Own Workforce', 'B8 — Health & Safety',
    'B9 — Pay & Benefits', 'B10 — Social Matters',
    'B11 — Governance',
  ]
  addPageHeader(doc, theme, doc.__companyName, pc.n++)
  addPageFooter(doc, theme)

  let y = 22
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Contents', ML, y); y += 14

  sections.forEach((s, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...theme.light)
      doc.rect(ML, y - 5, CW, 9, 'F')
    }
    doc.setFontSize(9.5)
    doc.setFont('helvetica', i < 2 ? 'normal' : 'normal')
    doc.setTextColor(...DARK)
    doc.text(s, ML + 4, y)
    // dots
    doc.setTextColor(...MID)
    doc.setFontSize(8)
    doc.text('· · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·', ML + 100, y)
    y += 10
  })
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function exportPDF(data, design = {}) {
  const theme = THEME_MAP[design.theme] || THEME_MAP.green
  const imgLayout = design.imageLayout || 'side-right'
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.__companyName = data.companyName || 'Company'
  const pc = { n: 1 }

  // Cover
  drawCover(doc, theme, design, data)

  // TOC
  doc.addPage()
  drawTOC(doc, theme, pc)

  // ── B1 General Info ──
  let y = newPage(doc, theme, data.companyName, pc)
  y = sectionHeader(doc, theme, 'B1', 'General Information', y)

  y = kpiRow(doc, theme, [
    { label: 'Employees', value: data.employeeCount, unit: 'FTE' },
    { label: 'Country', value: data.country, unit: '' },
    { label: 'Reporting Year', value: data.reportingYear, unit: '' },
    { label: 'Currency', value: data.currency, unit: '' },
  ].filter(k => k.value), y)

  const b1rows = [
    { label: 'Company Name', value: data.companyName },
    { label: 'Legal Form', value: data.legalForm },
    { label: 'Registration Number', value: data.registrationNumber },
    { label: 'Sector', value: data.sector },
    { label: 'NACE Code', value: data.naceCode },
    { label: 'Reporting Period', value: `${data.reportingPeriodStart || '—'} to ${data.reportingPeriodEnd || '—'}` },
    { label: 'Contact', value: [data.contactName, data.contactEmail].filter(Boolean).join('  ·  ') },
  ]
  b1rows.forEach((r, i) => { y = tableRow(doc, r.label, r.value, y, i % 2 === 0) })

  if (data.companyDescription) {
    y += 4
    y = subTitle(doc, 'About the Company', y)
    y = narrativeBlock(doc, data.companyDescription, y, CW, MR)
  }

  // ── B2 Policies ──
  y += 8
  if (y > 230) y = newPage(doc, theme, data.companyName, pc)
  y = sectionHeader(doc, theme, 'B2', 'Policies & Commitments', y)

  const policyRows = [
    { label: 'ESG / Sustainability Policy', value: data.hasESGPolicy },
    { label: 'Board ESG Oversight', value: data.hasBoardESGOversight },
    { label: 'Code of Conduct', value: data.hasCodeOfConduct },
    { label: 'Supplier Code of Conduct', value: data.hasSupplierCode },
  ]
  policyRows.forEach((r, i) => { y = tableRow(doc, r.label, r.value, y, i % 2 === 0) })

  const policyNarrative = [data.esgPolicyDescription, data.boardOversightDescription, data.codeOfConductDescription]
    .filter(Boolean).join('<br/><br/>')
  if (policyNarrative) {
    y += 4
    y = subTitle(doc, 'Policy Details', y)
    y = narrativeBlock(doc, policyNarrative, y, CW, MR)
  }

  // ── B3 Energy ──
  y = newPage(doc, theme, data.companyName, pc)
  const totalE = parseFloat(data.totalEnergyConsumption) || 0
  const renew  = parseFloat(data.renewableEnergyConsumption) || 0
  y = contentSection(doc, theme, 'B3', 'Energy', [
    { type: 'kpi', label: 'Total Energy', value: totalE, unit: data.energyUnit },
    { type: 'kpi', label: 'Renewable', value: renew, unit: data.energyUnit },
    { type: 'kpi', label: 'Non-Renewable', value: (totalE - renew).toFixed(2), unit: data.energyUnit },
    ...(totalE > 0 && renew > 0 ? [{ type: 'kpi', label: 'Renewable Share', value: ((renew / totalE) * 100).toFixed(1), unit: '%' }] : []),
    { type: 'row', label: 'Energy Management System', value: data.hasEnergyManagementSystem },
  ], data.energyNarrative, data.images?.energyImage, imgLayout, y, pc)

  // ── B4 GHG ──
  if (y > 220) y = newPage(doc, theme, data.companyName, pc)
  const s1 = parseFloat(data.scope1Emissions) || 0
  const s2 = parseFloat(data.scope2Emissions) || 0
  const s3 = parseFloat(data.scope3Emissions) || 0
  const totalGHG = s1 + s2 + s3
  const emp = parseFloat(data.employeeCount) || 0
  y = contentSection(doc, theme, 'B4', 'GHG Emissions', [
    { type: 'kpi', label: 'Scope 1', value: s1, unit: data.ghgUnit },
    { type: 'kpi', label: 'Scope 2', value: s2, unit: data.ghgUnit },
    ...(s3 > 0 ? [{ type: 'kpi', label: 'Scope 3', value: s3, unit: data.ghgUnit }] : []),
    { type: 'kpi', label: 'Total GHG', value: totalGHG.toFixed(2), unit: data.ghgUnit },
    ...(emp > 0 && totalGHG > 0 ? [{ type: 'kpi', label: 'GHG / Employee', value: (totalGHG / emp).toFixed(2), unit: `${data.ghgUnit}/emp` }] : []),
    { type: 'row', label: 'Base Year', value: data.ghgBaseYear },
    { type: 'row', label: 'Reduction Target', value: data.ghgReductionTarget },
  ], [data.methodologyDescription, data.ghgNarrative].filter(Boolean).join('<br/>'),
     data.images?.ghgImage, imgLayout, y, pc)

  // ── B5 Water ──
  y = newPage(doc, theme, data.companyName, pc)
  const tw = parseFloat(data.totalWaterWithdrawal) || 0
  const wr = parseFloat(data.waterRecycled) || 0
  y = contentSection(doc, theme, 'B5', 'Water', [
    { type: 'kpi', label: 'Total Withdrawal', value: tw, unit: data.waterUnit },
    { type: 'kpi', label: 'Recycled', value: wr, unit: data.waterUnit },
    ...(tw > 0 && wr > 0 ? [{ type: 'kpi', label: 'Recycling Rate', value: ((wr/tw)*100).toFixed(1), unit: '%' }] : []),
    { type: 'row', label: 'From Stressed Areas', value: `${data.waterFromStressedAreas || '—'} ${data.waterUnit}` },
    { type: 'row', label: 'Water Policy', value: data.hasWaterPolicy },
  ], data.waterNarrative, null, imgLayout, y, pc)

  // ── B6 Waste ──
  if (y > 200) y = newPage(doc, theme, data.companyName, pc)
  const wUnit      = data.wasteUnit || 'tonnes'
  const wasteTypes = data.wasteTypes || []
  const totalW     = wasteTypes.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const hazW       = wasteTypes.filter(e => e.hazardous).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const recW       = wasteTypes.reduce((s, e) => s + (parseFloat(e.recycled) || 0), 0)
  const wasteTypeRows = wasteTypes.map(e => {
    const name = e.typeKey === 'Other (specify)' ? (e.customName || 'Other') : (e.typeKey || 'Unknown')
    const haz  = e.hazardous ? ' ⚠' : ''
    const rec  = e.recycled  ? ` (recycled: ${parseFloat(e.recycled).toFixed(2)})` : ''
    return { type: 'row', label: name + haz, value: `${parseFloat(e.amount || 0).toFixed(2)} ${wUnit}${rec}` }
  })
  y = contentSection(doc, theme, 'B6', 'Waste', [
    ...(totalW > 0 ? [{ type: 'kpi', label: 'Total Waste', value: totalW.toFixed(2), unit: wUnit }] : []),
    ...(hazW > 0   ? [{ type: 'kpi', label: 'Hazardous',   value: hazW.toFixed(2),   unit: wUnit }] : []),
    ...(totalW > 0 && recW > 0 ? [{ type: 'kpi', label: 'Recycling Rate', value: ((recW / totalW) * 100).toFixed(1), unit: '%' }] : []),
    ...wasteTypeRows,
  ], data.wasteNarrative, null, imgLayout, y, pc)

  // ── B7 Workforce ──
  y = newPage(doc, theme, data.companyName, pc)
  const totEmp  = parseFloat(data.totalEmployees) || 0
  const femEmp  = parseFloat(data.femaleEmployees) || 0
  const permEmp = parseFloat(data.permanentEmployees) || 0
  y = contentSection(doc, theme, 'B7', 'Own Workforce', [
    { type: 'kpi', label: 'Total Employees', value: data.totalEmployees, unit: 'headcount' },
    { type: 'kpi', label: 'Permanent', value: data.permanentEmployees, unit: totEmp > 0 && permEmp > 0 ? `${((permEmp/totEmp)*100).toFixed(0)}%` : '' },
    { type: 'kpi', label: 'Female', value: femEmp || '—', unit: totEmp > 0 && femEmp > 0 ? `${((femEmp/totEmp)*100).toFixed(0)}%` : '' },
    { type: 'row', label: 'Full-Time / Part-Time', value: `${data.fullTimeEmployees || '—'} / ${data.partTimeEmployees || '—'}` },
    { type: 'row', label: 'Age <30 / 30–50 / >50', value: `${data.employeesUnder30 || '—'} / ${data.employees30to50 || '—'} / ${data.employeesOver50 || '—'}` },
    { type: 'row', label: 'New Hires', value: data.newHires },
    { type: 'row', label: 'Employee Turnover', value: data.employeeTurnover },
  ], data.workforceNarrative, data.images?.workforceImage, imgLayout, y, pc)

  // ── B8 Safety ──
  if (y > 200) y = newPage(doc, theme, data.companyName, pc)
  const inj = parseFloat(data.workRelatedInjuries) || 0
  const ld  = parseFloat(data.lostDays) || 0
  const hrs = (parseFloat(data.totalEmployees) || 0) * 2000
  y = contentSection(doc, theme, 'B8', 'Health & Safety', [
    { type: 'kpi', label: 'Injuries', value: data.workRelatedInjuries, unit: 'cases' },
    { type: 'kpi', label: 'Fatalities', value: data.workRelatedFatalities || '0', unit: 'cases' },
    { type: 'kpi', label: 'Lost Days', value: data.lostDays, unit: 'days' },
    ...(hrs > 0 && inj > 0 ? [{ type: 'kpi', label: 'Freq. Rate', value: ((inj*1e6)/hrs).toFixed(2), unit: '/M hrs' }] : []),
    { type: 'row', label: 'OHS Management System', value: data.hasOHSManagementSystem },
    { type: 'row', label: 'OHS Certification', value: data.ohsCertification },
  ], data.safetyNarrative, null, imgLayout, y, pc)

  // ── B9 Pay ──
  y = newPage(doc, theme, data.companyName, pc)
  const mAvg = parseFloat(data.maleAvgSalary) || 0
  const fAvg = parseFloat(data.femaleAvgSalary) || 0
  const gap  = mAvg > 0 && fAvg > 0 ? (((mAvg - fAvg) / mAvg) * 100).toFixed(1) : null
  y = contentSection(doc, theme, 'B9', 'Pay & Benefits', [
    ...(mAvg > 0 ? [{ type: 'kpi', label: 'Male Avg. Salary', value: mAvg.toLocaleString(), unit: data.currency }] : []),
    ...(fAvg > 0 ? [{ type: 'kpi', label: 'Female Avg. Salary', value: fAvg.toLocaleString(), unit: data.currency }] : []),
    ...(gap !== null ? [{ type: 'kpi', label: 'Gender Pay Gap', value: gap, unit: '%' }] : []),
    { type: 'row', label: 'Minimum Wage Compliance', value: data.minimumWageCompliance },
    { type: 'row', label: 'Living Wage Policy', value: data.livingWagePolicy },
  ], [data.benefitsDescription, data.payNarrative].filter(Boolean).join('<br/>'),
     null, imgLayout, y, pc)

  // ── B10 Social ──
  if (y > 200) y = newPage(doc, theme, data.companyName, pc)
  y = contentSection(doc, theme, 'B10', 'Social Matters', [
    ...(data.avgTrainingHours ? [{ type: 'kpi', label: 'Avg Training Hours', value: data.avgTrainingHours, unit: 'hrs/employee' }] : []),
    { type: 'row', label: 'Anti-Discrimination Policy', value: data.hasAntiDiscriminationPolicy },
    { type: 'row', label: 'Training Investment', value: data.trainingInvestment ? `${data.trainingInvestment} ${data.currency}` : '—' },
  ], [data.communityEngagement, data.socialNarrative].filter(Boolean).join('<br/>'),
     null, imgLayout, y, pc)

  // ── B11 Governance ──
  if (y > 200) y = newPage(doc, theme, data.companyName, pc)
  const bsz  = parseFloat(data.boardSize) || 0
  const bind = parseFloat(data.boardIndependentMembers) || 0
  y = contentSection(doc, theme, 'B11', 'Governance', [
    ...(data.boardSize ? [{ type: 'kpi', label: 'Board Size', value: data.boardSize, unit: 'members' }] : []),
    ...(bsz > 0 && bind > 0 ? [{ type: 'kpi', label: 'Independent', value: `${((bind/bsz)*100).toFixed(0)}%`, unit: 'of board' }] : []),
    ...(data.boardFemaleMembersPercent ? [{ type: 'kpi', label: 'Female Board', value: data.boardFemaleMembersPercent, unit: '%' }] : []),
    { type: 'row', label: 'Anti-Corruption Policy', value: data.hasAntiCorruptionPolicy },
    { type: 'row', label: 'Whistleblower Mechanism', value: data.whistleblowerMechanism },
    { type: 'row', label: 'Data Privacy Policy', value: data.dataPrivacyPolicy },
  ], [data.taxTransparency, data.governanceNarrative].filter(Boolean).join('<br/>'),
     null, imgLayout, y, pc)

  const filename = `VSME_ESG_${(data.companyName || 'Report').replace(/\s+/g, '_')}_${data.reportingYear}.pdf`
  doc.save(filename)
}
