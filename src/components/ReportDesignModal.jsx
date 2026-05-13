import React, { useState } from 'react'
import './ReportDesignModal.css'

const THEMES = [
  { id: 'green',  label: 'Forest',    color: '#16a34a', light: '#dcfce7', dark: '#14532d' },
  { id: 'blue',   label: 'Ocean',     color: '#2563eb', light: '#dbeafe', dark: '#1e3a8a' },
  { id: 'purple', label: 'Dusk',      color: '#7c3aed', light: '#ede9fe', dark: '#4c1d95' },
  { id: 'slate',  label: 'Minimal',   color: '#334155', light: '#f1f5f9', dark: '#0f172a' },
]

const LAYOUTS = [
  {
    id: 'side-right',
    label: 'Text + Photo',
    sub: 'Text left, photo right',
    preview: 'side-right',
  },
  {
    id: 'image-top',
    label: 'Photo Banner',
    sub: 'Photo above text',
    preview: 'image-top',
  },
  {
    id: 'side-left',
    label: 'Photo + Text',
    sub: 'Photo left, text right',
    preview: 'side-left',
  },
]

const COVERS = [
  {
    id: 'bold',
    label: 'Bold',
    sub: 'Full-colour header',
    preview: 'bold',
  },
  {
    id: 'elegant',
    label: 'Elegant',
    sub: 'Clean with accent stripe',
    preview: 'elegant',
  },
]

function LayoutPreview({ type, themeColor }) {
  const line = <div className="lp-line" />
  const img = <div className="lp-img" style={{ background: themeColor + '99' }}>🖼</div>
  const hdr = <div className="lp-header" style={{ background: themeColor }} />

  if (type === 'side-right') return (
    <div className="lp lp-side-right">
      <div className="lp-hdr-full">{hdr}</div>
      <div className="lp-text-col">{line}{line}{line}{line}</div>
      <div className="lp-img-col">{img}</div>
    </div>
  )
  if (type === 'image-top') return (
    <div className="lp lp-image-top">
      <div className="lp-hdr-full">{hdr}</div>
      <div className="lp-img-wide">{img}</div>
      <div className="lp-text-row">{line}{line}{line}</div>
    </div>
  )
  if (type === 'side-left') return (
    <div className="lp lp-side-left">
      <div className="lp-hdr-full">{hdr}</div>
      <div className="lp-img-col">{img}</div>
      <div className="lp-text-col">{line}{line}{line}{line}</div>
    </div>
  )
  return null
}

function CoverPreview({ type, themeColor }) {
  if (type === 'bold') return (
    <div className="cp cp-bold">
      <div className="cp-top" style={{ background: themeColor }}>
        <div className="cp-title-bar" />
        <div className="cp-sub-bar" />
      </div>
      <div className="cp-bottom">
        <div className="cp-line" />
        <div className="cp-line cp-line-short" />
      </div>
    </div>
  )
  return (
    <div className="cp cp-elegant">
      <div className="cp-stripe" style={{ background: themeColor }} />
      <div className="cp-elegant-body">
        <div className="cp-title-bar" style={{ background: themeColor }} />
        <div className="cp-sub-bar" />
        <div className="cp-line" />
        <div className="cp-line cp-line-short" />
      </div>
    </div>
  )
}

export default function ReportDesignModal({ onExport, onClose, exporting }) {
  const [design, setDesign] = useState({
    theme: 'green',
    imageLayout: 'side-right',
    coverStyle: 'bold',
  })

  const activeTheme = THEMES.find(t => t.id === design.theme)

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="design-modal">
        <div className="design-modal-header">
          <div>
            <h2>Customise Report</h2>
            <p>Choose a look for your exported PDF</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="design-modal-body">

          {/* Theme */}
          <div className="design-section">
            <h3>Colour Theme</h3>
            <div className="theme-grid">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-card${design.theme === t.id ? ' selected' : ''}`}
                  onClick={() => setDesign(d => ({ ...d, theme: t.id }))}
                  style={{ '--tc': t.color, '--tl': t.light }}
                >
                  <div className="theme-swatch" style={{ background: t.color }} />
                  <span className="theme-label">{t.label}</span>
                  {design.theme === t.id && <span className="check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div className="design-section">
            <h3>Image Layout</h3>
            <p className="design-hint">How photos are placed in sections that have an uploaded image</p>
            <div className="layout-grid">
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  type="button"
                  className={`layout-card${design.imageLayout === l.id ? ' selected' : ''}`}
                  onClick={() => setDesign(d => ({ ...d, imageLayout: l.id }))}
                >
                  <LayoutPreview type={l.preview} themeColor={activeTheme.color} />
                  <span className="layout-label">{l.label}</span>
                  <span className="layout-sub">{l.sub}</span>
                  {design.imageLayout === l.id && <span className="check check-corner">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Cover */}
          <div className="design-section">
            <h3>Cover Page Style</h3>
            <div className="cover-grid">
              {COVERS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`cover-card${design.coverStyle === c.id ? ' selected' : ''}`}
                  onClick={() => setDesign(d => ({ ...d, coverStyle: c.id }))}
                >
                  <CoverPreview type={c.preview} themeColor={activeTheme.color} />
                  <span className="cover-label">{c.label}</span>
                  <span className="cover-sub">{c.sub}</span>
                  {design.coverStyle === c.id && <span className="check check-corner">✓</span>}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="design-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-export-modal"
            style={{ background: activeTheme.color }}
            onClick={() => onExport(design)}
            disabled={exporting}
          >
            {exporting ? '⏳ Generating PDF…' : '📄 Export PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
