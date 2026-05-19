import React, { useCallback } from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'
import './WasteTypes.css'

const WASTE_TYPE_OPTIONS = [
  'Paper & Cardboard',
  'Plastic',
  'Metal / Scrap',
  'Glass',
  'Organic / Food Waste',
  'Electronic Waste (e-waste)',
  'Construction & Demolition',
  'Textiles',
  'Chemical / Liquid Waste',
  'Medical / Clinical Waste',
  'Rubber & Tyres',
  'Other (specify)',
]

const WASTE_UNITS = ['tonnes', 'kg', 'cubic metres']
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

function newEntry() {
  return { id: crypto.randomUUID(), typeKey: '', customName: '', amount: '', recycled: '', hazardous: false }
}

export default function Step7_Workforce() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const wasteTypes = data.wasteTypes || []
  const wasteUnit = data.wasteUnit || 'tonnes'

  const updateEntry = useCallback((id, field, value) => {
    update({
      wasteTypes: (data.wasteTypes || []).map(e => e.id === id ? { ...e, [field]: value } : e)
    })
  }, [data.wasteTypes, update])

  const addEntry = () => update({ wasteTypes: [...wasteTypes, newEntry()] })

  const removeEntry = (id) => update({ wasteTypes: wasteTypes.filter(e => e.id !== id) })

  // Computed totals from the list
  const total = wasteTypes.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalHazardous = wasteTypes.filter(e => e.hazardous).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalRecycled = wasteTypes.reduce((s, e) => s + (parseFloat(e.recycled) || 0), 0)
  const hazPct = total > 0 ? ((totalHazardous / total) * 100).toFixed(1) : ''
  const recycleRate = total > 0 ? ((totalRecycled / total) * 100).toFixed(1) : ''
  const employees = parseFloat(data.employeeCount) || 0
  const intensity = total > 0 && employees > 0 ? (total / employees).toFixed(3) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B7</span>
        <div>
          <h2>Resources, Circular Economy &amp; Waste</h2>
          <p>Circular economy practices and waste generation — a core VSME disclosure area.</p>
        </div>
      </div>

      {/* ── Circular Economy ── */}
      <section className="form-section">
        <h3>Circular Economy</h3>
        <FormField
          label="Does your company apply circular economy principles?"
          required
          tooltip="Circular economy includes product design for reuse/repair, using recycled inputs, returning products to production cycles, or reducing resource use."
        >
          <RadioGroup
            name="usesCircularEconomy"
            value={data.usesCircularEconomy}
            onChange={u('usesCircularEconomy')}
            options={YES_NO}
          />
        </FormField>

        {data.usesCircularEconomy === 'yes' && (
          <FormField
            label="Circular Economy Description"
            tooltip="Describe specific circular practices, products, or processes your company has implemented."
          >
            <RichEditor
              value={data.circularEconomyDescription}
              onChange={u('circularEconomyDescription')}
              placeholder="Describe circular design principles, recycled material use, take-back schemes, repair/refurbishment programmes…"
            />
          </FormField>
        )}

        <FormField
          label="Material Flow Description (optional)"
          tooltip="Describe significant material inputs and outputs."
        >
          <RichEditor
            value={data.materialFlowDescription}
            onChange={u('materialFlowDescription')}
            placeholder="Describe key raw materials used, recycled content %, products or by-products, and how materials leave the company…"
          />
        </FormField>
      </section>

      {/* ── Waste Types ── */}
      <section className="form-section">
        <div className="wt-header">
          <div>
            <h3>Waste Generation</h3>
            <p className="section-desc">Add each type of waste your company generates.</p>
          </div>
          <FormField label="Unit" id="wasteUnit" inline>
            <Select id="wasteUnit" value={wasteUnit} onChange={u('wasteUnit')} options={WASTE_UNITS} />
          </FormField>
        </div>

        {wasteTypes.length === 0 && (
          <div className="wt-empty">
            <span className="wt-empty-icon">🗑</span>
            <p>No waste types added yet. Click the button below to add your first waste stream.</p>
          </div>
        )}

        {wasteTypes.map((entry, i) => {
          const isOther = entry.typeKey === 'Other (specify)'
          const displayName = isOther ? entry.customName || 'Other' : entry.typeKey || `Waste stream ${i + 1}`
          return (
            <div key={entry.id} className={`wt-card${entry.hazardous ? ' wt-card--hazardous' : ''}`}>
              <div className="wt-card-header">
                <span className="wt-card-number">{i + 1}</span>
                <span className="wt-card-name">{displayName}</span>
                {entry.hazardous && <span className="wt-hazardous-badge">⚠ Hazardous</span>}
                <button className="wt-btn-remove" onClick={() => removeEntry(entry.id)} title="Remove">✕</button>
              </div>

              <div className="wt-card-body">
                <div className="wt-field-group">
                  <label className="wt-label">Waste type</label>
                  <select
                    className="wt-select"
                    value={entry.typeKey}
                    onChange={e => updateEntry(entry.id, 'typeKey', e.target.value)}
                  >
                    <option value="">Select type…</option>
                    {WASTE_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {isOther && (
                    <input
                      className="wt-input wt-input--name"
                      type="text"
                      placeholder="Enter waste type name…"
                      value={entry.customName}
                      onChange={e => updateEntry(entry.id, 'customName', e.target.value)}
                    />
                  )}
                </div>

                <div className="wt-amounts">
                  <div className="wt-field-group">
                    <label className="wt-label">Total amount ({wasteUnit})</label>
                    <input
                      className="wt-input"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="0"
                      value={entry.amount}
                      onChange={e => updateEntry(entry.id, 'amount', e.target.value)}
                    />
                  </div>
                  <div className="wt-field-group">
                    <label className="wt-label">Amount recycled ({wasteUnit})</label>
                    <input
                      className="wt-input"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="0"
                      value={entry.recycled}
                      onChange={e => updateEntry(entry.id, 'recycled', e.target.value)}
                    />
                  </div>
                </div>

                <label className="wt-checkbox-label">
                  <input
                    type="checkbox"
                    className="wt-checkbox"
                    checked={entry.hazardous}
                    onChange={e => updateEntry(entry.id, 'hazardous', e.target.checked)}
                  />
                  <span>Hazardous waste</span>
                </label>
              </div>
            </div>
          )
        })}

        <button className="wt-btn-add" onClick={addEntry}>
          + Add waste type
        </button>

        {/* Computed summary */}
        {wasteTypes.length > 0 && total > 0 && (
          <div className="wt-summary">
            <CalcField label="Total Waste" value={total.toFixed(3)} unit={wasteUnit} tooltip="Sum of all waste streams." />
            {hazPct && <CalcField label="Hazardous Waste Share" value={hazPct} unit="%" tooltip="Hazardous waste as % of total." />}
            {recycleRate && <CalcField label="Recycling Rate" value={recycleRate} unit="%" tooltip="Recycled waste as % of total." />}
            {intensity && <CalcField label="Intensity (per employee)" value={intensity} unit={`${wasteUnit}/employee`} tooltip="Total waste per FTE." />}
          </div>
        )}
      </section>

      <section className="form-section">
        <h3>Waste Narrative</h3>
        <FormField label="Waste Context &amp; Reduction Plans" tooltip="Describe main waste streams, reduction targets, and initiatives.">
          <RichEditor value={data.wasteNarrative} onChange={u('wasteNarrative')}
            placeholder="Describe main waste streams, how waste is treated, reduction or diversion targets, and any initiatives to prevent waste at source…" />
        </FormField>
      </section>
    </div>
  )
}
