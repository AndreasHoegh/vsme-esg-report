import React, { useState, useRef, useEffect } from 'react'
import { FormProvider, useForm } from './context/FormContext'
import Step1_GeneralInfo from './components/steps/Step1_GeneralInfo'
import Step2_Policies from './components/steps/Step2_Policies'
import Step3_Energy from './components/steps/Step3_Energy'
import Step4_GHG from './components/steps/Step4_GHG'
import Step5_Water from './components/steps/Step5_Water'
import Step6_Waste from './components/steps/Step6_Waste'
import Step7_Workforce from './components/steps/Step7_Workforce'
import Step8_Safety from './components/steps/Step8_Safety'
import Step9_Pay from './components/steps/Step9_Pay'
import Step10_Social from './components/steps/Step10_Social'
import Step11_Governance from './components/steps/Step11_Governance'
import CanvasEditor from './components/CanvasEditor/CanvasEditor'
import CloudSyncModal from './components/CloudSyncModal'
import AuthModal from './components/AuthModal'
import { useCloudSync } from './hooks/useCloudSync'
import { useAuth } from './hooks/useAuth'
import './App.css'

const STEPS = [
  { id: 'B1', label: 'General Info', component: Step1_GeneralInfo },
  { id: 'B2', label: 'Policies', component: Step2_Policies },
  { id: 'B3', label: 'Energy & GHG', component: Step3_Energy },
  { id: 'B4', label: 'Pollution', component: Step4_GHG },
  { id: 'B5', label: 'Biodiversity', component: Step5_Water },
  { id: 'B6', label: 'Water', component: Step6_Waste },
  { id: 'B7', label: 'Waste & Circular', component: Step7_Workforce },
  { id: 'B8', label: 'Workforce', component: Step8_Safety },
  { id: 'B9', label: 'Health & Safety', component: Step9_Pay },
  { id: 'B10', label: 'Pay & Training', component: Step10_Social },
  { id: 'B11', label: 'Corp. Conduct', component: Step11_Governance },
]

// Sections that should show a warning when excluded (social & governance disclosures)
const MANDATORY_WARN = new Set(['B8', 'B9', 'B11'])

