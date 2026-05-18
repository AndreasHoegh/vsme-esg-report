import React from 'react'
import { useForm } from '../../context/FormContext'
import '../StepContent.css'

const YES_NO_IP = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'in_progress', label: 'In Progress' },
]
const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const POLICY_AREAS = [
  {
    field: 'policyClimate',
    label: 'Climate change mitigation & adaptation',
    tooltip: 'Policies to reduce GHG emissions and adapt to climate risks.',
  },
  {
    field: 'policyPollution',
    label: 'Pollution',
    tooltip: 'Policies addressing air, water, soil or noise pollution.',
  },
  {
    field: 'policyWaterMarine',
    label: 'Water & marine resources',
    tooltip: 'Policies on water use, discharge, and marine environment protection.',
  },
  {
    field: 'policyBiodiversity',
    label: 'Biodiversity & ecosystems',
    tooltip: 'Policies to protect habitats, species, and ecosystem services.',
  },
  {
    field: 'policyCircular',
    label: 'Resource use & circular economy',
    tooltip: 'Policies on waste reduction, reuse, recycling, and material efficiency.',
  },
  {
    field: 'policyOwnWorkforce',
    label: 'Own workforce',
    tooltip: 'Policies on working conditions, health & safety, diversity, and fair pay for direct employees.',
  },
  {
    field: 'policyValueChain',
    label: 'Value chain workers',
    tooltip: 'Policies on labour standards in the supply chain and for contracted workers.',
  },
  {
    field: 'policyCommunities',
    label: 'Affected communities',
    tooltip: 'Policies on community engagement and impact on local communities.',
  },
  {
    field: 'policyConsumers',
    label: 'Consumers & end-users',
    tooltip: 'Policies on product safety, consumer privacy, and responsible marketing.',
  },
  {
    field: 'policyGovernance',
    label: 'Corporate governance & business conduct',
    tooltip: 'Policies on anti-corruption, ethics, tax transparency, and whistleblowing.',
  },
]

function InlineRadio({ name, value, onChange, options }) {
  return (
    <div className="inline-radio">
      {options.map(opt => (
        <label key={opt.value} className={`inline-radio-opt${value === opt.value ? ' inline-radio-opt--active' : ''}`}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function PolicyRow({ area }) {
  const { data, update } = useForm()
  const publicField  = area.field + 'Public'
  const targetsField = area.field + 'Targets'
  const policyValue  = data[area.field]
  const hasPolicy    = policyValue === 'yes' || policyValue === 'in_progress'

  function handlePolicyChange(val) {
    const updates = { [area.field]: val }
    if (!hasPolicy && val !== 'yes' && val !== 'in_progress') {
      updates[publicField]  = ''
      updates[targetsField] = ''
    }
    if (val === 'no') {
      updates[publicField]  = ''
      updates[targetsField] = ''
    }
    update(updates)
  }

  return (
    <div className="policy-row">
      <div className="policy-row-label">
        <span className="policy-row-name">{area.label}</span>
        {area.tooltip && <span className="policy-row-tooltip" title={area.tooltip}>ⓘ</span>}
      </div>
      <div className={`policy-row-cols${hasPolicy ? '' : ' policy-row-cols--single'}`}>
        <div className="policy-col">
          <span className="policy-col-head">Policy / Action in place?</span>
          <InlineRadio
            name={area.field}
            value={policyValue}
            onChange={handlePolicyChange}
            options={YES_NO_IP}
          />
        </div>
        {hasPolicy && (
          <>
            <div className="policy-col">
              <span className="policy-col-head">Publicly available?</span>
              <InlineRadio
                name={publicField}
                value={data[publicField]}
                onChange={val => update({ [publicField]: val })}
                options={YES_NO}
              />
            </div>
            <div className="policy-col">
              <span className="policy-col-head">Has quantitative targets?</span>
              <InlineRadio
                name={targetsField}
                value={data[targetsField]}
                onChange={val => update({ [targetsField]: val })}
                options={YES_NO}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Step2_Policies() {
  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B2</span>
        <div>
          <h2>Policies &amp; Commitments</h2>
          <p>Indicate whether your company has policies or actions for each of the 10 VSME sustainability topic areas.</p>
        </div>
      </div>

      <div className="info-box">
        For each topic area, answer three questions: (1) Does a policy or concrete action exist? (2) Is it publicly available? (3) Does it include measurable targets?
      </div>

      <section className="form-section">
        <h3>Sustainability Policy Matrix</h3>
        <div className="policy-table">
          {POLICY_AREAS.map(area => (
            <PolicyRow key={area.field} area={area} />
          ))}
        </div>
      </section>
    </div>
  )
}
