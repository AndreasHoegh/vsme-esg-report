import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const WATER_UNITS = ['m³', 'litres', 'megalitres']

export default function Step6_Waste() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const withdrawal = parseFloat(data.totalWaterWithdrawal) || 0
  const discharge = parseFloat(data.waterDischarge) || 0
  const stressed = parseFloat(data.waterFromStressedAreas) || 0
  const recycled = parseFloat(data.waterRecycled) || 0

  // VSME: consumption = withdrawal − discharge
  const consumption = withdrawal > 0 ? Math.max(0, withdrawal - discharge) : 0
  const stressedPct = withdrawal > 0 && stressed > 0 ? ((stressed / withdrawal) * 100).toFixed(1) : ''
  const recycledPct = withdrawal > 0 && recycled > 0 ? ((recycled / withdrawal) * 100).toFixed(1) : ''
  const employees = parseFloat(data.employeeCount) || 0
  const intensity = withdrawal > 0 && employees > 0 ? (withdrawal / employees).toFixed(1) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B6</span>
        <div>
          <h2>Water &amp; Marine Resources</h2>
          <p>Water withdrawal, discharge, and consumption — key data for assessing water risk.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Water Volumes</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Unit" id="waterUnit">
            <Select id="waterUnit" value={data.waterUnit} onChange={u('waterUnit')} options={WATER_UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--2">
          <FormField
            label="Total Water Withdrawal"
            required
            tooltip="Total water drawn from all sources: mains, groundwater, surface water, and rainwater."
            id="totalWater"
          >
            <Input id="totalWater" type="number" min="0" step="1"
              value={data.totalWaterWithdrawal} onChange={u('totalWaterWithdrawal')} unit={data.waterUnit} />
          </FormField>
          <FormField
            label="Total Water Discharge"
            required
            tooltip="Total water discharged to sewers, surface water, or groundwater after use."
            id="waterDischarge"
          >
            <Input id="waterDischarge" type="number" min="0" step="1"
              value={data.waterDischarge} onChange={u('waterDischarge')} unit={data.waterUnit} />
          </FormField>
        </div>

        {withdrawal > 0 && (
          <CalcField
            label="Water Consumption (Withdrawal − Discharge)"
            value={consumption.toFixed(0)}
            unit={data.waterUnit}
            tooltip="VSME defines consumption as withdrawal minus discharge. This represents water retained in products or lost to evaporation."
          />
        )}

        <div className="form-grid form-grid--2">
          <FormField
            label="From Water-Stressed Areas"
            tooltip="Water withdrawn from areas classified as high or very high water stress (e.g. per WRI Aqueduct)."
            id="stressWater"
          >
            <Input id="stressWater" type="number" min="0" step="1"
              value={data.waterFromStressedAreas} onChange={u('waterFromStressedAreas')} unit={data.waterUnit} />
          </FormField>
          <FormField
            label="Water Recycled / Reused"
            tooltip="Volume of water treated and reused within operations (reduces net withdrawal)."
            id="recycledWater"
          >
            <Input id="recycledWater" type="number" min="0" step="1"
              value={data.waterRecycled} onChange={u('waterRecycled')} unit={data.waterUnit} />
          </FormField>
        </div>

        {stressedPct && (
          <CalcField label="Share from Water-Stressed Areas" value={stressedPct} unit="%" tooltip="Proportion of total withdrawal from stressed regions." />
        )}
        {recycledPct && (
          <CalcField label="Water Recycling Rate" value={recycledPct} unit="%" tooltip="Recycled water as a share of total withdrawal." />
        )}
        {intensity && (
          <CalcField label="Water Intensity (per employee)" value={intensity} unit={`${data.waterUnit}/employee`} tooltip="Total withdrawal per employee." />
        )}
      </section>

      <section className="form-section">
        <h3>Water Context</h3>
        <FormField label="Discharge Destination" tooltip="Describe where discharged water goes: municipal sewer, river, sea, groundwater, etc." id="dischargeDest">
          <Input id="dischargeDest" value={data.waterDischargeDestination} onChange={u('waterDischargeDestination')}
            placeholder="e.g. Municipal wastewater treatment plant; River Xxx" />
        </FormField>
        <FormField label="Water Narrative" tooltip="Describe water sources, risks, usage context, and conservation measures.">
          <RichEditor value={data.waterNarrative} onChange={u('waterNarrative')}
            placeholder="Describe water sources, water-risk context, efficiency measures, targets, and any impacts on water quality or aquatic ecosystems…" />
        </FormField>
      </section>
    </div>
  )
}
