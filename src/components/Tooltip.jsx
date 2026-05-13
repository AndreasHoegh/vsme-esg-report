import React, { useState } from 'react'
import './Tooltip.css'

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="tooltip-wrap">
      {children}
      <button
        type="button"
        className="tooltip-trigger"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        aria-label="Help"
      >
        ?
      </button>
      {visible && (
        <div className="tooltip-box" role="tooltip">
          {text}
        </div>
      )}
    </span>
  )
}
