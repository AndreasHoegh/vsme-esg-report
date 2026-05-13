import React, { useEffect } from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, InputWithUnitSelect, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'

const ENERGY_UNITS = ['MWh', 'GJ', 'kWh', 'TJ', 'BTU']
const GHG_UNITS = ['tCO2e', 'kgCO2e', 'MtCO2e']
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

// Fuel units available per source
const GAS_UNITS    = ['m³', 'L', 'kg', 'MWh', 'GJ', 'kWh']
const OIL_UNITS    = ['L', 'kg', 'tonnes', 'gallons', 'MWh', 'GJ', 'kWh']
const DISTRICT_UNITS = ['MWh', 'GJ', 'kWh', 'm³', 'L']

export default function Step3_Energy() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  // Energy calculations
  const total = parseFloat(data.totalEnergyConsumption) || 0
  const renewable = parseFloat(data.renewableEnergyConsumption) || 0
  const nonRenewable = total - renewable
  const renewablePercent = total > 0 ? ((renewable / total) * 100).toFixed(1) : ''
  const employees = parseFloat(data.employeeCount) || 0
  const energyIntensity = total > 0 && employees > 0 ? (total / employees).toFixed(2) : ''

  useEffect(() => {
    if (total > 0) {
      update({ nonRenewableEnergyConsumption: nonRenewable > 0 ? nonRenewable.toFixed(2) : '0' })
    }
  }, [data.totalEnergyConsumption, data.renewableEnergyConsumption])

  // GHG calculations
  const scope1 = parseFloat(data.scope1Emissions) || 0
  const scope2 = parseFloat(data.scope2Emissions) || 0
  const scope3 = parseFloat(data.scope3Emissions) || 0
  const totalGHG = scope1 + scope2 + scope3
  const revenue = parseFloat(data.revenue) || 0
  const ghgIntensityRevenue = totalGHG > 0 && revenue > 0
    ? (totalGHG / (revenue / 1_000_000)).toFixed(3) : ''
  const ghgIntensityEmployee = totalGHG > 0 && employees > 0
    ? (totalGHG / employees).toFixed(2) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B3</span>
        <div>
          <h2>Energy &amp; GHG Emissions</h2>
          <p>Total energy consumed and greenhouse gas emissions across all scopes.</p>
        </div>
      </div>

      {/* ── ENERGY ── */}
      <section className="form-section">
        <h3>Energy Consumption</h3>
        <div className="form-grid form-grid--2">
          <FormField label="Reporting Unit" tooltip="Select the unit used for all energy figures below." id="energyUnit">
            <Select id="energyUnit" value={data.energyUnit} onChange={u('energyUnit')} options={ENERGY_UNITS} />
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
            tooltip="Auto-calculated: Total minus Renewable."
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
          <CalcField label="Renewable Energy Share" value={renewablePercent} unit="%" tooltip="Percentage of total energy from renewable sources." />
        )}
        {energyIntensity !== '' && (
          <CalcField label="Energy Intensity (per employee)" value={energyIntensity} unit={`${data.energyUnit}/employee`} tooltip="Total energy divided by number of employees." />
        )}
      </section>

      <section className="form-section">
        <h3>Energy by Source</h3>
        <p className="section-desc">Break down energy consumption by source. Each source has its own unit — select the unit that matches your data (e.g. litres for diesel, m³ for gas).</p>
        <div className="form-grid form-grid--2">
          <FormField label="Electricity" tooltip="Total electricity purchased or self-generated." id="elecCons">
            <Input id="elecCons" type="number" min="0" step="0.01"
              value={data.electricityConsumption} onChange={u('electricityConsumption')} unit={data.energyUnit} />
          </FormField>
          <FormField label="Natural Gas" tooltip="Natural gas consumed for heating, processes, or combined heat-and-power." id="gasCons">
            <InputWithUnitSelect id="gasCons" type="number" min="0" step="0.01"
              value={data.naturalGasConsumption} onChange={u('naturalGasConsumption')}
              unitValue={data.gasUnit} unitOptions={GAS_UNITS} onUnitChange={u('gasUnit')} />
          </FormField>
          <FormField label="Fuel Oil / Diesel" tooltip="Fuel oil, diesel, or petrol consumed on-site or in company vehicles." id="fuelCons">
            <InputWithUnitSelect id="fuelCons" type="number" min="0" step="0.01"
              value={data.fuelOilConsumption} onChange={u('fuelOilConsumption')}
              unitValue={data.fuelOilUnit} unitOptions={OIL_UNITS} onUnitChange={u('fuelOilUnit')} />
          </FormField>
          <FormField label="District Heating / Cooling" tooltip="Heat or cooling purchased from an external district network." id="districtCons">
            <InputWithUnitSelect id="districtCons" type="number" min="0" step="0.01"
              value={data.districtHeatingConsumption} onChange={u('districtHeatingConsumption')}
              unitValue={data.districtUnit} unitOptions={DISTRICT_UNITS} onUnitChange={u('districtUnit')} />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>Energy Management</h3>
        <FormField label="Does your company have an energy management system?" tooltip="E.g. ISO 50001 or equivalent structured approach to managing energy use.">
          <RadioGroup name="hasEMS" value={data.hasEnergyManagementSystem} onChange={u('hasEnergyManagementSystem')} options={YES_NO} />
        </FormField>
        <FormField label="Energy Reduction Target" tooltip="State any quantitative energy reduction or efficiency target and its baseline year." id="energyTarget">
          <Input id="energyTarget" value={data.energyReductionTarget} onChange={u('energyReductionTarget')}
            placeholder="e.g. Reduce energy intensity by 20% by 2030 vs. 2022 baseline" />
        </FormField>
        <FormField label="Energy Narrative" tooltip="Describe energy reduction measures, initiatives, and progress.">
          <RichEditor value={data.energyNarrative} onChange={u('energyNarrative')}
            placeholder="Describe your energy use context, efficiency measures taken, renewable energy procurement, and targets set…" />
        </FormField>
      </section>

      {/* ── GHG ── */}
      <section className="form-section">
        <h3>GHG Emissions</h3>
        <div className="info-box">
          <strong>Scopes explained:</strong> Scope 1 = direct emissions from your facilities and vehicles.
          Scope 2 = indirect emissions from purchased electricity and heat.
          Scope 3 = all other value-chain emissions (voluntary for micro/small enterprises).
        </div>
        <div className="form-grid form-grid--2">
          <FormField label="GHG Unit" tooltip="tCO2e is the standard unit for greenhouse gas reporting." id="ghgUnit">
            <Select id="ghgUnit" value={data.ghgUnit} onChange={u('ghgUnit')} options={GHG_UNITS} />
          </FormField>
        </div>
        <div className="form-grid form-grid--3">
          <FormField
            label="Scope 1 — Direct Emissions"
            required
            tooltip="Emissions from sources owned or controlled by your company (combustion, company vehicles)."
            id="scope1"
          >
            <Input id="scope1" type="number" min="0" step="0.01"
              value={data.scope1Emissions} onChange={u('scope1Emissions')} unit={data.ghgUnit} />
          </FormField>
          <FormField
            label="Scope 2 — Purchased Energy"
            required
            tooltip="Indirect emissions from purchased electricity, heat, steam, or cooling."
            id="scope2"
          >
            <Input id="scope2" type="number" min="0" step="0.01"
              value={data.scope2Emissions} onChange={u('scope2Emissions')} unit={data.ghgUnit} />
          </FormField>
          <FormField
            label="Scope 3 — Value Chain"
            tooltip="All other indirect emissions in the supply chain. Optional for micro/small enterprises."
            id="scope3"
          >
            <Input id="scope3" type="number" min="0" step="0.01"
              value={data.scope3Emissions} onChange={u('scope3Emissions')} unit={data.ghgUnit} />
          </FormField>
        </div>

        {totalGHG > 0 && (
          <CalcField
            label={`Total GHG (Scope 1+2${scope3 > 0 ? '+3' : ''})`}
            value={totalGHG.toFixed(2)}
            unit={data.ghgUnit}
            tooltip="Sum of all disclosed scopes."
          />
        )}
        {ghgIntensityRevenue && (
          <CalcField
            label="GHG Intensity (per M revenue)"
            value={ghgIntensityRevenue}
            unit={`${data.ghgUnit}/M${data.currency || 'EUR'}`}
            tooltip="Total GHG emissions divided by revenue in millions. Revenue must be entered in B1."
          />
        )}
        {ghgIntensityEmployee && (
          <CalcField
            label="GHG Intensity (per employee)"
            value={ghgIntensityEmployee}
            unit={`${data.ghgUnit}/employee`}
            tooltip="Total GHG emissions divided by headcount."
          />
        )}
      </section>

      <section className="form-section">
        <h3>GHG Targets &amp; Methodology</h3>
        <div className="form-grid form-grid--2">
          <FormField label="GHG Base Year" tooltip="The reference year against which emission reductions are measured." id="ghgBase">
            <Input id="ghgBase" type="number" min="2000" max="2030"
              value={data.ghgBaseYear} onChange={u('ghgBaseYear')} placeholder="2019" />
          </FormField>
          <FormField label="GHG Reduction Target" tooltip="Target percentage reduction and by when, relative to base year." id="ghgTarget">
            <Input id="ghgTarget" value={data.ghgReductionTarget} onChange={u('ghgReductionTarget')}
              placeholder="e.g. 30% reduction by 2030 vs. 2019 baseline" />
          </FormField>
        </div>
        <FormField label="Calculation Methodology" tooltip="Describe the standard or tool used (e.g. GHG Protocol, ISO 14064, emission factors source).">
          <RichEditor value={data.methodologyDescription} onChange={u('methodologyDescription')}
            placeholder="Describe the methodology, emission factors used, organisational boundaries, and any exclusions…" />
        </FormField>
        <FormField label="GHG Narrative" tooltip="Describe key emission sources, reduction actions, and future plans.">
          <RichEditor value={data.ghgNarrative} onChange={u('ghgNarrative')}
            placeholder="Describe main emission sources, reduction measures taken, and forward-looking plans…" />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Supporting Documents</h3>
        <p className="section-desc">Upload energy bills, GHG audit reports, or certificates.</p>
        <ImageUpload
          fieldKey="energyImage"
          value={data.images?.energyImage}
          onChange={(key, val) => update({ images: { ...data.images, [key]: val } })}
          label="Energy certificate, utility bill snapshot, or GHG chart"
        />
      </section>
    </div>
  )
}
