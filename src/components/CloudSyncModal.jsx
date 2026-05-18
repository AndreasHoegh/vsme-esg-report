import React, { useState, useEffect } from 'react'
import './CloudSyncModal.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function CloudSyncModal({ data, onLoad, onClose, hook }) {
  const { saveReport, listSaves, loadReport, deleteSave, saving, loading, saves, error } = hook
  const [tab, setTab] = useState('save')
  const [saveName, setSaveName] = useState(data.companyName || '')
  const [saveOk, setSaveOk] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [loadConfirm, setLoadConfirm] = useState(null) // save row pending load

  useEffect(() => {
    if (tab === 'load') listSaves()
  }, [tab, listSaves])

  async function handleSave() {
    const ok = await saveReport(data, saveName || 'ESG Report')
    if (ok) {
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    }
  }

  async function confirmLoad(save) {
    setLoadConfirm(save)
  }

  async function handleLoad(id) {
    setLoadConfirm(null)
    const reportData = await loadReport(id)
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
              <p className="csm-hint">
                Save a snapshot of your current form data to the cloud. You can load it later from any browser on this device.
              </p>
              <label className="csm-label">Save name</label>
              <input
                className="csm-input"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. NordGreen ESG 2024"
                maxLength={80}
              />
              <button
                className="csm-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : saveOk ? '✓ Saved!' : '☁ Save to Cloud'}
              </button>
              {saveOk && (
                <p className="csm-success">Report saved successfully. Switch to "Saved Reports" to manage your saves.</p>
              )}
            </div>
          )}

          {tab === 'load' && (
            <div className="csm-load-panel">
              {loadConfirm && (
                <div className="csm-load-warning">
                  <div className="csm-load-warning-icon">⚠</div>
                  <div className="csm-load-warning-text">
                    <strong>Unsaved changes will be lost</strong>
                    <p>Loading <em>"{loadConfirm.name}"</em> will replace your current form data. Make sure you've saved your current work first.</p>
                  </div>
                  <div className="csm-load-warning-actions">
                    <button className="csm-btn-save-first" onClick={() => { setTab('save'); setLoadConfirm(null) }}>
                      Save first
                    </button>
                    <button className="csm-btn-load-confirm" onClick={() => handleLoad(loadConfirm.id)} disabled={loading}>
                      {loading ? 'Loading…' : 'Load anyway'}
                    </button>
                    <button className="csm-btn-ghost" onClick={() => setLoadConfirm(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {loading && !loadConfirm && <div className="csm-spinner">Loading…</div>}
              {!loading && saves.length === 0 && (
                <div className="csm-empty">
                  <span className="csm-empty-icon">☁</span>
                  <p>No cloud saves yet.</p>
                  <p>Switch to "Save Current" to save your first report.</p>
                </div>
              )}
              {saves.map(s => (
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
                        <button className="csm-btn-load" onClick={() => confirmLoad(s)} disabled={loading || !!loadConfirm}>
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
