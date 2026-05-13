import React, { useCallback } from 'react'
import './ImageUpload.css'

export default function ImageUpload({ fieldKey, value, onChange, label }) {
  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => onChange(fieldKey, e.target.result)
    reader.readAsDataURL(file)
  }, [fieldKey, onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleChange = (e) => handleFile(e.target.files[0])

  const handleDragOver = (e) => e.preventDefault()

  return (
    <div className="image-upload">
      {value ? (
        <div className="image-preview">
          <img src={value} alt="Uploaded" />
          <button type="button" className="image-remove" onClick={() => onChange(fieldKey, null)}>
            ✕ Remove
          </button>
        </div>
      ) : (
        <label
          className="image-drop"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input type="file" accept="image/*" onChange={handleChange} hidden />
          <span className="image-icon">🖼</span>
          <span className="image-text">
            <strong>Click to upload</strong> or drag and drop
          </span>
          <span className="image-sub">PNG, JPG, GIF up to 5MB</span>
          {label && <span className="image-label">{label}</span>}
        </label>
      )}
    </div>
  )
}
