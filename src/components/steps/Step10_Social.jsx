import React from 'react'
import { useForm } from '../../context/FormContext'
import { FormField, Input, RadioGroup, CalcField } from '../FormField'
import RichEditor from '../RichEditor'
import '../StepContent.css'

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

export default function Step10_Social() {
  const { data, update } = useForm()
  const u = (f) => (v) => update({ [f]: v })

  const empCount = parseFloat(data.employeeCount) || 0
  const show150Plus = empCount >= 150

  const maleAvg = parseFloat(data.maleAvgSalary) || 0
  const femaleAvg = parseFloat(data.femaleAvgSalary) || 0
  const payGap = maleAvg > 0 && femaleAvg > 0
    ? (((maleAvg - femaleAvg) / maleAvg) * 100).toFixed(1) : ''

  const totalEmp = parseFloat(data.totalEmployees) || 0
  const avgHoursM = parseFloat(data.avgTrainingHoursMale) || 0
  const avgHoursF = parseFloat(data.avgTrainingHoursFemale) || 0

  return (
    <div className="step-content">
      <div className="step-intro">
        <span className="step-badge">B10</span>
        <div>
          <h2>Pay, Collective Agreements &amp; Training</h2>
          <p>Minimum wage compliance, gender pay gap, collective bargaining coverage, and employee training.</p>
        </div>
      </div>

      {/* ── Pay ── */}
      <section className="form-section">
        <h3>Minimum Wage Compliance</h3>
        <FormField
          label="Does all pay meet or exceed the applicable statutory minimum wage?"
          required
          tooltip="Confirm that all employees, including part-time and temporary workers, are paid at or above the legal minimum wage in each country of operation."
        >
          <RadioGroup name="minWage" value={data.minimumWageCompliance} onChange={u('minimumWageCompliance')} options={YES_NO} />
        </FormField>
      </section>

      {show150Plus && (
        <section className="form-section">
          <h3>Gender Pay Gap</h3>
          <p className="section-desc">
            VSME requires companies with <strong>150 or more employees</strong> to disclose the gender pay gap.
            Your company has {Math.round(empCount)} employees — this disclosure is <strong>mandatory</strong>.
          </p>
          <div className="info-box">
            Gender pay gap = (Male average salary − Female average salary) ÷ Male average salary × 100.
            A positive number indicates men earn more on average.
          </div>
          <div className="form-grid form-grid--2">
            <FormField
              label={`Male Average Annual Salary (${data.currency || 'EUR'})`}
              tooltip="Average annual gross salary for all male employees."
              id="maleAvgSalary"
            >
              <Input id="maleAvgSalary" type="number" min="0" step="100"
                value={data.maleAvgSalary} onChange={u('maleAvgSalary')} unit={data.currency || 'EUR'} />
            </FormField>
            <FormField
              label={`Female Average Annual Salary (${data.currency || 'EUR'})`}
              tooltip="Average annual gross salary for all female employees."
              id="femaleAvgSalary"
            >
              <Input id="femaleAvgSalary" type="number" min="0" step="100"
                value={data.femaleAvgSalary} onChange={u('femaleAvgSalary')} unit={data.currency || 'EUR'} />
            </FormField>
          </div>
          {payGap !== '' && (
            <div className={`pay-gap-result ${parseFloat(payGap) > 10 ? 'pay-gap-high' : parseFloat(payGap) > 0 ? 'pay-gap-mid' : 'pay-gap-low'}`}>
              <span className="pay-gap-label">Gender Pay Gap</span>
              <span className="pay-gap-value">{payGap}%</span>
              <span className="pay-gap-desc">
                {parseFloat(payGap) > 10
                  ? 'Above EU average — consider a pay equity review'
                  : parseFloat(payGap) > 0
                  ? 'Moderate gap — monitor and review'
                  : 'Women earn as much or more than men on average'}
              </span>
            </div>
          )}
        </section>
      )}

      {!show150Plus && empCount > 0 && (
        <section className="form-section">
          <h3>Gender Pay Gap</h3>
          <div className="section-note">
            Gender pay gap disclosure is mandatory for companies with 150 or more employees. Your company has {Math.round(empCount)} employees — this disclosure is voluntary but recommended.
          </div>
          <div className="form-grid form-grid--2">
            <FormField label={`Male Average Annual Salary (${data.currency || 'EUR'})`} id="maleAvgSalaryOpt">
              <Input id="maleAvgSalaryOpt" type="number" min="0" step="100"
                value={data.maleAvgSalary} onChange={u('maleAvgSalary')} unit={data.currency || 'EUR'} />
            </FormField>
            <FormField label={`Female Average Annual Salary (${data.currency || 'EUR'})`} id="femaleAvgSalaryOpt">
              <Input id="femaleAvgSalaryOpt" type="number" min="0" step="100"
                value={data.femaleAvgSalary} onChange={u('femaleAvgSalary')} unit={data.currency || 'EUR'} />
            </FormField>
          </div>
          {payGap !== '' && (
            <CalcField label="Gender Pay Gap" value={payGap} unit="%" tooltip="Male avg. salary minus female avg. salary, as % of male avg." />
          )}
        </section>
      )}

      {/* ── Collective Bargaining ── */}
      <section className="form-section">
        <h3>Collective Bargaining</h3>
        <FormField
          label="Percentage of employees covered by collective bargaining agreements (%)"
          required
          tooltip="Include all employees covered by collective agreements, whether company-level or sector-level. Enter 0 if none apply."
          id="collectiveBargaining"
        >
          <Input id="collectiveBargaining" type="number" min="0" max="100" step="0.1"
            value={data.collectiveBargainingCoverage} onChange={u('collectiveBargainingCoverage')} unit="%" />
        </FormField>
      </section>

      {/* ── Training ── */}
      <section className="form-section">
        <h3>Training &amp; Development</h3>
        <p className="section-desc">Average training hours per employee, broken down by gender — required by VSME B10.</p>
        <div className="form-grid form-grid--3">
          <FormField
            label="Avg. Training Hours per Employee"
            required
            tooltip="Total training hours delivered to all employees, divided by total headcount."
            id="avgTraining"
          >
            <Input id="avgTraining" type="number" min="0" step="0.5"
              value={data.avgTrainingHours} onChange={u('avgTrainingHours')} unit="hrs" />
          </FormField>
          <FormField
            label="Avg. Training Hours — Male"
            required
            tooltip="Total training hours for male employees divided by number of male employees."
            id="trainingMale"
          >
            <Input id="trainingMale" type="number" min="0" step="0.5"
              value={data.avgTrainingHoursMale} onChange={u('avgTrainingHoursMale')} unit="hrs" />
          </FormField>
          <FormField
            label="Avg. Training Hours — Female"
            required
            tooltip="Total training hours for female employees divided by number of female employees."
            id="trainingFemale"
          >
            <Input id="trainingFemale" type="number" min="0" step="0.5"
              value={data.avgTrainingHoursFemale} onChange={u('avgTrainingHoursFemale')} unit="hrs" />
          </FormField>
        </div>
        <div className="form-grid form-grid--2">
          <FormField
            label="Avg. Training Hours — Other / Non-binary"
            tooltip="Average training hours for employees not identifying as male or female."
            id="trainingOther"
          >
            <Input id="trainingOther" type="number" min="0" step="0.5"
              value={data.avgTrainingHoursOther} onChange={u('avgTrainingHoursOther')} unit="hrs" />
          </FormField>
          <FormField
            label={`Training Investment (${data.currency || 'EUR'})`}
            tooltip="Total company spend on employee training, development, and education programmes."
            id="trainingInvest"
          >
            <Input id="trainingInvest" type="number" min="0" step="100"
              value={data.trainingInvestment} onChange={u('trainingInvestment')} unit={data.currency || 'EUR'} />
          </FormField>
        </div>
        {data.trainingInvestment && totalEmp > 0 && (
          <CalcField
            label="Training Investment per Employee"
            value={(parseFloat(data.trainingInvestment) / totalEmp).toFixed(0)}
            unit={`${data.currency || 'EUR'}/employee`}
            tooltip="Total training spend divided by total employees."
          />
        )}
      </section>

      <section className="form-section">
        <h3>Pay Narrative</h3>
        <FormField label="Pay &amp; Training Context" tooltip="Describe your approach to fair pay, training programmes, and any improvement actions.">
          <RichEditor value={data.payNarrative} onChange={u('payNarrative')}
            placeholder="Describe your pay philosophy, any pay equity reviews conducted, collective agreements in place, training programme focus areas, and actions taken to address gaps…" />
        </FormField>
      </section>
    </div>
  )
}
