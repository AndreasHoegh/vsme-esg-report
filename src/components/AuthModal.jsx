import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import './AuthModal.css'

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [signUpDone, setSignUpDone] = useState(false)

  function switchMode(m) {
    setMode(m)
    setError(null)
    setSignUpDone(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true)
    setError(null)
    if (mode === 'signin') {
      const { error: err } = await signIn(email.trim(), password)
      if (err) {
        setError(friendlyError(err.message))
        setBusy(false)
      } else {
        onClose()
      }
    } else {
      const { error: err } = await signUp(email.trim(), password)
      setBusy(false)
      if (err) setError(friendlyError(err.message))
      else setSignUpDone(true)
    }
  }

  function friendlyError(msg) {
    if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first, then sign in.'
    if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in.'
    if (msg.includes('Password should be')) return 'Password must be at least 6 characters.'
    return msg
  }

  return (
    <div className="am-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="am">
        <button className="am-close" onClick={onClose}>✕</button>

        <div className="am-brand">
          <span className="am-brand-icon">🌱</span>
          <span className="am-brand-name">VSME ESG Builder</span>
        </div>

        {signUpDone ? (
          <div className="am-confirm">
            <div className="am-confirm-icon">✉</div>
            <h2 className="am-confirm-title">Check your inbox</h2>
            <p className="am-confirm-text">
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it, then come back and sign in.
            </p>
            <button className="am-btn-primary" onClick={() => switchMode('signin')}>
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="am-tabs">
              <button className={`am-tab${mode === 'signin' ? ' active' : ''}`} onClick={() => switchMode('signin')}>
                Sign in
              </button>
              <button className={`am-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>
                Create account
              </button>
            </div>

            <form className="am-form" onSubmit={handleSubmit}>
              <div className="am-field">
                <label className="am-label">Email</label>
                <input
                  className="am-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                />
              </div>
              <div className="am-field">
                <label className="am-label">Password</label>
                <input
                  className="am-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
                  required
                />
              </div>
              {error && <p className="am-error">{error}</p>}
              <button className="am-btn-primary" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="am-switch">
              {mode === 'signin' ? (
                <>Don't have an account? <button className="am-link" onClick={() => switchMode('signup')}>Create one</button></>
              ) : (
                <>Already have an account? <button className="am-link" onClick={() => switchMode('signin')}>Sign in</button></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
