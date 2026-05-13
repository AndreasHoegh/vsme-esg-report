import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'

const GHG_UNITS = ['tCO2e', 'kgCO2e', 'MtCO2e']

export default function Step4_GHG() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const scope1 = parseFloat(data.scope1Emissions) || 0
  const scope2 = parseFloat(data.scope2Emissions) || 0
  const scope3 = parseFloat(data.scope3Emissions) || 0
  const totalGHG = scope1 + scope2 + scope3

  const employees = parseFloat(data.employeeCount) || 0
  const ghgPerEmployee = totalGHG > 0 && employees > 0
    ? (totalGHG / employees).toFixed(2) : ''

  const revenue = parseFloat(data.revenue) || 0
  const ghgIntensity = totalGHG > 0 && revenue > 0
    ? (totalGHG / revenue * 1e6).toFixed(3) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B4</span>
        <div>
          <h2>GHG Emissions</h2>
          <p>Greenhouse gas emissions across all three scopes in CO₂ equivalent.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>Scopes explained:</strong> Scope 1 = direct emissions (your facilities/vehicles).
        Scope 2 = purchased electricity/heat. Scope 3 = value chain (optional for micro/small).
      </div>

      <section className="form-section">
        <h3>Emissions by Scope</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Unit" tooltip="tCO2e is the standard unit for greenhouse gas reporting." id="ghgUnit">
            <Select id="ghgUnit" value={data.ghgUnit} onChange={u('ghgUnit')} options={GHG_UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--3">
          <FormField
            label="Scope 1 — Direct Emissions"
            required
            tooltip="Emissions from sources owned or controlled by your company, e.g. on-site combustion, company vehicles."
            id="scope1"
          >
            <Input id="scope1" type="number" min="0" step="0.01"
              value={data.scope1Emissions} onChange={u('scope1Emissions')}
              unit={data.ghgUnit} />
          </FormField>
          <FormField
            label="Scope 2 — Purchased Energy"
            required
            tooltip="Indirect emissions from purchased electricity, heat, steam, or cooling."
            id="scope2"
          >
            <Input id="scope2" type="number" min="0" step="0.01"
              value={data.scope2Emissions} onChange={u('scope2Emissions')}
              unit={data.ghgUnit} />
          </FormField>
          <FormField
            label="Scope 3 — Value Chain"
            tooltip="All other indirect emissions in your supply chain. Voluntary for micro/small enterprises."
            id="scope3"
          >
            <Input id="scope3" type="number" min="0" step="0.01"
              value={data.scope3Emissions} onChange={u('scope3Emissions')}
              unit={data.ghgUnit} />
          </FormField>
        </div>

        {totalGHG > 0 && (
          <CalcField
            label={`Total GHG Emissions (Scope 1+2${scope3 > 0 ? '+3' : ''})`}
            value={totalGHG.toFixed(2)}
            unit={data.ghgUnit}
            tooltip="Sum of all disclosed scopes."
          />
        )}
        {ghgPerEmployee && (
          <CalcField
            label="GHG Intensity (per employee)"
            value={ghgPerEmployee}
            unit={`${data.ghgUnit}/employee`}
            tooltip="Total GHG emissions divided by headcount."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Base Year &amp; Targets</h3>
        <div className="form-grid form-grid--2">
          <FormField label="GHG Base Year" tooltip="The reference year against which emission reductions are measured." id="ghgBase">
            <Input id="ghgBase" type="number" min="2000" max="2030"
              value={data.ghgBaseYear} onChange={u('ghgBaseYear')} placeholder="2019" />
          </FormField>
          <FormField label="Reduction Target (%)" tooltip="Target percentage reduction in GHG emissions vs. base year, and by when." id="ghgTarget">
            <Input id="ghgTarget" value={data.ghgReductionTarget} onChange={u('ghgReductionTarget')}
              placeholder="e.g. 30% by 2030" />
          </FormField>
        </div>
        <FormField label="Methodology" tooltip="Describe the standard or tool used (e.g. GHG Protocol, ISO 14064).">
          <RichEditor
            value={data.methodologyDescription}
            onChange={u('methodologyDescription')}
            placeholder="Describe the methodology, emission factors, and boundaries used to calculate your GHG inventory…"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>GHG Narrative</h3>
        <FormField label="Emissions Context &amp; Actions" tooltip="Describe key emission sources, reduction actions taken, and plans.">
          <RichEditor
            value={data.ghgNarrative}
            onChange={u('ghgNarrative')}
            placeholder="Describe main emission sources, actions taken to reduce emissions, and future plans…"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Supporting Image</h3>
        <p className="section-desc">Upload a GHG chart, emissions breakdown graphic, or certificate — it will appear alongside this section in the PDF.</p>
        <ImageUpload
          fieldKey="ghgImage"
          value={data.images?.ghgImage}
          onChange={(key, val) => update({ images: { ...data.images, [key]: val } })}
          label="GHG emissions chart, audit certificate, or visual"
        />
      </section>
    </div>
  )
}
