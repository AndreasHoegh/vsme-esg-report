import React, { useState } from 'react'
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
import { useCloudSync } from './hooks/useCloudSync'
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

function AppInner() {
  const { data, update, currentStep, setCurrentStep, completedSteps, clearDraft, loadDemo, lastSaved, completionPercent } = useForm()
  const [showEditor, setShowEditor] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDemoConfirm, setShowDemoConfirm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCloud, setShowCloud] = useState(false)
  const cloudSync = useCloudSync()

  function handleCloudLoad(reportData) {
    update(reportData)
    setCurrentStep(0)
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

  if (showEditor) {
    return <CanvasEditor data={data} onClose={() => setShowEditor(false)} />
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
                <span className="brand-sub">Basic Module (B1–B11)</span>
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
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  className={`step-nav-item${i === currentStep ? ' step-nav-item--active' : ''}${completedSteps.includes(i) ? ' step-nav-item--done' : ''}`}
                  onClick={() => { setCurrentStep(i); setSidebarOpen(false); window.scrollTo({ top: 0 }) }}
                >
                  <span className="step-nav-badge">{s.id}</span>
                  <span className="step-nav-label">{s.label}</span>
                  {completedSteps.includes(i) && <span className="step-nav-check">✓</span>}
                </button>
              ))}
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
                    <button className="btn-demo-confirm" onClick={() => { loadDemo(); setShowDemoConfirm(false); setSidebarOpen(false) }}>Load</button>
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
                    <button className="btn-danger" onClick={() => { clearDraft(); setShowClearConfirm(false) }}>Delete</button>
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
                  📄 Export Full Report
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {showCloud && (
        <CloudSyncModal
          data={data}
          onLoad={handleCloudLoad}
          onClose={() => setShowCloud(false)}
          hook={cloudSync}
        />
      )}
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
