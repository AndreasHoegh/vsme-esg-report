import React, { useEffect } from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'

const UNITS = ['MWh', 'GJ', 'kWh']
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step3_Energy() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const total = parseFloat(data.totalEnergyConsumption) || 0
  const renewable = parseFloat(data.renewableEnergyConsumption) || 0
  const nonRenewable = total - renewable

  const renewablePercent = total > 0 ? ((renewable / total) * 100).toFixed(1) : ''

  useEffect(() => {
    if (total > 0) {
      update({ nonRenewableEnergyConsumption: nonRenewable > 0 ? nonRenewable.toFixed(2) : '0' })
    }
  }, [data.totalEnergyConsumption, data.renewableEnergyConsumption])

  const employees = parseFloat(data.employeeCount) || 0
  const intensityByEmployee = total > 0 && employees > 0
    ? (total / employees).toFixed(2) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B3</span>
        <div>
          <h2>Energy</h2>
          <p>Total energy consumed, split by renewable and non-renewable sources.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Energy Consumption</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Reporting Unit" tooltip="Select the unit used for all energy figures below." id="energyUnit">
            <Select id="energyUnit" value={data.energyUnit} onChange={u('energyUnit')} options={UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--3">
          <FormField
            label="Total Energy Consumption"
            required
            tooltip="Sum of all energy consumed from all sources during the reporting period."
            id="totalEnergy"
          >
            <Input id="totalEnergy" type="number" min="0" step="0.01"
              value={data.totalEnergyConsumption} onChange={u('totalEnergyConsumption')}
              unit={data.energyUnit} />
          </FormField>
          <FormField
            label="Renewable Energy"
            tooltip="Energy from solar, wind, hydro, biomass, geothermal, or certified green electricity."
            id="renewEnergy"
          >
            <Input id="renewEnergy" type="number" min="0" step="0.01"
              value={data.renewableEnergyConsumption} onChange={u('renewableEnergyConsumption')}
              unit={data.energyUnit} />
          </FormField>
          <FormField
            label="Non-Renewable Energy"
            tooltip="Auto-calculated as Total minus Renewable."
            id="nonRenewEnergy"
          >
            <Input id="nonRenewEnergy" type="number"
              value={data.nonRenewableEnergyConsumption}
              onChange={() => {}}
              unit={data.energyUnit}
              disabled />
          </FormField>
        </div>

        {renewablePercent !== '' && (
          <CalcField
            label="Renewable Energy Share"
            value={renewablePercent}
            unit="%"
            tooltip="Percentage of total energy from renewable sources."
          />
        )}
        {intensityByEmployee !== '' && (
          <CalcField
            label="Energy Intensity (per employee)"
            value={intensityByEmployee}
            unit={`${data.energyUnit}/employee`}
            tooltip="Total energy divided by number of employees — a useful intensity metric."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Energy Management</h3>
        <FormField label="Does your company have an energy management system?" tooltip="E.g. ISO 50001 or equivalent structured approach to managing energy use.">
          <RadioGroup
            name="hasEMS"
            value={data.hasEnergyManagementSystem}
            onChange={u('hasEnergyManagementSystem')}
            options={YES_NO}
          />
        </FormField>
        <FormField label="Energy Narrative" tooltip="Describe energy reduction measures, targets, or initiatives.">
          <RichEditor
            value={data.energyNarrative}
            onChange={u('energyNarrative')}
            placeholder="Describe your energy use context, efficiency measures taken, and any targets set…"
          />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Supporting Documents</h3>
        <p className="section-desc">Upload energy bills, certificates, or audit reports.</p>
        <ImageUpload
          fieldKey="energyImage"
          value={data.images?.energyImage}
          onChange={(key, val) => update({ images: { ...data.images, [key]: val } })}
          label="Energy certificate or utility bill snapshot"
        />
      </section>
    </div>
  )
}
