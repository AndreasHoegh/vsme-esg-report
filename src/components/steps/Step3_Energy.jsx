import React, { useEffect } from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, InputWithUnitSelect, Select, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import ImageUpload from '../ImageUpload'
import '../StepContent.css'
import './Step3_Energy.css'

const GHG_UNITS      = ['tCO2e', 'kgCO2e', 'MtCO2e']
const ENERGY_UNITS   = ['MWh', 'GJ', 'kWh', 'TJ']
const GAS_UNITS      = ['m³', 'L', 'kg', 'MWh', 'GJ', 'kWh']
const OIL_UNITS      = ['L', 'kg', 'tonnes', 'gallons', 'MWh', 'GJ', 'kWh']
const YES_NO         = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

function n(v) { return parseFloat(v) || 0 }

export default function Step3_Energy() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const scope1 = n(data.scope1Emissions)
  const scope2 = n(data.scope2Emissions)
  const scope3 = n(data.scope3Emissions)
  const totalGHG = scope1 + scope2 + scope3

  const scope1Sub = n(data.scope1Stationary) + n(data.scope1Mobile) + n(data.scope1Fugitive) + n(data.scope1Process)
  const scope3Sub = n(data.scope3BusinessTravel) + n(data.scope3Commuting) + n(data.scope3PurchasedGoods) +
                    n(data.scope3Waste) + n(data.scope3UpstreamTransport) + n(data.scope3DownstreamTransport) +
                    n(data.scope3UseOfProducts)

  const total       = n(data.totalEnergyConsumption)
  const renewable   = n(data.renewableEnergyConsumption)
  const nonRenewable = total - renewable
  const renewablePercent = total > 0 ? ((renewable / total) * 100).toFixed(1) : ''
  const employees   = n(data.employeeCount)
  const energyIntensity    = total > 0 && employees > 0 ? (total / employees).toFixed(2) : ''
  const revenue            = n(data.revenue)
  const ghgIntensityRevenue  = totalGHG > 0 && revenue > 0
    ? (totalGHG / (revenue / 1_000_000)).toFixed(3) : ''
  const ghgIntensityEmployee = totalGHG > 0 && employees > 0
    ? (totalGHG / employees).toFixed(2) : ''

  useEffect(() => {
    if (total > 0)
      update({ nonRenewableEnergyConsumption: nonRenewable > 0 ? nonRenewable.toFixed(2) : '0' })
  }, [data.totalEnergyConsumption, data.renewableEnergyConsumption])

  const gu = data.ghgUnit

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B3</span>
        <div>
          <h2>Energy &amp; GHG Emissions</h2>
          <p>Enter your data scope by scope — starting with what you use directly, then purchased energy, and finally your value chain.</p>
        </div>
      </div>

      {/* ── Unit selectors ────────────────────────────────────────────────── */}
      <div className="unit-row">
        <FormField label="GHG Unit" tooltip="tCO2e is the standard unit for greenhouse gas reporting." id="ghgUnit">
          <Select id="ghgUnit" value={data.ghgUnit} onChange={u('ghgUnit')} options={GHG_UNITS} />
        </FormField>
        <FormField label="Energy Unit" tooltip="Unit for electricity and district energy. Fuels have their own units per field." id="energyUnit">
          <Select id="energyUnit" value={data.energyUnit} onChange={u('energyUnit')} options={ENERGY_UNITS} />
        </FormField>
      </div>

      {/* ══ SCOPE 1 ══════════════════════════════════════════════════════ */}
      <div className="scope-card scope-card--1">
        <div className="scope-card-header">
          <span className="scope-badge scope-badge--1">Scope 1</span>
          <div className="scope-header-text">
            <h4>Direct Emissions</h4>
            <p>Fuels you burn on-site (boilers, furnaces) and in company-owned vehicles. These are the emissions your company produces directly.</p>
          </div>
        </div>

        <div className="scope-card-body">
          {/* Energy inputs */}
          <div className="scope-sub-section">
            <p className="scope-sub-label">Fuel inputs</p>
            <div className="form-grid form-grid--2">
              <FormField label="Natural Gas" tooltip="Gas consumed for heating, cooking, or combined heat-and-power on-site." id="gasCons">
                <InputWithUnitSelect id="gasCons" type="number" min="0" step="0.01"
                  value={data.naturalGasConsumption} onChange={u('naturalGasConsumption')}
                  unitValue={data.gasUnit} unitOptions={GAS_UNITS} onUnitChange={u('gasUnit')} />
              </FormField>
              <FormField label="Fuel Oil / Diesel" tooltip="Fuel oil or diesel burned on-site (generators, furnaces) or in company vehicles." id="fuelCons">
                <InputWithUnitSelect id="fuelCons" type="number" min="0" step="0.01"
                  value={data.fuelOilConsumption} onChange={u('fuelOilConsumption')}
                  unitValue={data.fuelOilUnit} unitOptions={OIL_UNITS} onUnitChange={u('fuelOilUnit')} />
              </FormField>
            </div>
          </div>

          {/* GHG from scope 1 */}
          <div className="scope-sub-section">
            <p className="scope-sub-label">GHG emissions from these fuels</p>
            <FormField label="Total Scope 1 Emissions" required
              tooltip="Total direct GHG emissions from all owned or controlled sources." id="scope1Total">
              <Input id="scope1Total" type="number" min="0" step="0.01"
                value={data.scope1Emissions} onChange={u('scope1Emissions')} unit={gu} />
            </FormField>

            <div className="scope-breakdown">
              <p className="scope-breakdown-title">Optional breakdown by source</p>
              <div className="form-grid form-grid--2">
                <FormField label="Stationary Combustion"
                  tooltip="Boilers, furnaces, generators — fixed equipment that burns fuel on-site." id="scope1Stat">
                  <Input id="scope1Stat" type="number" min="0" step="0.01"
                    value={data.scope1Stationary} onChange={u('scope1Stationary')} unit={gu} />
                </FormField>
                <FormField label="Mobile Combustion"
                  tooltip="Company-owned or leased vehicles — cars, vans, trucks, forklifts." id="scope1Mob">
                  <Input id="scope1Mob" type="number" min="0" step="0.01"
                    value={data.scope1Mobile} onChange={u('scope1Mobile')} unit={gu} />
                </FormField>
                <FormField label="Fugitive Emissions"
                  tooltip="Refrigerant leaks from AC/cooling systems, gas leaks from pipelines." id="scope1Fug">
                  <Input id="scope1Fug" type="number" min="0" step="0.01"
                    value={data.scope1Fugitive} onChange={u('scope1Fugitive')} unit={gu} />
                </FormField>
                <FormField label="Process Emissions"
                  tooltip="GHGs released from chemical or physical processes (e.g. cement, fermentation)." id="scope1Proc">
                  <Input id="scope1Proc" type="number" min="0" step="0.01"
                    value={data.scope1Process} onChange={u('scope1Process')} unit={gu} />
                </FormField>
              </div>
              {scope1Sub > 0 && (
                <p className="scope-sub-sum">Breakdown sum: {scope1Sub.toFixed(2)} {gu}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SCOPE 2 ══════════════════════════════════════════════════════ */}
      <div className="scope-card scope-card--2">
        <div className="scope-card-header">
          <span className="scope-badge scope-badge--2">Scope 2</span>
          <div className="scope-header-text">
            <h4>Purchased Energy Emissions</h4>
            <p>Electricity, heat, or cooling you buy from external suppliers. The emissions happen at the power plant or heat source, not at your site.</p>
          </div>
        </div>

        <div className="scope-card-body">
          {/* Energy inputs */}
          <div className="scope-sub-section">
            <p className="scope-sub-label">Energy purchased</p>
            <div className="form-grid form-grid--2">
              <FormField label="Electricity" tooltip="Total electricity purchased from the grid or suppliers." id="elecCons">
                <Input id="elecCons" type="number" min="0" step="0.01"
                  value={data.electricityConsumption} onChange={u('electricityConsumption')} unit={data.energyUnit} />
              </FormField>
              <FormField label="District Heating / Cooling" tooltip="Heat or cooling bought from an external district network." id="districtCons">
                <Input id="districtCons" type="number" min="0" step="0.01"
                  value={data.districtHeatingConsumption} onChange={u('districtHeatingConsumption')} unit={data.energyUnit} />
              </FormField>
            </div>
          </div>

          {/* GHG from scope 2 */}
          <div className="scope-sub-section">
            <p className="scope-sub-label">GHG emissions from purchased energy</p>
            <div className="form-grid form-grid--2">
              <FormField label="Market-Based Emissions" required
                tooltip="Uses your supplier's specific emission factor or renewable certificates. This is the primary figure to report." id="scope2Market">
                <Input id="scope2Market" type="number" min="0" step="0.01"
                  value={data.scope2Emissions} onChange={u('scope2Emissions')} unit={gu} />
              </FormField>
              <FormField label="Location-Based Emissions"
                tooltip="Uses the average grid emission factor for your region. Optional but useful for comparison." id="scope2Loc">
                <Input id="scope2Loc" type="number" min="0" step="0.01"
                  value={data.scope2LocationBased} onChange={u('scope2LocationBased')} unit={gu} />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SCOPE 3 ══════════════════════════════════════════════════════ */}
      <div className="scope-card scope-card--3">
        <div className="scope-card-header">
          <span className="scope-badge scope-badge--3">Scope 3</span>
          <div className="scope-header-text">
            <h4>
              Value Chain Emissions
              <span className="scope-optional-tag">Optional</span>
            </h4>
            <p>All other indirect emissions — from your suppliers, logistics, business travel, employee commuting, and what happens when customers use your products. Voluntary for micro and small enterprises.</p>
          </div>
        </div>

        <div className="scope-card-body">
          <div className="scope-sub-section">
            <FormField label="Total Scope 3 Emissions"
              tooltip="You can report just the total without filling in each category below." id="scope3Total">
              <Input id="scope3Total" type="number" min="0" step="0.01"
                value={data.scope3Emissions} onChange={u('scope3Emissions')} unit={gu} />
            </FormField>

            <div className="scope-breakdown">
              <p className="scope-breakdown-title">Category breakdown</p>
              <div className="form-grid form-grid--2">
                <FormField label="Business Travel"
                  tooltip="Flights, trains, hotels, and rental cars for business trips." id="s3travel">
                  <Input id="s3travel" type="number" min="0" step="0.01"
                    value={data.scope3BusinessTravel} onChange={u('scope3BusinessTravel')} unit={gu} />
                </FormField>
                <FormField label="Employee Commuting"
                  tooltip="Emissions from employees travelling between home and work." id="s3commute">
                  <Input id="s3commute" type="number" min="0" step="0.01"
                    value={data.scope3Commuting} onChange={u('scope3Commuting')} unit={gu} />
                </FormField>
                <FormField label="Purchased Goods &amp; Services"
                  tooltip="Upstream emissions from raw materials and services you buy." id="s3goods">
                  <Input id="s3goods" type="number" min="0" step="0.01"
                    value={data.scope3PurchasedGoods} onChange={u('scope3PurchasedGoods')} unit={gu} />
                </FormField>
                <FormField label="Waste in Operations"
                  tooltip="Emissions from treating and disposing of waste your company produces." id="s3waste">
                  <Input id="s3waste" type="number" min="0" step="0.01"
                    value={data.scope3Waste} onChange={u('scope3Waste')} unit={gu} />
                </FormField>
                <FormField label="Upstream Transport"
                  tooltip="Logistics emissions from transporting goods to your facilities." id="s3upTrans">
                  <Input id="s3upTrans" type="number" min="0" step="0.01"
                    value={data.scope3UpstreamTransport} onChange={u('scope3UpstreamTransport')} unit={gu} />
                </FormField>
                <FormField label="Downstream Transport"
                  tooltip="Logistics emissions from distributing your products to customers." id="s3downTrans">
                  <Input id="s3downTrans" type="number" min="0" step="0.01"
                    value={data.scope3DownstreamTransport} onChange={u('scope3DownstreamTransport')} unit={gu} />
                </FormField>
                <FormField label="Use of Sold Products"
                  tooltip="Emissions when customers use your products (e.g. fuel burned in vehicles you sell)." id="s3use">
                  <Input id="s3use" type="number" min="0" step="0.01"
                    value={data.scope3UseOfProducts} onChange={u('scope3UseOfProducts')} unit={gu} />
                </FormField>
              </div>
              {scope3Sub > 0 && (
                <p className="scope-sub-sum">Breakdown sum: {scope3Sub.toFixed(2)} {gu}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TOTALS SUMMARY ═══════════════════════════════════════════════ */}
      <section className="form-section">
        <h3>Energy &amp; Emissions Summary</h3>
        <p className="section-desc">Enter total energy figures for the full reporting period. These cover all sources across all scopes.</p>

        <div className="energy-summary-grid">
          <FormField label="Total Energy Consumption" required
            tooltip="Sum of all energy consumed — electricity, gas, oil, district heat, and any other sources." id="totalEnergy">
            <Input id="totalEnergy" type="number" min="0" step="0.01"
              value={data.totalEnergyConsumption} onChange={u('totalEnergyConsumption')} unit={data.energyUnit} />
          </FormField>
          <FormField label="of which Renewable Energy"
            tooltip="Energy from solar, wind, hydro, biomass, geothermal, or certified green electricity." id="renewEnergy">
            <Input id="renewEnergy" type="number" min="0" step="0.01"
              value={data.renewableEnergyConsumption} onChange={u('renewableEnergyConsumption')} unit={data.energyUnit} />
          </FormField>
        </div>

        {renewablePercent !== '' && (
          <CalcField label="Renewable Energy Share" value={renewablePercent} unit="%" tooltip="Percentage of total energy from renewable sources." />
        )}
        {energyIntensity !== '' && (
          <CalcField label="Energy Intensity (per employee)" value={energyIntensity} unit={`${data.energyUnit}/employee`}
            tooltip="Total energy divided by number of employees." />
        )}

        {totalGHG > 0 && (
          <div className="ghg-totals" style={{ marginTop: 16 }}>
            <div className="ghg-total-chip ghg-total-chip--main">
              <div className="chip-label">Total GHG (Scope 1+2{scope3 > 0 ? '+3' : ''})</div>
              <div className="chip-value">{totalGHG.toFixed(2)}<span className="chip-unit">{gu}</span></div>
            </div>
            {scope1 > 0 && (
              <div className="ghg-total-chip">
                <div className="chip-label">Scope 1 share</div>
                <div className="chip-value">{((scope1 / totalGHG) * 100).toFixed(1)}<span className="chip-unit">%</span></div>
              </div>
            )}
            {scope2 > 0 && (
              <div className="ghg-total-chip">
                <div className="chip-label">Scope 2 share</div>
                <div className="chip-value">{((scope2 / totalGHG) * 100).toFixed(1)}<span className="chip-unit">%</span></div>
              </div>
            )}
            {scope3 > 0 && (
              <div className="ghg-total-chip">
                <div className="chip-label">Scope 3 share</div>
                <div className="chip-value">{((scope3 / totalGHG) * 100).toFixed(1)}<span className="chip-unit">%</span></div>
              </div>
            )}
          </div>
        )}

        {ghgIntensityRevenue && (
          <CalcField label="GHG Intensity (per M revenue)" value={ghgIntensityRevenue}
            unit={`${gu}/M${data.currency || 'EUR'}`}
            tooltip="Total GHG divided by revenue in millions. Revenue must be entered in B1." />
        )}
        {ghgIntensityEmployee && (
          <CalcField label="GHG Intensity (per employee)" value={ghgIntensityEmployee}
            unit={`${gu}/employee`} tooltip="Total GHG divided by headcount." />
        )}
      </section>

      {/* ══ ENERGY MANAGEMENT ════════════════════════════════════════════ */}
      <section className="form-section">
        <h3>Energy Management</h3>
        <FormField label="Does your company have an energy management system?"
          tooltip="E.g. ISO 50001 or equivalent structured approach to managing energy use.">
          <RadioGroup name="hasEMS" value={data.hasEnergyManagementSystem} onChange={u('hasEnergyManagementSystem')} options={YES_NO} />
        </FormField>
        <FormField label="Energy Reduction Target"
          tooltip="State any quantitative energy reduction or efficiency target and its baseline year." id="energyTarget">
          <Input id="energyTarget" value={data.energyReductionTarget} onChange={u('energyReductionTarget')}
            placeholder="e.g. Reduce energy intensity by 20% by 2030 vs. 2022 baseline" />
        </FormField>
        <FormField label="Energy Narrative" tooltip="Describe energy reduction measures, initiatives, and progress.">
          <RichEditor value={data.energyNarrative} onChange={u('energyNarrative')}
            placeholder="Describe your energy use context, efficiency measures taken, renewable energy procurement, and targets set…" />
        </FormField>
      </section>

      {/* ══ GHG TARGETS & METHODOLOGY ════════════════════════════════════ */}
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
        <FormField label="Calculation Methodology"
          tooltip="Describe the standard or tool used (e.g. GHG Protocol, ISO 14064, emission factors source).">
          <RichEditor value={data.methodologyDescription} onChange={u('methodologyDescription')}
            placeholder="Describe the methodology, emission factors used, organisational boundaries, and any exclusions…" />
        </FormField>
        <FormField label="GHG Narrative" tooltip="Describe key emission sources, reduction actions, and future plans.">
          <RichEditor value={data.ghgNarrative} onChange={u('ghgNarrative')}
            placeholder="Describe main emission sources, reduction measures taken, and forward-looking plans…" />
        </FormField>
      </section>

      {/* ══ SUPPORTING DOCUMENTS ═════════════════════════════════════════ */}
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
