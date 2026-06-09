import React from 'react'
import Tooltip from './Tooltip'
import { fmtNum } from '../utils/format'
import './FormField.css'

export function FormField({ label, required, tooltip, error, children, hint, id }) {
  return (
    <div className={`form-field${error ? ' form-field--error' : ''}`}>
      {label && (
        <label className="form-label" htmlFor={id}>
          <Tooltip text={tooltip}>
            {label}
            {required && <span className="required">*</span>}
          </Tooltip>
        </label>
      )}
      {children}
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export function Input({ id, value, onChange, type = 'text', placeholder, min, max, step, disabled, unit, ...rest }) {
  if (unit) {
    return (
      <div className="input-unit-wrap">
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="form-input"
          {...rest}
        />
        <span className="input-unit">{unit}</span>
      </div>
    )
  }
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="form-input"
      {...rest}
    />
  )
}

export function Select({ id, value, onChange, options, placeholder, disabled }) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="form-select"
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}

export function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="radio-group">
      {options.map(o => (
        <label key={o.value} className={`radio-label${value === o.value ? ' radio-label--checked' : ''}`}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className="radio-text">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

export function InputWithUnitSelect({ id, value, onChange, type = 'number', min, max, step, disabled, unitValue, unitOptions, onUnitChange, ...rest }) {
  return (
    <div className="input-unit-wrap">
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="form-input form-input--with-unit-sel"
        {...rest}
      />
      <select
        value={unitValue}
        onChange={e => onUnitChange(e.target.value)}
        className="input-unit-sel"
        onClick={e => e.stopPropagation()}
      >
        {(unitOptions || []).map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export function CalcField({ label, value, unit, tooltip }) {
  return (
    <div className="calc-field">
      <span className="calc-label">
        <Tooltip text={tooltip}>{label}</Tooltip>
      </span>
      <span className="calc-value">
        {value !== '' && value !== null && value !== undefined && !isNaN(value)
          ? `${fmtNum(value)} ${unit}`
          : <span className="calc-placeholder">Calculated automatically</span>
        }
      </span>
    </div>
  )
}
