import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO_CERT = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export default function Step8_Safety() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const injuries = parseFloat(data.workRelatedInjuries) || 0
  const lostDays = parseFloat(data.lostDays) || 0
  const total = parseFloat(data.totalEmployees) || 0

  // Frequency Rate = (Injuries × 1,000,000) / Hours Worked — approx assuming 2000h/year/employee
  const hoursWorked = total * 2000
  const frequencyRate = injuries > 0 && total > 0
    ? ((injuries * 1_000_000) / hoursWorked).toFixed(2) : ''
  const severityRate = lostDays > 0 && total > 0
    ? ((lostDays * 1_000_000) / hoursWorked).toFixed(2) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B8</span>
        <div>
          <h2>Health &amp; Safety</h2>
          <p>Work-related injuries, fatalities, and lost days across your workforce.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>Note:</strong> These figures should cover all employees (direct + contractors if on-site).
        Frequency and severity rates are auto-calculated based on an assumption of 2,000 working hours per employee per year.
      </div>

      <section className="form-section">
        <h3>Incident Data</h3>
        <div className="form-grid form-grid--3">
          <FormField label="Work-Related Injuries" required
            tooltip="Number of recordable work-related injuries (excluding minor first-aid-only incidents)." id="injuries">
            <Input id="injuries" type="number" min="0" value={data.workRelatedInjuries} onChange={u('workRelatedInjuries')} />
          </FormField>
          <FormField label="Work-Related Fatalities"
            tooltip="Number of deaths as a result of work-related injuries or illnesses." id="fatalities">
            <Input id="fatalities" type="number" min="0" value={data.workRelatedFatalities} onChange={u('workRelatedFatalities')} />
          </FormField>
          <FormField label="Lost Working Days"
            tooltip="Total number of calendar days lost due to work-related injuries or illnesses." id="lostDays">
            <Input id="lostDays" type="number" min="0" value={data.lostDays} onChange={u('lostDays')} />
          </FormField>
        </div>

        {frequencyRate && (
          <CalcField
            label="Injury Frequency Rate (IFR)"
            value={frequencyRate}
            unit="per million hours"
            tooltip="IFR = (Injuries × 1,000,000) ÷ Total hours worked. Based on 2,000 hrs/employee/year."
          />
        )}
        {severityRate && (
          <CalcField
            label="Severity Rate"
            value={severityRate}
            unit="lost days per million hours"
            tooltip="Severity Rate = (Lost days × 1,000,000) ÷ Total hours worked."
          />
        )}
      </section>

      <section className="form-section">
        <h3>OHS Management</h3>
        <FormField label="Does your company have a formal OHS management system?"
          tooltip="E.g. ISO 45001 certified system, or equivalent structured approach.">
          <RadioGroup name="hasOHS" value={data.hasOHSManagementSystem} onChange={u('hasOHSManagementSystem')} options={YES_NO_CERT} />
        </FormField>
        {data.hasOHSManagementSystem === 'yes' && (
          <FormField label="Certification / Standard"
            tooltip="Name the certification or standard followed, e.g. ISO 45001." id="ohsCert">
            <Input id="ohsCert" value={data.ohsCertification} onChange={u('ohsCertification')} placeholder="ISO 45001" />
          </FormField>
        )}
        <FormField label="Health &amp; Safety Narrative" tooltip="Describe safety culture, programmes, and improvement actions.">
          <RichEditor value={data.safetyNarrative} onChange={u('safetyNarrative')}
            placeholder="Describe your health and safety management approach, key risks, and improvement initiatives…" />
        </FormField>
      </section>
    </div>
  )
}