function AppInner() {
  const { data, update, currentStep, setCurrentStep, completedSteps, clearDraft, loadDemo, lastSaved, completionPercent } = useForm()
  const [showEditor, setShowEditor] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDemoConfirm, setShowDemoConfirm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCloud, setShowCloud] = useState(false)
  const [showCloudTab, setShowCloudTab] = useState('save')
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNewReportConfirm, setShowNewReportConfirm] = useState(false)
  const [pendingExclude, setPendingExclude] = useState(null)
  const newReportRef = useRef(null)
  const [hasCanvasDraft, setHasCanvasDraft] = useState(() => !!localStorage.getItem('vsme_canvas_draft'))
  const [pendingCanvasDraft, setPendingCanvasDraft] = useState(null)
  const userMenuRef = useRef(null)
  const cloudSync = useCloudSync()
  const { user, signOut } = useAuth()

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
      if (newReportRef.current && !newReportRef.current.contains(e.target)) {
        setShowNewReportConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // When the user signs in with no local canvas draft, silently pull the canvas draft
  // from their most recent cloud save so "Continue editing" works immediately on any device.
  const didAutoLoadCanvasRef = useRef(false)
  useEffect(() => {
    if (!user || hasCanvasDraft || didAutoLoadCanvasRef.current) return
    didAutoLoadCanvasRef.current = true
    cloudSync.loadLatestCanvasDraft().then(draft => {
      if (draft) {
        try { localStorage.setItem('vsme_canvas_draft', JSON.stringify(draft)) } catch {}
        setPendingCanvasDraft(draft)
        setHasCanvasDraft(true)
      }
    })
  }, [user]) // eslint-disable-line

  function handleCloudLoad(reportData, canvasDraft = null) {
    update(reportData)
    setCurrentStep(0)
    if (canvasDraft) {
      setPendingCanvasDraft(canvasDraft)
      setHasCanvasDraft(true)
    } else {
      setPendingCanvasDraft(null)
      setHasCanvasDraft(!!localStorage.getItem('vsme_canvas_draft'))
    }
  }

  const StepComponent = STEPS[currentStep].component

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleToggleExclusion(stepId) {
    const excluded = data.excludedSections || []
    if (excluded.includes(stepId)) {
      update({ excludedSections: excluded.filter(s => s !== stepId) })
    } else if (MANDATORY_WARN.has(stepId)) {
      setPendingExclude(stepId)
    } else {
      update({ excludedSections: [...excluded, stepId] })
    }
  }

  function confirmExclude() {
    if (!pendingExclude) return
    const excluded = data.excludedSections || []
    update({ excludedSections: [...excluded, pendingExclude] })
    setPendingExclude(null)
  }

  if (showEditor) {
    return <CanvasEditor data={data} pendingCanvasDraft={pendingCanvasDraft} onClose={() => {
      setShowEditor(false)
      setPendingCanvasDraft(null)
      setHasCanvasDraft(!!localStorage.getItem('vsme_canvas_draft'))
    }} />
  }

  return (
    <div className="app">

      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
              ☰
            </button>
            <div className="brand">
              <span className="brand-icon">🌱</span>
              <div>
                <span className="brand-name">VSME ESG Builder</span>
                <span className="brand-sub">
                  {data.reportingModule === 'comprehensive'
                    ? 'Basic + Comprehensive (B1–B11, C1–C9)'
                    : 'Basic Module (B1–B11)'}
                </span>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            {lastSaved && (
              <span className="save-indicator">
                ✓ Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <div className="progress-pill">
              <span>{completionPercent}%</span>
              <div className="progress-mini">
                <div className="progress-mini-bar" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
            <button className="btn-cloud" onClick={() => setShowCloud(true)} title="Cloud saves">
              ☁ Cloud
            </button>
            {user ? (
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button
                  className="btn-avatar"
                  onClick={() => setShowUserMenu(o => !o)}
                  title={user.email}
                >
                  {user.email[0].toUpperCase()}
                </button>
                {showUserMenu && (
                  <div className="user-menu">
                    <div className="user-menu-email">{user.email}</div>
                    <button className="user-menu-item" onClick={() => { setShowCloud(true); setShowUserMenu(false) }}>
                      ☁ Cloud saves
                    </button>
                    <button className="user-menu-item user-menu-item--danger" onClick={() => { signOut(); setShowUserMenu(false) }}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn-signin-top" onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            )}
            <div className="new-report-wrap" ref={newReportRef}>
              <button className="btn-new-report" onClick={() => setShowNewReportConfirm(o => !o)}>
                + New Report
              </button>
              {showNewReportConfirm && (
                <div className="new-report-dropdown">
                  <p>Start a new blank report? All current data will be cleared.</p>
                  <div className="new-report-actions">
                    <button className="btn-new-report-confirm" onClick={() => {
                      clearDraft(); setHasCanvasDraft(false); setPendingCanvasDraft(null); setShowNewReportConfirm(false)
                    }}>Clear &amp; start new</button>
                    <button className="btn-ghost-sm" onClick={() => setShowNewReportConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
            {hasCanvasDraft && (
              <button className="btn-continue-canvas" onClick={() => setShowEditor(true)} title="Continue editing your saved canvas layout">
                ✏ Continue editing
              </button>
            )}
            <button className="btn-export" onClick={() => setShowEditor(true)}>
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${completionPercent}%` }} />
        </div>
      </header>

      <div className="layout">
        {/* Sidebar */}
        <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
          <div className="sidebar-inner">
            <div className="sidebar-head">
              <span>Report Sections</span>
              <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav className="step-nav">
              {STEPS.map((s, i) => {
                const isExcluded = (data.excludedSections || []).includes(s.id)
                return (
                  <button
                    key={s.id}
                    className={`step-nav-item${i === currentStep ? ' step-nav-item--active' : ''}${completedSteps.includes(i) && !isExcluded ? ' step-nav-item--done' : ''}${isExcluded ? ' step-nav-item--na' : ''}`}
                    onClick={() => { setCurrentStep(i); setSidebarOpen(false); window.scrollTo({ top: 0 }) }}
                  >
                    <span className="step-nav-badge">{s.id}</span>
                    <span className="step-nav-label">{s.label}</span>
                    {isExcluded
                      ? <span className="step-nav-na">N/A</span>
                      : completedSteps.includes(i) && <span className="step-nav-check">✓</span>
                    }
                  </button>
                )
              })}
            </nav>

            <div className="sidebar-footer">
              {!showDemoConfirm ? (
                <button className="btn-demo" onClick={() => { setShowClearConfirm(false); setShowDemoConfirm(true) }}>
                  Load Example Data
                </button>
              ) : (
                <div className="clear-confirm">
                  <p>Replace current data with a pre-filled example report?</p>
                  <div className="clear-confirm-btns">
                    <button className="btn-demo-confirm" onClick={() => { loadDemo(); setHasCanvasDraft(false); setPendingCanvasDraft(null); setShowDemoConfirm(false); setSidebarOpen(false) }}>Load</button>
                    <button className="btn-ghost" onClick={() => setShowDemoConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              {!showClearConfirm ? (
                <button className="btn-clear" onClick={() => { setShowDemoConfirm(false); setShowClearConfirm(true) }}>
                  🗑 Clear Draft
                </button>
              ) : (
                <div className="clear-confirm">
                  <p>Delete all saved data?</p>
                  <div className="clear-confirm-btns">
                    <button className="btn-danger" onClick={() => { clearDraft(); setHasCanvasDraft(false); setPendingCanvasDraft(null); setShowClearConfirm(false) }}>Delete</button>
                    <button className="btn-ghost" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="main">
          <div className="main-inner">
            {currentStep > 0 && (() => {
              const stepId = STEPS[currentStep].id
              const isExcluded = (data.excludedSections || []).includes(stepId)
              return (
                <div className={`not-relevant-bar${isExcluded ? ' not-relevant-bar--active' : ''}`}>
                  {isExcluded ? (
                    <>
                      <span className="not-relevant-bar__msg">
                        <strong>Not included</strong> — this section is marked as not relevant and will be skipped in the report.
                      </span>
                      <button className="not-relevant-bar__btn not-relevant-bar__btn--include" onClick={() => handleToggleExclusion(stepId)}>
                        Include in report
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="not-relevant-bar__msg">Not applicable to your company?</span>
                      <button className="not-relevant-bar__btn" onClick={() => handleToggleExclusion(stepId)}>
                        Mark as not relevant
                      </button>
                    </>
                  )}
                </div>
              )
            })()}
            <StepComponent />

            <div className="step-actions">
              <button className="btn-ghost" onClick={goPrev} disabled={currentStep === 0}>
                ← Previous
              </button>
              <div className="step-counter">
                Step {currentStep + 1} of {STEPS.length}
              </div>
              {currentStep < STEPS.length - 1 ? (
                <button className="btn-primary" onClick={goNext}>
                  Next: {STEPS[currentStep + 1].label} →
                </button>
              ) : (
                <button className="btn-export-lg" onClick={() => setShowEditor(true)}>
                  {hasCanvasDraft ? '✏ Continue editing & Export' : '📄 Open Report Editor'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {pendingExclude && (
        <div className="na-confirm-overlay" onClick={() => setPendingExclude(null)}>
          <div className="na-confirm" onClick={e => e.stopPropagation()}>
            <h3>Mark {pendingExclude} as not relevant?</h3>
            <p>
              <strong>{STEPS.find(s => s.id === pendingExclude)?.label}</strong> is a commonly required VSME disclosure.
              Excluding it means this section will not appear in the exported report.
            </p>
            <div className="na-confirm-actions">
              <button className="btn-na-confirm" onClick={confirmExclude}>Exclude from report</button>
              <button className="btn-ghost-sm" onClick={() => setPendingExclude(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCloud && (
        <CloudSyncModal
          data={data}
          onLoad={handleCloudLoad}
          onClose={() => setShowCloud(false)}
          hook={cloudSync}
          initialTab={showCloudTab}
          onSignIn={() => { setShowCloud(false); setShowAuth(true) }}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <FormProvider>
      <AppInner />
    </FormProvider>
  )
}
