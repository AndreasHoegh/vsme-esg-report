import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const WATER_UNITS = ['m³', 'litres', 'megalitres']
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Unknown' }]

export default function Step5_Water() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const total = parseFloat(data.totalWaterWithdrawal) || 0
  const recycled = parseFloat(data.waterRecycled) || 0
  const stressArea = parseFloat(data.waterFromStressedAreas) || 0

  const recycledPercent = total > 0 && recycled > 0 ? ((recycled / total) * 100).toFixed(1) : ''
  const stressPercent = total > 0 && stressArea > 0 ? ((stressArea / total) * 100).toFixed(1) : ''
  const employees = parseFloat(data.employeeCount) || 0
  const intensity = total > 0 && employees > 0 ? (total / employees).toFixed(1) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B5</span>
        <div>
          <h2>Water</h2>
          <p>Water withdrawal, consumption, and recycling data.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Water Consumption</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Unit" id="waterUnit">
            <Select id="waterUnit" value={data.waterUnit} onChange={u('waterUnit')} options={WATER_UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--3">
          <FormField label="Total Water Withdrawal" required
            tooltip="Total water drawn from all sources (mains, groundwater, surface water, rainwater)." id="totalWater">
            <Input id="totalWater" type="number" min="0" step="1"
              value={data.totalWaterWithdrawal} onChange={u('totalWaterWithdrawal')} unit={data.waterUnit} />
          </FormField>
          <FormField label="From Water-Stressed Areas"
            tooltip="Water withdrawn from areas classified as high or very high water stress (use WRI Aqueduct or similar)." id="stressWater">
            <Input id="stressWater" type="number" min="0" step="1"
              value={data.waterFromStressedAreas} onChange={u('waterFromStressedAreas')} unit={data.waterUnit} />
          </FormField>
          <FormField label="Water Recycled / Reused"
            tooltip="Volume of water that was treated and reused within operations." id="recycledWater">
            <Input id="recycledWater" type="number" min="0" step="1"
              value={data.waterRecycled} onChange={u('waterRecycled')} unit={data.waterUnit} />
          </FormField>
        </div>

        {recycledPercent && (
          <CalcField label="Recycling Rate" value={recycledPercent} unit="%" tooltip="Water recycled as a share of total withdrawal." />
        )}
        {stressPercent && (
          <CalcField label="Stressed Area Share" value={stressPercent} unit="%" tooltip="Proportion of water from stressed regions." />
        )}
        {intensity && (
          <CalcField label="Water Intensity (per employee)" value={intensity} unit={`${data.waterUnit}/employee`} tooltip="Total water per employee." />
        )}
      </section>

      <section className="form-section">
        <h3>Water Policy</h3>
        <FormField label="Does your company have a water management or conservation policy?"
          tooltip="A formal commitment to reducing water use or protecting water sources.">
          <RadioGroup name="hasWaterPolicy" value={data.hasWaterPolicy} onChange={u('hasWaterPolicy')} options={YES_NO} />
        </FormField>
        <FormField label="Water Narrative" tooltip="Context on water sources, risks, and reduction measures.">
          <RichEditor value={data.waterNarrative} onChange={u('waterNarrative')}
            placeholder="Describe water sources, any water-risk areas of operation, efficiency measures, and targets…" />
        </FormField>
      </section>
    </div>
  )
}
