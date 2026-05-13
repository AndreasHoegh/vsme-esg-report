import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step10_Social() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const male = parseFloat(data.trainingHoursMale) || 0
  const female = parseFloat(data.trainingHoursFemale) || 0
  const total = parseFloat(data.totalEmployees) || 0
  const avgHours = parseFloat(data.avgTrainingHours) || 0

  const maleTotal = parseFloat(data.maleEmployees) || 0
  const femaleTotal = parseFloat(data.femaleEmployees) || 0
  const maleAvgHours = male > 0 && maleTotal > 0 ? (male / maleTotal).toFixed(1) : ''
  const femaleAvgHours = female > 0 && femaleTotal > 0 ? (female / femaleTotal).toFixed(1) : ''

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B10</span>
        <div>
          <h2>Social Matters</h2>
          <p>Training, development, anti-discrimination, and community engagement.</p>
        </div>
      </div>

      <section className="form-section">
        <h3>Training &amp; Development</h3>
        <div className="form-grid form-grid--3">
          <FormField label="Average Training Hours per Employee"
            tooltip="Total training hours for all staff divided by total headcount during the year." id="avgTraining">
            <Input id="avgTraining" type="number" min="0" step="0.5"
              value={data.avgTrainingHours} onChange={u('avgTrainingHours')} unit="hours" />
          </FormField>
          <FormField label="Training Hours — Male Employees"
            tooltip="Total training hours delivered to male employees." id="trainingMale">
            <Input id="trainingMale" type="number" min="0" step="0.5"
              value={data.trainingHoursMale} onChange={u('trainingHoursMale')} unit="hours" />
          </FormField>
          <FormField label="Training Hours — Female Employees"
            tooltip="Total training hours delivered to female employees." id="trainingFemale">
            <Input id="trainingFemale" type="number" min="0" step="0.5"
              value={data.trainingHoursFemale} onChange={u('trainingHoursFemale')} unit="hours" />
          </FormField>
        </div>

        {maleAvgHours && <CalcField label="Avg. Training Hours — Male" value={maleAvgHours} unit="hrs/employee" tooltip="Training hours per male employee." />}
        {femaleAvgHours && <CalcField label="Avg. Training Hours — Female" value={femaleAvgHours} unit="hrs/employee" tooltip="Training hours per female employee." />}

        <FormField label={`Training Investment (${data.currency})`}
          tooltip="Total spend on employee training, development, and education." id="trainingInvest">
          <Input id="trainingInvest" type="number" min="0" step="100"
            value={data.trainingInvestment} onChange={u('trainingInvestment')} unit={data.currency} />
        </FormField>
        {data.trainingInvestment && total > 0 && (
          <CalcField
            label="Training Investment per Employee"
            value={(parseFloat(data.trainingInvestment) / total).toFixed(0)}
            unit={`${data.currency}/employee`}
            tooltip="Training spend divided by total employees."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Diversity &amp; Inclusion</h3>
        <FormField label="Does your company have an anti-discrimination or equal opportunities policy?"
          tooltip="A formal policy preventing discrimination based on gender, race, age, disability, etc.">
          <RadioGroup name="antiDisc" value={data.hasAntiDiscriminationPolicy} onChange={u('hasAntiDiscriminationPolicy')} options={YES_NO} />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Community Engagement</h3>
        <FormField label="Community Engagement Activities" tooltip="Describe charitable, volunteer, or local community programmes.">
          <RichEditor value={data.communityEngagement} onChange={u('communityEngagement')}
            placeholder="Describe any community investment, volunteering programmes, charitable contributions, or local partnerships…" />
        </FormField>
      </section>

      <section className="form-section">
        <h3>Social Narrative</h3>
        <FormField label="Social Context &amp; Initiatives" tooltip="Broader social context, challenges, and programmes.">
          <RichEditor value={data.socialNarrative} onChange={u('socialNarrative')}
            placeholder="Describe social programmes, inclusion initiatives, employee well-being measures, and community impacts…" />
        </FormField>
      </section>
    </div>
  )
}
