import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const WASTE_UNITS = ['tonnes', 'kg', 'cubic metres']
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step7_Workforce() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const total = parseFloat(data.totalWasteGenerated) || 0
  const hazardous = parseFloat(data.wasteHazardous) || 0
  const nonHazardous = parseFloat(data.wasteNonHazardous) || 0
  const recycled = parseFloat(data.wasteRecycled) || 0
  const recycledReuse = parseFloat(data.wasteRecycledForReuse) || 0
  const landfill = parseFloat(data.wasteDisposedLandfill) || 0

  const hazPct = total > 0 && hazardous > 0 ? ((hazardous / total) * 100).toFixed(1) : ''
  const recycleRate = total > 0 && recycled > 0 ? ((recycled / total) * 100).toFixed(1) : ''
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
              placeholder="Describe circular design principles, recycled material use, take-back schemes, repair/refurbishment programmes, or any other circular economy initiatives…"
            />
          </FormField>
        )}

        <FormField
          label="Material Flow Description (optional)"
          tooltip="Describe significant material inputs and outputs — useful for identifying resource efficiency opportunities."
        >
          <RichEditor
            value={data.materialFlowDescription}
            onChange={u('materialFlowDescription')}
            placeholder="Describe key raw materials used, recycled content %, products or by-products, and how materials leave the company (sold, recycled, disposed)…"
          />
        </FormField>
      </section>

      {/* ── Waste ── */}
      <section className="form-section">
        <h3>Waste Generation</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Unit" id="wasteUnit">
            <Select id="wasteUnit" value={data.wasteUnit} onChange={u('wasteUnit')} options={WASTE_UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--2">
          <FormField
            label="Total Waste Generated"
            required
            tooltip="All waste streams combined from all company activities during the reporting period."
            id="totalWaste"
          >
            <Input id="totalWaste" type="number" min="0" step="0.001"
              value={data.totalWasteGenerated} onChange={u('totalWasteGenerated')} unit={data.wasteUnit} />
          </FormField>
          <FormField
            label="Hazardous Waste"
            required
            tooltip="Waste classified as hazardous under applicable national or EU law."
            id="hazWaste"
          >
            <Input id="hazWaste" type="number" min="0" step="0.001"
              value={data.wasteHazardous} onChange={u('wasteHazardous')} unit={data.wasteUnit} />
          </FormField>
        </div>
        {hazPct && <CalcField label="Hazardous Waste Share" value={hazPct} unit="%" tooltip="Hazardous waste as a percentage of total waste." />}
      </section>

      <section className="form-section">
        <h3>Waste Treatment</h3>
        <p className="section-desc">Break down how waste is managed — required for VSME B7.</p>
        <div className="form-grid form-grid--2">
          <FormField
            label="Waste Recycled / Recovered"
            required
            tooltip="Waste sent for recycling, composting, or energy recovery processes."
            id="recycleWaste"
          >
            <Input id="recycleWaste" type="number" min="0" step="0.001"
              value={data.wasteRecycled} onChange={u('wasteRecycled')} unit={data.wasteUnit} />
          </FormField>
          <FormField
            label="Waste Prepared for Reuse"
            tooltip="Waste processed and returned to use without reprocessing (e.g. refurbished goods, returned packaging)."
            id="recycledReuseWaste"
          >
            <Input id="recycledReuseWaste" type="number" min="0" step="0.001"
              value={data.wasteRecycledForReuse} onChange={u('wasteRecycledForReuse')} unit={data.wasteUnit} />
          </FormField>
          <FormField
            label="Waste to Incineration (energy recovery)"
            tooltip="Waste sent to incineration where the heat or electricity is recovered."
            id="incinerateWaste"
          >
            <Input id="incinerateWaste" type="number" min="0" step="0.001"
              value={data.wasteToIncineration} onChange={u('wasteToIncineration')} unit={data.wasteUnit} />
          </FormField>
          <FormField
            label="Waste to Landfill"
            tooltip="Waste disposed of in landfill or incineration without energy recovery."
            id="landfillWaste"
          >
            <Input id="landfillWaste" type="number" min="0" step="0.001"
              value={data.wasteDisposedLandfill} onChange={u('wasteDisposedLandfill')} unit={data.wasteUnit} />
          </FormField>
        </div>

        {recycleRate && <CalcField label="Recycling Rate" value={recycleRate} unit="%" tooltip="Recycled/recovered waste as % of total waste." />}
        {intensity && <CalcField label="Waste Intensity (per employee)" value={intensity} unit={`${data.wasteUnit}/employee`} tooltip="Total waste per FTE." />}
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
