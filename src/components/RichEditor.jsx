import React, { useRef } from 'react'
import './RichEditor.css'

const TOOLBAR_ACTIONS = [
  { cmd: 'bold', icon: 'B', title: 'Bold' },
  { cmd: 'italic', icon: 'I', title: 'Italic' },
  { cmd: 'insertUnorderedList', icon: '≡', title: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: '1.', title: 'Numbered list' },
]

export default function RichEditor({ value, onChange, placeholder }) {
  const ref = useRef(null)

  const exec = (cmd) => {
    ref.current?.focus()
    document.execCommand(cmd, false, null)
    onChange(ref.current?.innerHTML || '')
  }

  const handleInput = () => {
    onChange(ref.current?.innerHTML || '')
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
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder || 'Enter your narrative here...'}
      />
    </div>
  )
}
