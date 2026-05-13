import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const WASTE_UNITS = ['tonnes', 'kg', 'cubic metres']
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'in_progress', label: 'In Progress' }]

export default function Step6_Waste() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const total = parseFloat(data.totalWasteGenerated) || 0
  const hazardous = parseFloat(data.wasteHazardous) || 0
  const recycled = parseFloat(data.wasteRecycled) || 0
  const landfill = parseFloat(data.wasteDisposedLandfill) || 0

  const nonHazardous = total - hazardous
  const recycleRate = total > 0 && recycled > 0 ? ((recycled / total) * 100).toFixed(1) : ''
  const landfillRate = total > 0 && landfill > 0 ? ((landfill / total) * 100).toFixed(1) : ''
  const employees = parseFloat(data.employeeCount) || 0
  const intensity = total > 0 && employees > 0 ? (total / employees).toFixed(3) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B6</span>
        <div>
          <h2>Waste</h2>
          <p>Total waste generated and how it is managed — from recycling to disposal.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Waste Generation</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Unit" id="wasteUnit">
            <Select id="wasteUnit" value={data.wasteUnit} onChange={u('wasteUnit')} options={WASTE_UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--2">
          <FormField label="Total Waste Generated" required
            tooltip="All waste streams combined from all company activities." id="totalWaste">
            <Input id="totalWaste" type="number" min="0" step="0.001"
              value={data.totalWasteGenerated} onChange={u('totalWasteGenerated')} unit={data.wasteUnit} />
          </FormField>
          <FormField label="Hazardous Waste"
            tooltip="Waste classified as hazardous under applicable national/EU law." id="hazWaste">
            <Input id="hazWaste" type="number" min="0" step="0.001"
              value={data.wasteHazardous} onChange={u('wasteHazardous')} unit={data.wasteUnit} />
          </FormField>
        </div>
        {total > 0 && hazardous >= 0 && (
          <CalcField
            label="Non-Hazardous Waste"
            value={nonHazardous.toFixed(3)}
            unit={data.wasteUnit}
            tooltip="Total minus hazardous waste."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Waste Treatment</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Recycled / Recovered"
            tooltip="Waste sent for recycling, composting, or energy recovery." id="recycleWaste">
            <Input id="recycleWaste" type="number" min="0" step="0.001"
              value={data.wasteRecycled} onChange={u('wasteRecycled')} unit={data.wasteUnit} />
          </FormField>
          <FormField label="Disposed to Landfill"
            tooltip="Waste sent to landfill or incineration without energy recovery." id="landfillWaste">
            <Input id="landfillWaste" type="number" min="0" step="0.001"
              value={data.wasteDisposedLandfill} onChange={u('wasteDisposedLandfill')} unit={data.wasteUnit} />
          </FormField>
        </div>

        {recycleRate && <CalcField label="Recycling Rate" value={recycleRate} unit="%" tooltip="Share of total waste recycled or recovered." />}
        {landfillRate && <CalcField label="Landfill Rate" value={landfillRate} unit="%" tooltip="Share of total waste sent to landfill." />}
        {intensity && <CalcField label="Waste Intensity (per employee)" value={intensity} unit={`${data.wasteUnit}/employee`} tooltip="Waste per FTE." />}
      </section>

      <section className="form-section">
        <h3>Waste Reduction</h3>
        <FormField label="Does your company have waste reduction targets?"
          tooltip="Formal commitments to reduce waste generation over time.">
          <RadioGroup name="hasWasteTarget" value={data.hasWasteReductionTarget} onChange={u('hasWasteReductionTarget')} options={YES_NO} />
        </FormField>
        <FormField label="Waste Narrative" tooltip="Context on waste types, disposal routes, and reduction initiatives.">
          <RichEditor value={data.wasteNarrative} onChange={u('wasteNarrative')}
            placeholder="Describe main waste streams, how they are treated, any reduction programmes in place…" />
        </FormField>
      </section>
    </div>
  )
}
