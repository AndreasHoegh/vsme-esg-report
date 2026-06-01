import React, { useRef, useEffect } from 'react'
import './RichEditor.css'

const TOOLBAR_ACTIONS = [
  { cmd: 'bold',                icon: 'B',  title: 'Bold' },
  { cmd: 'italic',              icon: 'I',  title: 'Italic' },
  { cmd: 'insertUnorderedList', icon: '≡',  title: 'Bullet list' },
  { cmd: 'insertOrderedList',   icon: '1.', title: 'Numbered list' },
]

export default function RichEditor({ value, onChange, placeholder }) {
  const ref = useRef(null)
  // Tracks the innerHTML as we last wrote it from outside, so we can
  // distinguish an external update (load demo, clear draft) from a user keystroke.
  const lastExternalRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const incoming = value || ''
    // Only overwrite the DOM if the value was changed externally.
    // When the user types, handleInput updates lastExternalRef before calling
    // onChange, so incoming === lastExternalRef.current and we skip the reset.
    if (incoming !== lastExternalRef.current) {
      ref.current.innerHTML = incoming
      lastExternalRef.current = incoming
    }
  }, [value])

  const exec = (cmd) => {
    ref.current?.focus()
    document.execCommand(cmd, false, null)
    const html = ref.current?.innerHTML || ''
    lastExternalRef.current = html
    onChange(html)
  }

  const handleInput = () => {
    const html = ref.current?.innerHTML || ''
    lastExternalRef.current = html
    onChange(html)
  }

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {TOOLBAR_ACTIONS.map(a => (
          <button
            key={a.cmd}
            type="button"
            title={a.title}
            onMouseDown={e => { e.preventDefault(); exec(a.cmd) }}
            className="rich-btn"
          >
            {a.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        className="rich-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder || 'Enter your narrative here...'}
      />
    </div>
  )
}
