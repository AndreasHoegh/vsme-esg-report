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
  const { data, update } = useForm()
  const comprehensive = data.reportingModule === 'comprehensive'
  const adopted = POLICY_AREAS.filter(
    a => data[a.field] === 'yes' || data[a.field] === 'in_progress'
  )
  const setC2 = (bucket, field, val) =>
    update({ [bucket]: { ...(data[bucket] || {}), [field]: val } })

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

      {comprehensive && (
        <section className="form-section form-section--comprehensive">
          <div className="comprehensive-tag">Comprehensive Module · C2</div>
          <h3>Policy &amp; Action Descriptions</h3>
          <p className="section-desc">
            For each topic where you have a policy or action in place, describe
            the existing practices and any future initiatives or targets. These
            descriptions appear with the Policies section of the report.
          </p>
          {adopted.length === 0 ? (
            <p className="section-desc">
              Mark at least one topic as <em>Yes</em> or <em>In Progress</em> in
              the matrix above to describe it here.
            </p>
          ) : (
            <>
              {adopted.map(area => (
                <div key={area.field} className="form-field">
                  <label className="form-label">{area.label}</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={(data.c2Current || {})[area.field] || ''}
                    onChange={e => setC2('c2Current', area.field, e.target.value)}
                    placeholder={`Existing practices / policies / actions for ${area.label.toLowerCase()}…`}
                  />
                  <textarea
                    className="form-textarea"
                    rows={2}
                    style={{ marginTop: 8 }}
                    value={(data.c2Future || {})[area.field] || ''}
                    onChange={e => setC2('c2Future', area.field, e.target.value)}
                    placeholder={`Future initiatives / targets for ${area.label.toLowerCase()} (optional)…`}
                  />
                </div>
              ))}
              <div className="form-field">
                <label className="form-label">Highest management level responsible for implementation</label>
                <input
                  className="form-input"
                  value={data.c2ResponsibleLevel || ''}
                  onChange={e => update({ c2ResponsibleLevel: e.target.value })}
                  placeholder="e.g. Managing Director, Head of Sustainability"
                />
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
