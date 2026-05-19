import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step9_Pay() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const employees = parseFloat(data.totalEmployees) || 0
  const injuries = parseFloat(data.workRelatedInjuries) || 0
  const lostDays = parseFloat(data.lostDays) || 0
  const fatalities = parseFloat(data.workRelatedFatalities) || 0
  const fatalitiesIll = parseFloat(data.fatalitiesFromIllHealth) || 0

  // VSME frequency rate formula: (accidents × 200,000) / (employees × 2,000) TEST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // = accidents × 100 / employees  → injuries per 200,000 hours worked
  const hoursWorked = employees * 2000
  const frequencyRate = injuries > 0 && employees > 0
    ? ((injuries * 200_000) / hoursWorked).toFixed(2) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B9</span>
        <div>
          <h2>Health &amp; Safety</h2>
          <p>Work-related accidents, fatalities, and health and safety management.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>VSME frequency rate formula:</strong> Accident frequency rate = (Number of accidents × 200,000) ÷ Total hours worked.
        Based on 100 employees × 2,000 hours/year = 200,000 reference hours. Auto-calculated from your employee count.
      </div>

      <section className="form-section">
        <h3>Work-Related Accidents</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="Number of Work-Related Accidents"
            required
            tooltip="Recordable work-related accidents occurring during the reporting period, excluding minor first-aid-only incidents."
            id="injuries"
          >
            <Input id="injuries" type="number" min="0" value={data.workRelatedInjuries} onChange={u('workRelatedInjuries')} />
          </FormField>
          <FormField
            label="Lost Working Days"
            tooltip="Total calendar days lost due to work-related accidents or occupational illness."
            id="lostDays"
          >
            <Input id="lostDays" type="number" min="0" value={data.lostDays} onChange={u('lostDays')} />
          </FormField>
        </div>

        {frequencyRate && (
          <CalcField
            label="Accident Frequency Rate (AFR)"
            value={frequencyRate}
            unit="per 200,000 hours"
            tooltip="VSME AFR = (Accidents × 200,000) ÷ (Employees × 2,000 hours). Based on total employees entered in B8."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Fatalities</h3>
        <p className="section-desc">VSME requires separate disclosure of fatalities from injuries and from ill-health.</p>
        <div className="form-grid form-grid--2">
          <FormField
            label="Fatalities from Work-Related Injuries"
            required
            tooltip="Number of employee deaths resulting directly from a work-related accident during the reporting period."
            id="fatalities"
          >
            <Input id="fatalities" type="number" min="0" value={data.workRelatedFatalities} onChange={u('workRelatedFatalities')} />
          </FormField>
          <FormField
            label="Fatalities from Work-Related Ill-Health"
            tooltip="Number of employee deaths resulting from occupational disease or work-related ill-health."
            id="fatalitiesIll"
          >
            <Input id="fatalitiesIll" type="number" min="0" value={data.fatalitiesFromIllHealth} onChange={u('fatalitiesFromIllHealth')} />
          </FormField>
        </div>
        {(fatalities + fatalitiesIll) > 0 && (
          <CalcField
            label="Total Fatalities"
            value={(fatalities + fatalitiesIll).toString()}
            unit="deaths"
            tooltip="Combined fatalities from injuries and ill-health."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Occupational Ill-Health</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="Cases of Work-Related Ill-Health"
            tooltip="Number of cases of occupational disease or ill-health diagnosed during the reporting period."
            id="illHealth"
          >
            <Input id="illHealth" type="number" min="0" value={data.workRelatedIllHealth} onChange={u('workRelatedIllHealth')} />
          </FormField>
          <FormField
            label="Sick Leave Days"
            tooltip="Total sick leave days (all causes) taken by employees during the reporting period."
            id="sickLeave"
          >
            <Input id="sickLeave" type="number" min="0" value={data.sickLeaveDays} onChange={u('sickLeaveDays')} />
          </FormField>
        </div>
      </section>

      <section className="form-section">
        <h3>OHS Management</h3>
        <FormField
          label="Does your company have a formal OHS management system?"
          tooltip="E.g. ISO 45001 certified system, or equivalent structured health and safety management approach."
        >
          <RadioGroup name="hasOHS" value={data.hasOHSManagementSystem} onChange={u('hasOHSManagementSystem')} options={YES_NO} />
        </FormField>
        {data.hasOHSManagementSystem === 'yes' && (
          <FormField label="Certification / Standard" tooltip="Name the certification or standard followed." id="ohsCert">
            <Input id="ohsCert" value={data.ohsCertification} onChange={u('ohsCertification')} placeholder="ISO 45001" />
          </FormField>
        )}
        <FormField label="Health &amp; Safety Narrative" tooltip="Describe safety culture, key risks, programmes, and improvement actions.">
          <RichEditor value={data.safetyNarrative} onChange={u('safetyNarrative')}
            placeholder="Describe your health and safety management approach, key workplace risks identified, training delivered, and any improvement initiatives…" />
        </FormField>
      </section>
    </div>
  )
}
