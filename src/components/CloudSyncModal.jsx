import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import './CloudSyncModal.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function CloudSyncModal({ data, onLoad, onClose, hook, onSignIn, initialTab = 'save' }) {
  const { saveReport, listSaves, loadReport, deleteSave, saving, loading, saves, error } = hook
  const { user } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [saveName, setSaveName] = useState(data.companyName || '')
  const [saveOk, setSaveOk] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [loadConfirm, setLoadConfirm] = useState(null)

  useEffect(() => {
    if (tab === 'load') listSaves()
  }, [tab, listSaves])

  useEffect(() => {
    if (user && tab === 'load') listSaves()
  }, [user])

  async function handleSave() {
    const ok = await saveReport(data, saveName || 'ESG Report')
    if (ok) {
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    }
  }

  async function handleLoad(id, withCanvas) {
    setLoadConfirm(null)
    const reportData = await loadReport(id, withCanvas)
    if (reportData) {
      onLoad(reportData)
      onClose()
    }
  }

  return (
    <div className="csm-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="csm">
        <div className="csm-header">
          <div className="csm-title">
            <span className="csm-icon">☁</span>
            Cloud Saves
          </div>
          <button className="csm-close" onClick={onClose}>✕</button>
        </div>

        {/* Auth status bar */}
        {user ? (
          <div className="csm-auth-bar csm-auth-signed-in">
            <span className="csm-auth-info">
              <span className="csm-auth-dot" />
              {user.email}
            </span>
          </div>
        ) : (
          <div className="csm-auth-bar csm-auth-anonymous">
            <span className="csm-auth-anon-label">Sign in to save and load reports</span>
            <button className="csm-btn-signin" onClick={onSignIn}>Sign in</button>
          </div>
        )}

        <div className="csm-tabs">
          <button className={`csm-tab${tab === 'save' ? ' active' : ''}`} onClick={() => setTab('save')}>
            Save Current
          </button>
          <button className={`csm-tab${tab === 'load' ? ' active' : ''}`} onClick={() => setTab('load')}>
            Saved Reports
          </button>
        </div>

        <div className="csm-body">
          {error && <div className="csm-error">⚠ {error}</div>}

          {tab === 'save' && (
            <div className="csm-save-panel">
              {!user ? (
                <div className="csm-signin-prompt">
                  <p>You need to be signed in to save reports.</p>
                  <button className="csm-btn-save" onClick={onSignIn}>Sign in to continue</button>
                </div>
              ) : (
              <>
              <p className="csm-hint">Save a snapshot of your current form data and canvas layout. It will be available on any device when signed in.</p>
              <label className="csm-label">Save name</label>
              <input
                className="csm-input"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. NordGreen ESG 2024"
                maxLength={80}
              />
              <button className="csm-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : saveOk ? '✓ Saved!' : '☁ Save to Cloud'}
              </button>
              {saveOk && (
                <p className="csm-success">Report saved. Switch to "Saved Reports" to manage your saves.</p>
              )}
              </>
              )}
            </div>
          )}

          {tab === 'load' && (
            <div className="csm-load-panel">
              {!user && (
                <div className="csm-signin-prompt">
                  <p>You need to be signed in to load saved reports.</p>
                  <button className="csm-btn-save" onClick={onSignIn}>Sign in to continue</button>
                </div>
              )}
              {user && loadConfirm && (
                <div className="csm-load-warning">
                  <div className="csm-load-warning-icon">⚠</div>
                  <div className="csm-load-warning-text">
                    <strong>Load "{loadConfirm.name}"?</strong>
                    <p>Choose how to open this report. Current unsaved changes will be lost.</p>
                  </div>
                  <div className="csm-load-mode-btns">
                    <button className="csm-btn-load-canvas" onClick={() => handleLoad(loadConfirm.id, true)} disabled={loading}>
                      {loading ? 'Loading…' : '🎨 With saved canvas layout'}
                    </button>
                    <button className="csm-btn-load-fresh" onClick={() => handleLoad(loadConfirm.id, false)} disabled={loading}>
                      {loading ? 'Loading…' : '✨ Start fresh (regenerate)'}
                    </button>
                  </div>
                  <div className="csm-load-warning-actions">
                    <button className="csm-btn-save-first" onClick={() => { setTab('save'); setLoadConfirm(null) }}>
                      Save first
                    </button>
                    <button className="csm-btn-ghost" onClick={() => setLoadConfirm(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {user && loading && !loadConfirm && <div className="csm-spinner">Loading…</div>}
              {user && !loading && saves.length === 0 && (
                <div className="csm-empty">
                  <span className="csm-empty-icon">☁</span>
                  <p>No cloud saves yet.</p>
                  <p>Switch to "Save Current" to save your first report.</p>
                </div>
              )}
              {user && saves.map(s => (
                <div key={s.id} className={`csm-save-row${loadConfirm?.id === s.id ? ' csm-save-row--pending' : ''}`}>
                  <div className="csm-save-info">
                    <span className="csm-save-name">{s.name}</span>
                    <span className="csm-save-date">{formatDate(s.updated_at)}</span>
                  </div>
                  <div className="csm-save-actions">
                    {deleteConfirm === s.id ? (
                      <>
                        <button className="csm-btn-danger" onClick={() => { deleteSave(s.id); setDeleteConfirm(null) }}>Delete</button>
                        <button className="csm-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="csm-btn-load" onClick={() => setLoadConfirm(s)} disabled={loading || !!loadConfirm}>
                          Load
                        </button>
                        <button className="csm-btn-ghost csm-btn-del" onClick={() => setDeleteConfirm(s.id)} title="Delete" disabled={!!loadConfirm}>
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
